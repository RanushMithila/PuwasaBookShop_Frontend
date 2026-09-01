import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import {
  createBill,
  addBillDetails,
  getBill,
  completeBill,
  getItemByBarcode,
  getItemQuantity,
  cancelBill,
  getTemporaryBills,
  getInventory,
  searchItemsByName,
  getLocationById,
} from "../../src/services/BillingService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BillingService", () => {
  describe("createBill", () => {
    it("should strip null HelperID and POST to /billing/billing", async () => {
      httpClient.post.mockResolvedValue({ status: true, data: 42 });

      const result = await createBill({
        LocationID: 1,
        CustomerID: "c1",
        HelperID: null,
      });

      const payload = httpClient.post.mock.calls[0][1];
      expect(payload).not.toHaveProperty("HelperID");
      expect(httpClient.post).toHaveBeenCalledWith(
        "/billing/billing",
        expect.objectContaining({ LocationID: 1, CustomerID: "c1" }),
        true
      );
      expect(result).toEqual({ status: true, data: 42 });
    });

    it("should keep HelperID when it has a value", async () => {
      httpClient.post.mockResolvedValue({ status: true });

      await createBill({ LocationID: 1, HelperID: "h1" });

      const payload = httpClient.post.mock.calls[0][1];
      expect(payload.HelperID).toBe("h1");
    });

    it("should re-throw on failure", async () => {
      httpClient.post.mockRejectedValue(new Error("500"));
      await expect(createBill({})).rejects.toThrow("500");
    });
  });

  describe("addBillDetails", () => {
    it("should POST details to /billing/details", async () => {
      const details = { BillID: 1, Items: [{ InventoryID: 10, QTY: 2 }] };
      httpClient.post.mockResolvedValue({ status: true });

      await addBillDetails(details);

      expect(httpClient.post).toHaveBeenCalledWith("/billing/details", details, true);
    });
  });

  describe("getBill", () => {
    it("should GET /billing/billing/{id}", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: { BillID: 5 } });

      const result = await getBill(5);

      expect(httpClient.get).toHaveBeenCalledWith("/billing/billing/5", true);
      expect(result.data.BillID).toBe(5);
    });
  });

  describe("completeBill", () => {
    it("should strip null values from payment data", async () => {
      httpClient.post.mockResolvedValue({ status: true, data: 0 });

      await completeBill(10, { CashAmount: 500, CardAmount: null, CustomerID: undefined });

      const payload = httpClient.post.mock.calls[0][1];
      expect(payload).toEqual({ CashAmount: 500 });
      expect(httpClient.post.mock.calls[0][0]).toBe("/billing/billing/complete/10");
    });
  });

  describe("getItemByBarcode", () => {
    it("should GET with barcode and locationId in URL", async () => {
      httpClient.get.mockResolvedValue({ status: true });

      await getItemByBarcode("ABC123", 2);

      expect(httpClient.get).toHaveBeenCalledWith("/inventory/getItem/ABC123/2", true);
    });
  });

  describe("getItemQuantity", () => {
    it("should GET with barcode and locationId in URL", async () => {
      httpClient.get.mockResolvedValue({ status: true });

      await getItemQuantity("XYZ", 3);

      expect(httpClient.get).toHaveBeenCalledWith("/inventory/getItemQTY/XYZ/3", true);
    });
  });

  describe("cancelBill", () => {
    it("should DELETE /billing/billing/cancel/{id}", async () => {
      httpClient.delete.mockResolvedValue({ status: true });

      await cancelBill(7);

      expect(httpClient.delete).toHaveBeenCalledWith("/billing/billing/cancel/7", true);
    });
  });

  describe("getTemporaryBills", () => {
    it("should GET /billing/tempbills/{locationId}", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: [] });

      await getTemporaryBills(4);

      expect(httpClient.get).toHaveBeenCalledWith("/billing/tempbills/4", true);
    });
  });

  describe("getInventory", () => {
    it("should GET /inventory/getAll/{locationId}", async () => {
      httpClient.get.mockResolvedValue({ status: true });

      await getInventory(1);

      expect(httpClient.get).toHaveBeenCalledWith("/inventory/getAll/1", true);
    });
  });

  describe("searchItemsByName", () => {
    it("should GET /inventory/getItemName/{name}/{locationId}", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: [] });

      await searchItemsByName("notebook", 2);

      expect(httpClient.get).toHaveBeenCalledWith("/inventory/getItemName/notebook/2", true);
    });
  });

  describe("getLocationById", () => {
    it("should GET /inventory/getLocation/{locationId}", async () => {
      const mockLoc = { locationName: "Main Branch" };
      httpClient.get.mockResolvedValue(mockLoc);

      const result = await getLocationById(1);

      expect(httpClient.get).toHaveBeenCalledWith("/inventory/getLocation/1", true);
      expect(result.locationName).toBe("Main Branch");
    });
  });
});
