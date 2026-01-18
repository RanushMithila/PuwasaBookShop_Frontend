import httpClient from "./HttpClient";

/**
 * CashRegisterService - Handles all cash register related API calls
 * including device registration, open state check, and opening amount.
 */

/**
 * Gets the unique machine ID from Electron main process.
 * @returns {Promise<string>} The machine ID
 */
export const getMachineId = async () => {
  try {
    if (!window?.electron?.ipcRenderer) {
      console.error("IPC not available - not running in Electron");
      throw new Error("Machine ID is only available in Electron environment");
    }
    const result = await window.electron.ipcRenderer.invoke("get-machine-id");
    console.log("getMachineId result:", result);
    if (result.success) {
      return result.machineId;
    } else {
      throw new Error(result.error || "Failed to get machine ID");
    }
  } catch (error) {
    console.error("getMachineId failed:", error);
    throw error;
  }
};

/**
 * Checks if a device is registered as a cash register.
 * @param {string} deviceId - The unique device/machine ID
 * @returns {Promise<object>} API response with register info or not found
 */
export const getRegisterByDeviceId = async (deviceId) => {
  try {
    console.log("Checking register for device:", deviceId);
    const response = await httpClient.get(
      `/cashregister/get/${deviceId}`,
      true
    );
    console.log("getRegisterByDeviceId response:", response);
    return response;
  } catch (error) {
    console.error("getRegisterByDeviceId failed:", error);
    throw error;
  }
};

/**
 * Creates a new cash register for a device.
 * @param {number} locationId - The location ID
 * @param {string} registerName - Name for the register
 * @param {string} deviceId - The unique device/machine ID
 * @returns {Promise<object>} API response
 */
export const createRegister = async (locationId, registerName, deviceId) => {
  try {
    console.log("Creating register:", { locationId, registerName, deviceId });
    const response = await httpClient.post(
      "/cashregister/create",
      {
        LocationID: locationId,
        RegisterName: registerName,
        DeviceID: deviceId,
      },
      true
    );
    console.log("createRegister response:", response);
    return response;
  } catch (error) {
    console.error("createRegister failed:", error);
    throw error;
  }
};

/**
 * Checks if a cash register is in open state.
 * @param {string} deviceId - The unique device/machine ID
 * @returns {Promise<object>} API response with isOpen boolean
 */
export const checkRegisterOpen = async (deviceId) => {
  try {
    console.log("Checking if register is open for device:", deviceId);
    const response = await httpClient.get(
      `/cashregister/isOpen/${deviceId}`,
      true
    );
    console.log("checkRegisterOpen response:", response);
    return response;
  } catch (error) {
    console.error("checkRegisterOpen failed:", error);
    throw error;
  }
};

/**
 * Sets the opening amount for a cash register session.
 * @param {string} deviceId - The unique device/machine ID
 * @param {number} openingAmount - The opening cash amount
 * @returns {Promise<object>} API response with SessionID
 */
export const setOpeningAmount = async (deviceId, openingAmount) => {
  try {
    console.log("Setting opening amount:", { deviceId, openingAmount });
    const response = await httpClient.post(
      "/cashregister/setOpeningAmount",
      {
        DeviceID: deviceId,
        OpeningAmount: openingAmount,
      },
      true
    );
    console.log("setOpeningAmount response:", response);
    return response;
  } catch (error) {
    console.error("setOpeningAmount failed:", error);
    throw error;
  }
};

/**
 * Sets the closing amount for a cash register session.
 * @param {string} deviceId - The unique device/machine ID
 * @param {number} closingAmount - The total closing cash amount
 * @param {object} notes - Object with denomination counts { "1": count, "2": count, ... "5000": count }
 * @returns {Promise<object>} API response
 */
export const setClosingAmount = async (deviceId, closingAmount, notes) => {
  try {
    console.log("Setting closing amount:", { deviceId, closingAmount, notes });
    const response = await httpClient.post(
      "/cashregister/setClosingAmount",
      {
        DeviceID: deviceId,
        ClosingAmount: closingAmount,
        notes: notes,
      },
      true
    );
    console.log("setClosingAmount response:", response);
    return response;
  } catch (error) {
    console.error("setClosingAmount failed:", error);
    throw error;
  }
};

/**
 * Records a cash in/out transaction.
 * @param {string} deviceId - The unique device/machine ID
 * @param {number} amount - The transaction amount
 * @param {boolean} type - true for Cash In, false for Cash Out
 * @param {string} reason - The reason for the transaction
 * @returns {Promise<object>} API response with TransactionID
 */
export const cashInOut = async (deviceId, amount, type, reason) => {
  try {
    console.log("Recording cash in/out:", { deviceId, amount, type, reason });
    const response = await httpClient.post(
      "/cashregister/cashInOut",
      {
        DeviceID: deviceId,
        Amount: amount,
        Type: type,
        Reason: reason,
      },
      true
    );
    console.log("cashInOut response:", response);
    return response;
  } catch (error) {
    console.error("cashInOut failed:", error);
    throw error;
  }
};

/**
 * Checks if a cash register is in closed state.
 * @param {string} deviceId - The unique device/machine ID
 * @returns {Promise<object>} API response with isClosed boolean
 */
export const checkRegisterClosed = async (deviceId) => {
  try {
    console.log("Checking if register is closed for device:", deviceId);
    const response = await httpClient.get(
      `/cashregister/isClosed/${deviceId}`,
      false
    );
    console.log("checkRegisterClosed response:", response);
    return response;
  } catch (error) {
    console.error("checkRegisterClosed failed:", error);
    throw error;
  }
};

/**
 * Gets all locations for cash register setup.
 * @returns {Promise<object>} API response with locations array
 */
export const getAllLocations = async () => {
  try {
    console.log("Fetching all locations");
    const response = await httpClient.get("/location/getAll", true);
    console.log("getAllLocations response:", response);
    return response;
  } catch (error) {
    console.error("getAllLocations failed:", error);
    throw error;
  }
};
