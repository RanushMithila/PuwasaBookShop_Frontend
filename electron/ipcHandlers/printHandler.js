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
    Total: Number(receiptData.Total || 0),
    Discount: Number(receiptData.Discount || 0),
    Details: items.map((i) => ({
      ItemName: i.ItemName || "Unknown",
      QTY: Number(i.QTY || 1),
      UnitPrice: Number(i.UnitPrice || 0),
    })),
  };

  // Ensure printing folder exists
  if (!fs.existsSync(printingDir)) fs.mkdirSync(printingDir, { recursive: true });

  // Write JSON
  fs.writeFileSync(outJson, JSON.stringify(billJson, null, 2), "utf8");

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

  // If print.exe missing or logo missing, return JSON write success and diagnostics
  if (!fs.existsSync(exePath)) {
    resultBase.message = `print.exe not found at ${exePath}`;
    console.warn('printHandler:', resultBase.message);
    return resultBase;
  }
  if (!fs.existsSync(logoPath)) {
    resultBase.message = `logo.png not found at ${logoPath}`;
    console.warn('printHandler:', resultBase.message);
    return resultBase;
  }

  // If we have print.exe and logo, attempt to run it but don't treat execution errors as fatal
  return new Promise((resolve) => {
    console.log("Invoking print.exe:", exePath, outJson, logoPath);
    execFile(
      exePath,
      [outJson],
      { cwd: printingDir, windowsHide: true, timeout: 120000 },
      (error, stdout, stderr) => {
        resultBase.stdout = stdout?.toString().trim();
        resultBase.stderr = stderr?.toString().trim();
        if (error) {
          resultBase.message = `print.exe failed: ${error.message}`;
          console.warn('printHandler: print.exe error:', error.message);
          // still return success:true because JSON was created
          resolve(resultBase);
          return;
        }

        // check if PDF was generated
        const pdfExists = fs.existsSync(outPdf);
        resultBase.printed = !!pdfExists;
        resultBase.pdfPath = pdfExists ? outPdf : null;
        if (!pdfExists) resultBase.message = 'print.exe completed but PDF was not created';
        resolve(resultBase);
      }
    );
  });
}

ipcMain.handle("print-receipt", async (event, receiptData = {}) => {
  try {
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
