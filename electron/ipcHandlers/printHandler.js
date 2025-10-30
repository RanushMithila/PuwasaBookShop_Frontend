const { ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function runPythonPrint(receiptData) {
  // printing directory is sibling folder
  const printingDir = path.join(__dirname, "printing");
  const outJson = path.join(printingDir, "last_bill.json");
  const outPdf = path.join(printingDir, "last_python_bill.pdf");
  const logoPath = path.join(printingDir, "logo.png");

  // Normalize details
  const items = Array.isArray(receiptData.Details) ? receiptData.Details : [];
  const billId =
    receiptData.BillID || `INV-${new Date().getFullYear()}-${Date.now()}`;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const billJson = {
    BillID: String(billId),
    date: dateStr,
    CashierID: String(receiptData.CashierID || "1"),
    CustomerName: receiptData.CustomerName || "Unknown",
    CustomerFName: receiptData.CustomerFName || "",
    CustomerLName: receiptData.CustomerLName || "",
    Total: Number(receiptData.Total || 0),
    Discount: Number(receiptData.Discount || 0),
    Details: items.map((i) => ({
      ItemName: i.ItemName || "Unknown",
      QTY: Number(i.QTY || 1),
      UnitPrice: Number(i.UnitPrice || 0),
    })),
  };

  // Ensure printing folder exists
  if (!fs.existsSync(printingDir))
    fs.mkdirSync(printingDir, { recursive: true });

  // Write JSON (update last_bill.json)
  let writeSuccess = false;
  let writtenMTime = null;
  try {
    fs.writeFileSync(outJson, JSON.stringify(billJson, null, 2), "utf8");
    writeSuccess = true;
    try {
      const stat = fs.statSync(outJson);
      writtenMTime = stat.mtime.toISOString();
    } catch (sErr) {
      // ignore stat errors
    }
    console.log(`printHandler: Wrote last_bill.json to ${outJson}`);
  } catch (writeErr) {
    console.error("printHandler: Failed to write last_bill.json:", writeErr);
  }

  // Prepare diagnostics
  const exePath = path.join(printingDir, "print.exe");
  const resultBase = {
    success: true, // JSON was written successfully — treat that as overall success
    printed: false,
    bill: billJson,
    jsonPath: outJson,
    pdfPath: null,
    stdout: null,
    stderr: null,
    message: null,
  };

  // If print.exe missing, return JSON write success and diagnostics
  if (!fs.existsSync(exePath)) {
    resultBase.message = `print.exe not found at ${exePath}`;
    console.warn("printHandler:", resultBase.message);
    // include write diagnostics
    return Object.assign(resultBase, { writeSuccess, writtenMTime });
  }

  // If logo is missing, warn but continue — we only need to update JSON and run print.exe
  if (!fs.existsSync(logoPath)) {
    console.warn(
      `printHandler: logo.png not found at ${logoPath}, continuing without logo`
    );
  }

  // If we have print.exe and logo, attempt to run it but don't treat execution errors as fatal
  return new Promise((resolve) => {
    console.log("Invoking print.exe:", exePath, outJson);
    // Set an environment flag to instruct print.exe (if supported) to avoid physical printing
    const execOptions = {
      cwd: printingDir,
      windowsHide: true,
      timeout: 120000,
      env: Object.assign({}, process.env, { NO_HARDWARE_PRINT: "1" }),
    };

    execFile(exePath, [outJson], execOptions, (error, stdout, stderr) => {
      resultBase.stdout = stdout?.toString().trim();
      resultBase.stderr = stderr?.toString().trim();
      // include write diagnostics
      Object.assign(resultBase, { writeSuccess, writtenMTime });

      if (error) {
        resultBase.message = `print.exe failed: ${error.message}`;
        console.warn("printHandler: print.exe error:", error.message);
        // still return success:true because JSON was created
        resolve(resultBase);
        return;
      }

      // check if PDF was generated
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
    const result = await runPythonPrint(receiptData);
    return result;
  } catch (e) {
    console.error("print receipt failed:", e?.message || e);
    return {
      success: false,
      error: e?.message || String(e),
    };
  }
});
