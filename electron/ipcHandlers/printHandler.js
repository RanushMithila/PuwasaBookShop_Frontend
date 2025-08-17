const { ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

// Optional native printer module (not required for Python path)
try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  require('printer');
  console.log('Printer module loaded successfully');
} catch (err) {
  console.warn('Printer module not available (optional):', err.message);
}

function runPythonPrint(receiptData) {
  const scriptPath = path.join(__dirname, 'printing', 'main.py');
  const payload = JSON.stringify(receiptData || {});
  const isWin = process.platform === 'win32';

  const candidates = isWin
    ? [
        { cmd: 'py', args: ['-3'] },
        { cmd: 'py', args: [] },
        { cmd: 'python', args: [] },
        { cmd: 'python3', args: [] },
      ]
    : [
        { cmd: 'python3', args: [] },
        { cmd: 'python', args: [] },
      ];

  return new Promise((resolve, reject) => {
    const tryNext = (index = 0) => {
      if (index >= candidates.length) {
        reject(new Error('No suitable Python interpreter found on PATH.'));
        return;
      }

      const { cmd, args } = candidates[index];
      const finalArgs = [...args, scriptPath, payload];

      execFile(cmd, finalArgs, { windowsHide: true, timeout: 60000 }, (error, stdout, stderr) => {
        const out = (stdout || '').toString().trim();
        const errOut = (stderr || '').toString().trim();

        if (!error) {
          let printer;
          const m = /Print job sent successfully to\s+(.+)/i.exec(out);
          if (m && m[1]) printer = m[1].trim();
          resolve({ success: true, printer, message: out });
          return;
        }

        // If interpreter not found or generic failure, try next candidate; otherwise surface error
        const code = typeof error.code === 'number' ? error.code : undefined;
        const msg = errOut || out || error.message || 'Python execution failed.';

        // 1/127 often indicate command not found; keep trying.
        if (code === 1 || code === 127) {
          tryNext(index + 1);
          return;
        }
        reject(new Error(msg));
      });
    };
    tryNext(0);
  });
}

ipcMain.handle('print-receipt', async (event, receiptData = {}) => {
  console.log('print receipt: receiptData:', receiptData);
  try {
    const result = await runPythonPrint(receiptData);
    return result;
  } catch (e) {
    console.error('print receipt: failed:', e?.message || e);
    return { success: false, error: e?.message || String(e) };
  }
});
