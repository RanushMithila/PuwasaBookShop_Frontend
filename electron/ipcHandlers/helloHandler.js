const { ipcMain } = require("electron");

/**
 * Placeholder IPC handler for hello/ping functionality.
 * This file is required by main.js - do not remove.
 */
ipcMain.handle("hello", async () => {
  return { success: true, message: "Hello from Electron!" };
});
