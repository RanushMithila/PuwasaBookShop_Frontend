const { ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function runPythonPrint(event, receiptData) {
  // Helper: log to terminal AND forward to renderer DevTools
  const logToRenderer = (level, ...args) => {
    const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else console.log(...args);
    try {
      if (event && event.sender && !event.sender.isDestroyed()) {
        event.sender.send('main-log', { level, message: msg });
      }
    } catch (_) {}
  };

  const printingDir = path.join("D:\\", "printing");
  const outJson = path.join(printingDir, "last_bill.json");
  const outPdf = path.join(printingDir, "last_python_bill.pdf");
  const logoPath = path.join(printingDir, "logo.png");

  const items = Array.isArray(receiptData.Details) ? receiptData.Details : [];
  const billId =
    receiptData.BillID || `INV-${new Date().getFullYear()}-${Date.now()}`;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const billJson = {
    BillID: String(billId),
    date: dateStr,
    ShopName: receiptData.ShopName || "",
    ShopEmail: receiptData.ShopEmail || "",
    ShopPhone: receiptData.ShopPhone || "",
    ShopAddress: receiptData.ShopAddress || "",
    ShopCity: receiptData.ShopCity || "",
    ShopLocation: receiptData.ShopLocation || "",
    CashierID: String(receiptData.CashierID || "1"),
    CashierName: receiptData.CashierName || "",
    CustomerName: receiptData.CustomerName || "Unknown",
    CustomerFName: receiptData.CustomerFName || "",
    CustomerLName: receiptData.CustomerLName || "",
    Subtotal: Number(receiptData.Subtotal || 0),
    Total: Number(receiptData.Total || 0),
    Discount: Number(receiptData.Discount || 0),
    CashAmount: Number(receiptData.CashAmount || 0),
    CardAmount: Number(receiptData.CardAmount || 0),
    ChequeAmount: Number(receiptData.ChequeAmount || 0),
    VoucherAmount: Number(receiptData.VoucherAmount || 0),
    Balance: Number(receiptData.Balance || 0),
    Details: items.map((i) => ({
      ItemName: i.ItemName || "Unknown",
      QTY: Number(i.QTY || 1),
      UnitPrice: Number(i.UnitPrice || 0),
      Discount: Number(i.Discount || 0),
    })),
  };

  if (!fs.existsSync(printingDir))
    fs.mkdirSync(printingDir, { recursive: true });

  const resultBase = {
    success: true,
    printed: false,
    bill: billJson,
    jsonPath: outJson,
    pdfPath: null,
    stdout: null,
    stderr: null,
    message: null,
  };

  // Write-only flow: used by Save — write last_bill.json and notify renderer (interim/final)
  if (receiptData && receiptData.WriteOnly) {
    return (async () => {
      let writeSuccess = false;
      let writtenMTime = null;
      logToRenderer('log', `printHandler [WriteOnly]: START writing last_bill.json to ${outJson}`);
      logToRenderer('log', `printHandler [WriteOnly]: BillID=${billJson.BillID}, Total=${billJson.Total}, Balance=${billJson.Balance}`);
      try {
        await fs.promises.writeFile(
          outJson,
          JSON.stringify(billJson, null, 2),
          "utf8",
        );
        writeSuccess = true;
        try {
          const stat = await fs.promises.stat(outJson);
          writtenMTime = stat.mtime.toISOString();
        } catch (sErr) {}
        logToRenderer('log', `printHandler [WriteOnly]: DONE writing last_bill.json (mtime=${writtenMTime})`);
      } catch (err) {
        logToRenderer('error', 'printHandler [WriteOnly]: FAILED to write last_bill.json:', err);
      }

      try {
        const stage = Number(billJson.Balance || 0) !== 0 ? "final" : "interim";
        logToRenderer('log', `printHandler [WriteOnly]: Notifying renderer (writeStage=${stage})`);
        if (event && event.sender && event.sender.send) {
          event.sender.send("last-bill-updated", {
            BillID: billJson.BillID,
            Balance: billJson.Balance,
            writeStage: stage,
          });
        }
      } catch (notifyErr) {
        logToRenderer('warn', 'printHandler [WriteOnly]: failed to notify renderer:', notifyErr);
      }

      return Object.assign(resultBase, { writeSuccess, writtenMTime });
    })();
  }

  // Non-write flow: run the print.exe using the existing last_bill.json (do NOT overwrite it)
  logToRenderer('log', `printHandler [Print]: Preparing to invoke print.exe (reading last_bill.json from ${outJson})`);

  // Read and log the bill that will be printed from disk
  let billFromDisk = null;
  try {
    if (fs.existsSync(outJson)) {
      const diskContent = fs.readFileSync(outJson, 'utf8');
      billFromDisk = JSON.parse(diskContent);
      logToRenderer('log', `printHandler [Print]: Current last_bill.json content: BillID=${billFromDisk.BillID}, Total=${billFromDisk.Total}, Balance=${billFromDisk.Balance}, Items=${(billFromDisk.Details || []).length}`);
      logToRenderer('log', `printHandler [Print]: Full bill data: ${JSON.stringify(billFromDisk)}`);
    } else {
      logToRenderer('warn', `printHandler [Print]: last_bill.json not found at ${outJson}`);
    }
  } catch (readErr) {
    logToRenderer('warn', `printHandler [Print]: Failed to read last_bill.json: ${readErr.message}`);
  }
  resultBase.billFromDisk = billFromDisk;

  const exePath = path.join(printingDir, "print.exe");
  if (!fs.existsSync(exePath)) {
    resultBase.message = `print.exe not found at ${exePath}`;
    logToRenderer('warn', 'printHandler [Print]:', resultBase.message);
    return resultBase;
  }

  if (!fs.existsSync(logoPath)) {
    logToRenderer('warn', `printHandler [Print]: logo.png not found at ${logoPath}, continuing without logo`);
  }

  return new Promise((resolve) => {
    logToRenderer('log', `printHandler [Print]: START invoking print.exe: ${exePath} ${outJson}`);
    const execOptions = {
      cwd: printingDir,
      windowsHide: true,
      timeout: 120000,
      env: Object.assign({}, process.env),
    };

    execFile(exePath, [outJson], execOptions, (error, stdout, stderr) => {
      resultBase.stdout = stdout?.toString().trim();
      resultBase.stderr = stderr?.toString().trim();

      if (error) {
        resultBase.message = `print.exe failed: ${error.message}`;
        logToRenderer('warn', 'printHandler [Print]: print.exe FAILED:', error.message);
        resolve(resultBase);
        return;
      }

      const pdfExists = fs.existsSync(outPdf);
      resultBase.printed = !!pdfExists;
      resultBase.pdfPath = pdfExists ? outPdf : null;
      if (!pdfExists)
        resultBase.message = "print.exe completed but PDF was not created";
      logToRenderer('log', `printHandler [Print]: print.exe DONE (printed=${resultBase.printed}, pdf=${pdfExists ? outPdf : 'not created'})`);
      resolve(resultBase);
    });
  });
}

ipcMain.handle("print-receipt", async (event, receiptData = {}) => {
  try {
    console.log("Received receiptData:", receiptData);
    const result = await runPythonPrint(event, receiptData);
    return result;
  } catch (e) {
    console.error("print receipt failed:", e?.message || e);
    return { success: false, error: e?.message || String(e) };
  }
});

ipcMain.handle("print-voucher", async (event, voucherData = {}) => {
  try {
    console.log("Received voucherData:", voucherData);
    const printingDir = path.join("D:\\", "printing");
    const outJson = path.join(printingDir, "voucher.json");

    if (!fs.existsSync(printingDir))
      fs.mkdirSync(printingDir, { recursive: true });

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const voucherJson = {
      RefundID: String(voucherData.RefundID || ""),
      VoucherCode: String(voucherData.VoucherCode || ""),
      ExpireDate: String(voucherData.ExpireDate || ""),
      BillID: String(voucherData.BillID || ""),
      RefundTotal: Number(voucherData.RefundTotal || 0),
      date: dateStr,
    };

    await fs.promises.writeFile(
      outJson,
      JSON.stringify(voucherJson, null, 2),
      "utf8",
    );
    console.log("Voucher JSON written to:", outJson);

    // WriteOnly flow: just write voucher.json, don't run print.exe
    if (voucherData.WriteOnly) {
      console.log("Voucher WriteOnly mode — skipping print.exe");
      return {
        success: true,
        printed: false,
        writeOnly: true,
        jsonPath: outJson,
        voucher: voucherJson,
      };
    }

    const exePath = path.join(printingDir, "print.exe");
    if (!fs.existsSync(exePath)) {
      return {
        success: true,
        printed: false,
        message: `print.exe not found at ${exePath}`,
        jsonPath: outJson,
        voucher: voucherJson,
      };
    }

    return new Promise((resolve) => {
      const execOptions = {
        cwd: printingDir,
        windowsHide: true,
        timeout: 120000,
        env: Object.assign({}, process.env),
      };

      execFile(exePath, [outJson], execOptions, (error, stdout, stderr) => {
        if (error) {
          console.warn("print.exe failed for voucher:", error.message);
          resolve({
            success: true,
            printed: false,
            message: `print.exe failed: ${error.message}`,
            jsonPath: outJson,
            voucher: voucherJson,
          });
          return;
        }
        console.log("Voucher print.exe completed successfully");
        resolve({
          success: true,
          printed: true,
          jsonPath: outJson,
          voucher: voucherJson,
          stdout: stdout?.toString().trim(),
          stderr: stderr?.toString().trim(),
        });
      });
    });
  } catch (e) {
    console.error("print voucher failed:", e?.message || e);
    return { success: false, error: e?.message || String(e) };
  }
});

