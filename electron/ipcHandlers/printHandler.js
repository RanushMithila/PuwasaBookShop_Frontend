const { ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function runPythonPrint(event, receiptData) {
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
      try {
        await fs.promises.writeFile(
          outJson,
          JSON.stringify(billJson, null, 2),
          "utf8",
        );
        console.log("printHandler: last_bill.json updated");
        writeSuccess = true;
        try {
          const stat = await fs.promises.stat(outJson);
          writtenMTime = stat.mtime.toISOString();
        } catch (sErr) {}
        console.log(`printHandler: Wrote last_bill.json to ${outJson}`);
      } catch (err) {
        console.error("printHandler: Failed to write last_bill.json:", err);
      }

      try {
        const stage = Number(billJson.Balance || 0) !== 0 ? "final" : "interim";
        if (event && event.sender && event.sender.send) {
          event.sender.send("last-bill-updated", {
            BillID: billJson.BillID,
            Balance: billJson.Balance,
            writeStage: stage,
          });
        }
      } catch (notifyErr) {
        console.warn("printHandler: failed to notify renderer:", notifyErr);
      }

      return Object.assign(resultBase, { writeSuccess, writtenMTime });
    })();
  }

  // Non-write flow: run the print.exe using the existing last_bill.json (do NOT overwrite it)
  const exePath = path.join(printingDir, "print.exe");
  if (!fs.existsSync(exePath)) {
    resultBase.message = `print.exe not found at ${exePath}`;
    console.warn("printHandler:", resultBase.message);
    return resultBase;
  }

  if (!fs.existsSync(logoPath)) {
    console.warn(
      `printHandler: logo.png not found at ${logoPath}, continuing without logo`,
    );
  }

  return new Promise((resolve) => {
    console.log(
      "printHandler: Printing starts, invoking print.exe:",
      exePath,
      outJson,
    );
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
        console.warn("printHandler: print.exe error:", error.message);
        resolve(resultBase);
        return;
      }

      const pdfExists = fs.existsSync(outPdf);
      resultBase.printed = !!pdfExists;
      resultBase.pdfPath = pdfExists ? outPdf : null;
      if (!pdfExists)
        resultBase.message = "print.exe completed but PDF was not created";
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
