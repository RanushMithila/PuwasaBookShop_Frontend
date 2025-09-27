const { ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

function runHello(payload = {}) {
  const scriptPath = path.join(__dirname, 'printing', 'hello.py');
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

  const payloadStr = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const tryNext = (index = 0) => {
      if (index >= candidates.length) {
        reject(new Error('No suitable Python interpreter found on PATH.'));
        return;
      }
      const { cmd, args } = candidates[index];
      const finalArgs = [...args, scriptPath, payloadStr];
      execFile(cmd, finalArgs, { windowsHide: true, timeout: 30000 }, (error, stdout, stderr) => {
        if (!error) {
          resolve({ success: true, stdout: stdout?.toString() || '', stderr: stderr?.toString() || '' });
          return;
        }
        const code = typeof error.code === 'number' ? error.code : undefined;
        if (code === 1 || code === 127) {
          tryNext(index + 1);
          return;
        }
        reject(error);
      });
    };
    tryNext(0);
  });
}

ipcMain.handle('run-hello', async (event, payload) => {
  try {
    const result = await runHello(payload);
    return result;
  } catch (e) {
    return { success: false, error: e?.message || String(e) };
  }
});
