import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import {
  processRefund,
  sendRefundNotification,
  getVoucherByCode,
} from "../../src/services/RefundService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RefundService", () => {
  describe("processRefund", () => {
    it("should POST to /refund/refund with refund data", async () => {
      const refundData = { BillID: 10, Items: [{ BillDetailID: 1, QTY: 2 }] };
      httpClient.post.mockResolvedValue({
        status: true,
        data: { RefundID: 5, VoucherCode: "V-123" },
      });

      const result = await processRefund(refundData);

      expect(httpClient.post).toHaveBeenCalledWith("/refund/refund", refundData, true);
      expect(result.data.RefundID).toBe(5);
      expect(result.data.VoucherCode).toBe("V-123");
    });

    it("should re-throw on failure", async () => {
      httpClient.post.mockRejectedValue(new Error("refund failed"));
      await expect(processRefund({})).rejects.toThrow("refund failed");
    });
  });

  describe("sendRefundNotification", () => {
    it("should POST with refund_id and email as query params", async () => {
      httpClient.post.mockResolvedValue({ status: true });

      await sendRefundNotification(5, "test@mail.com");

      const endpoint = httpClient.post.mock.calls[0][0];
      expect(endpoint).toContain("/refund/refund/notify");
      expect(endpoint).toContain("refund_id=5");
      expect(endpoint).toContain("email=test%40mail.com");
      expect(httpClient.post.mock.calls[0][2]).toBe(true);
    });
  });

  describe("getVoucherByCode", () => {
    it("should GET /voucher/search/{code}", async () => {
      httpClient.get.mockResolvedValue({
        status: true,
        data: { Code: "V-123", Value: 500 },
      });

      const result = await getVoucherByCode("V-123");

      expect(httpClient.get).toHaveBeenCalledWith("/voucher/search/V-123", true);
      expect(result.data.Value).toBe(500);
    });

    it("should re-throw on failure", async () => {
      httpClient.get.mockRejectedValue(new Error("not found"));
      await expect(getVoucherByCode("INVALID")).rejects.toThrow("not found");
    });
  });
});
