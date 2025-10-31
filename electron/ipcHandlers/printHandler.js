const { ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function runPythonPrint(event, receiptData) {
  const printingDir = path.join(__dirname, 'printing');
  const outJson = path.join(printingDir, 'last_bill.json');
  const outPdf = path.join(printingDir, 'last_python_bill.pdf');
  const logoPath = path.join(printingDir, 'logo.png');

  const items = Array.isArray(receiptData.Details) ? receiptData.Details : [];
  const billId = receiptData.BillID || `INV-${new Date().getFullYear()}-${Date.now()}`;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const billJson = {
    BillID: String(billId),
    date: dateStr,
    CashierID: String(receiptData.CashierID || '1'),
    CustomerName: receiptData.CustomerName || 'Unknown',
    CustomerFName: receiptData.CustomerFName || '',
    CustomerLName: receiptData.CustomerLName || '',
    Total: Number(receiptData.Total || 0),
    Discount: Number(receiptData.Discount || 0),
    CashAmount: Number(receiptData.CashAmount || 0),
    CardAmount: Number(receiptData.CardAmount || 0),
    Balance: Number(receiptData.Balance || 0),
    Details: items.map((i) => ({
      ItemName: i.ItemName || 'Unknown',
      QTY: Number(i.QTY || 1),
      UnitPrice: Number(i.UnitPrice || 0),
    })),
  };

  if (!fs.existsSync(printingDir)) fs.mkdirSync(printingDir, { recursive: true });

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
    let writeSuccess = false;
    let writtenMTime = null;
    try {
      fs.writeFileSync(outJson, JSON.stringify(billJson, null, 2), 'utf8');
      writeSuccess = true;
      try { const stat = fs.statSync(outJson); writtenMTime = stat.mtime.toISOString(); } catch (sErr) { }
      console.log(`printHandler: Wrote last_bill.json to ${outJson}`);
    } catch (err) {
      console.error('printHandler: Failed to write last_bill.json:', err);
    }

    try {
      const stage = Number(billJson.Balance || 0) !== 0 ? 'final' : 'interim';
      if (event && event.sender && event.sender.send) {
        event.sender.send('last-bill-updated', { BillID: billJson.BillID, Balance: billJson.Balance, writeStage: stage });
      }
    } catch (notifyErr) {
      console.warn('printHandler: failed to notify renderer:', notifyErr);
    }

    return Object.assign(resultBase, { writeSuccess, writtenMTime });
  }

  // Non-write flow: run the print.exe using the existing last_bill.json (do NOT overwrite it)
  const exePath = path.join(printingDir, 'print.exe');
  if (!fs.existsSync(exePath)) { resultBase.message = `print.exe not found at ${exePath}`; console.warn('printHandler:', resultBase.message); return resultBase; }
  if (!fs.existsSync(logoPath)) console.warn(`printHandler: logo.png not found at ${logoPath}, continuing without logo`);

  return new Promise((resolve) => {
    console.log('Invoking print.exe:', exePath, outJson);
    const execOptions = { cwd: printingDir, windowsHide: true, timeout: 120000, env: Object.assign({}, process.env) };
    execFile(exePath, [outJson], execOptions, (error, stdout, stderr) => {
      resultBase.stdout = stdout?.toString().trim();
      resultBase.stderr = stderr?.toString().trim();
      if (error) { resultBase.message = `print.exe failed: ${error.message}`; console.warn('printHandler: print.exe error:', error.message); resolve(resultBase); return; }
      const pdfExists = fs.existsSync(outPdf);
      resultBase.printed = !!pdfExists; resultBase.pdfPath = pdfExists ? outPdf : null; if (!pdfExists) resultBase.message = 'print.exe completed but PDF was not created';
      resolve(resultBase);
    });
  });
}

ipcMain.handle('print-receipt', async (event, receiptData = {}) => {
  try { console.log('Received receiptData:', receiptData); const result = await runPythonPrint(event, receiptData); return result; } catch (e) { console.error('print receipt failed:', e?.message || e); return { success: false, error: e?.message || String(e) }; }
});

const { ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function runPythonPrint(event, receiptData) {
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
    // Include payment breakdown and balance if provided by the renderer
    CashAmount: Number(receiptData.CashAmount || 0),
    CardAmount: Number(receiptData.CardAmount || 0),
    Balance: Number(receiptData.Balance || 0),
    Details: items.map((i) => ({
      ItemName: i.ItemName || "Unknown",
      QTY: Number(i.QTY || 1),
      UnitPrice: Number(i.UnitPrice || 0),
    })),
  };

  // Ensure printing folder exists
  if (!fs.existsSync(printingDir)) fs.mkdirSync(printingDir, { recursive: true });

  // Diagnostic base
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

  // If caller asked for a write-only update (used by Save flow), write last_bill.json and return diagnostics
  if (receiptData && receiptData.WriteOnly) {
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

    // notify renderer that last_bill.json was updated and whether it's interim or final
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
  }

  // Not a write-only call -> run the real print executable using the existing last_bill.json
  const exePath = path.join(printingDir, "print.exe");

  if (!fs.existsSync(exePath)) {
    resultBase.message = `print.exe not found at ${exePath}`;
    console.warn("printHandler:", resultBase.message);
    return resultBase;
  }

  // If logo is missing, warn but continue
  if (!fs.existsSync(logoPath)) {
    console.warn(
      `printHandler: logo.png not found at ${logoPath}, continuing without logo`
    );
  }

  // Run the print executable using the existing last_bill.json; do not overwrite the JSON here
  return new Promise((resolve) => {
    console.log("Invoking print.exe:", exePath, outJson);
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
      if (!pdfExists) resultBase.message = "print.exe completed but PDF was not created";
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
    return {
      success: false,
      error: e?.message || String(e),
    };
  }
});

const { ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

function runPythonPrint(receiptData) {
function runPythonPrint(event, receiptData) {
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
    // Include payment breakdown and balance if provided by the renderer
    CashAmount: Number(receiptData.CashAmount || 0),
    CardAmount: Number(receiptData.CardAmount || 0),
    Balance: Number(receiptData.Balance || 0),
    Details: items.map((i) => ({
      ItemName: i.ItemName || "Unknown",
      QTY: Number(i.QTY || 1),
      UnitPrice: Number(i.UnitPrice || 0),
    })),
  };

  // Ensure printing folder exists
  if (!fs.existsSync(printingDir))
    fs.mkdirSync(printingDir, { recursive: true });

  // If caller asked for a write-only update, write last_bill.json and return diagnostics
  if (receiptData && receiptData.WriteOnly) {
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

    // notify renderer that last_bill.json was updated and whether it's interim or final
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
  }

  // If the renderer requested a write-only update, return diagnostics now
  if (receiptData && receiptData.WriteOnly) {
    const roMsg = "write-only: last_bill.json updated (renderer requested)";
    console.log("printHandler:", roMsg, { writeSuccess, writtenMTime });
    return Object.assign({
      success: true,
      printed: false,
      bill: billJson,
      jsonPath: outJson,
      pdfPath: null,
      stdout: null,
      stderr: null,
      message: roMsg,
    }, { writeSuccess, writtenMTime });
  }

  // If print.exe missing, return diagnostics but do not write/update last_bill.json
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
    return Object.assign(resultBase, { writeSuccess, writtenMTime });
  }
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

  // If logo is missing, warn but continue — we only need to run print.exe using existing last_bill.json
  if (!fs.existsSync(logoPath)) {
    console.warn(
      `printHandler: logo.png not found at ${logoPath}, continuing without logo`
    );
  }

  // Attempt to run print.exe using the existing last_bill.json; do not overwrite the file here
  return new Promise((resolve) => {
    console.log("Invoking print.exe:", exePath, outJson);
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
      if (!pdfExists) resultBase.message = "print.exe completed but PDF was not created";
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
    return {
      success: false,
      error: e?.message || String(e),
    };
  }
});
