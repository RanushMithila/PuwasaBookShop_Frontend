import { describe, it, expect, vi, beforeEach } from "vitest";
import { printBill } from "../../src/services/PrintingService";

beforeEach(() => {
  vi.clearAllMocks();
  // Reset window mocks
  delete globalThis.window.electronAPI;
  globalThis.alert = vi.fn();
});

describe("PrintingService", () => {
  describe("printBill", () => {
    it("should show alert when Electron API is not available", async () => {
      // electronAPI not defined
      await printBill({ billId: 1 });

      expect(globalThis.alert).toHaveBeenCalledWith(
        "Printing is only available in the desktop app."
      );
    });

    it("should call electronAPI.printReceipt and alert success", async () => {
      const printReceipt = vi.fn().mockResolvedValue({ success: true });
      globalThis.window.electronAPI = { printReceipt };

      await printBill({ billId: 42 });

      expect(printReceipt).toHaveBeenCalledWith({ billId: 42 });
      expect(globalThis.alert).toHaveBeenCalledWith(
        "Receipt sent to printer successfully!"
      );
    });

    it("should alert error message when printing fails", async () => {
      const printReceipt = vi
        .fn()
        .mockResolvedValue({ success: false, error: "Paper jam" });
      globalThis.window.electronAPI = { printReceipt };

      await printBill({ billId: 1 });

      expect(globalThis.alert).toHaveBeenCalledWith("Printing failed: Paper jam");
    });

    it("should handle printReceipt rejection", async () => {
      const printReceipt = vi.fn().mockRejectedValue(new Error("IPC timeout"));
      globalThis.window.electronAPI = { printReceipt };

      await printBill({ billId: 1 });

      expect(globalThis.alert).toHaveBeenCalledWith("Printing failed: IPC timeout");
    });
  });
});
