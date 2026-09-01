import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import {
  getMachineId,
  getRegisterByDeviceId,
  createRegister,
  checkRegisterOpen,
  setOpeningAmount,
  setClosingAmount,
  cashInOut,
  checkRegisterClosed,
  getAllLocations,
  listCashRegisters,
} from "../../src/services/CashRegisterService";

beforeEach(() => {
  vi.clearAllMocks();
  // Reset window.electron mock between tests
  delete globalThis.window?.electron;
});

describe("CashRegisterService", () => {
  describe("getMachineId", () => {
    it("should throw when IPC is not available", async () => {
      // No window.electron defined
      await expect(getMachineId()).rejects.toThrow(
        "Machine ID is only available in Electron environment"
      );
    });

    it("should return machineId when Electron IPC resolves successfully", async () => {
      const invoke = vi.fn().mockResolvedValue({ success: true, machineId: "ABC-123" });
      Object.defineProperty(window, "electron", {
        value: { ipcRenderer: { invoke } },
        writable: true,
        configurable: true,
      });

      const result = await getMachineId();

      expect(result).toBe("ABC-123");
      expect(invoke).toHaveBeenCalledWith("get-machine-id");
    });

    it("should throw when IPC returns failure", async () => {
      Object.defineProperty(window, "electron", {
        value: {
          ipcRenderer: {
            invoke: vi.fn().mockResolvedValue({ success: false, error: "hw fail" }),
          },
        },
        writable: true,
        configurable: true,
      });

      await expect(getMachineId()).rejects.toThrow("hw fail");
    });
  });

  describe("getRegisterByDeviceId", () => {
    it("should GET /cashregister/get/{deviceId}", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: {} });

      await getRegisterByDeviceId("DEV-1");

      expect(httpClient.get).toHaveBeenCalledWith("/cashregister/get/DEV-1", true);
    });
  });

  describe("createRegister", () => {
    it("should POST to /cashregister/create with correct payload", async () => {
      httpClient.post.mockResolvedValue({ status: true });

      await createRegister(5, "POS-1", "DEV-1");

      expect(httpClient.post).toHaveBeenCalledWith(
        "/cashregister/create",
        { LocationID: 5, RegisterName: "POS-1", DeviceID: "DEV-1" },
        true
      );
    });
  });

  describe("checkRegisterOpen", () => {
    it("should GET /cashregister/isOpen/{deviceId}", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: { isOpen: true } });

      const result = await checkRegisterOpen("DEV-1");

      expect(httpClient.get).toHaveBeenCalledWith("/cashregister/isOpen/DEV-1", true);
      expect(result.data.isOpen).toBe(true);
    });
  });

  describe("setOpeningAmount", () => {
    it("should POST with DeviceID and OpeningAmount", async () => {
      httpClient.post.mockResolvedValue({ status: true, data: { SessionID: 99 } });

      const result = await setOpeningAmount("DEV-1", 5000);

      expect(httpClient.post).toHaveBeenCalledWith(
        "/cashregister/setOpeningAmount",
        { DeviceID: "DEV-1", OpeningAmount: 5000 },
        true
      );
      expect(result.data.SessionID).toBe(99);
    });
  });

  describe("setClosingAmount", () => {
    it("should POST with DeviceID, ClosingAmount, and notes", async () => {
      const notes = { "100": 5, "500": 2 };
      httpClient.post.mockResolvedValue({ status: true });

      await setClosingAmount("DEV-1", 1500, notes);

      expect(httpClient.post).toHaveBeenCalledWith(
        "/cashregister/setClosingAmount",
        { DeviceID: "DEV-1", ClosingAmount: 1500, notes },
        true
      );
    });
  });

  describe("cashInOut", () => {
    it("should POST with all transaction fields", async () => {
      httpClient.post.mockResolvedValue({ status: true });

      await cashInOut("DEV-1", 200, true, "Petty cash");

      expect(httpClient.post).toHaveBeenCalledWith(
        "/cashregister/cashInOut",
        { DeviceID: "DEV-1", Amount: 200, Type: true, Reason: "Petty cash" },
        true
      );
    });
  });

  describe("checkRegisterClosed", () => {
    it("should GET /cashregister/isClosed/{deviceId} without auth", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: { isClosed: false } });

      const result = await checkRegisterClosed("DEV-1");

      expect(httpClient.get).toHaveBeenCalledWith("/cashregister/isClosed/DEV-1", false);
      expect(result.data.isClosed).toBe(false);
    });
  });

  describe("getAllLocations", () => {
    it("should GET /inventory/getAllLocations with auth", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: [{ LocationID: 1 }] });

      const result = await getAllLocations();

      expect(httpClient.get).toHaveBeenCalledWith("/inventory/getAllLocations", true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("listCashRegisters", () => {
    it("should GET /cashregister/list with auth", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: { cashRegisters: [] } });

      await listCashRegisters();

      expect(httpClient.get).toHaveBeenCalledWith("/cashregister/list", true);
    });
  });
});
