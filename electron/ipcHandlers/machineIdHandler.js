const { ipcMain } = require("electron");
const { machineIdSync } = require("node-machine-id");

/**
 * IPC handler to get the unique machine ID.
 * Returns the hashed (SHA-256) machine ID by default.
 */
ipcMain.handle("get-machine-id", async () => {
  try {
    // Get hashed machine ID (default behavior)
    const id = machineIdSync();
    console.log("Machine ID fetched:", id);
    return { success: true, machineId: id };
  } catch (error) {
    console.error("Failed to get machine ID:", error);
    return { success: false, error: error.message };
  }
});
