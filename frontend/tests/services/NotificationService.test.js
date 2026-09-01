import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import { getPaymentReminder } from "../../src/services/NotificationService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationService", () => {
  describe("getPaymentReminder", () => {
    it("should return response on success", async () => {
      const mockResp = {
        status: true,
        message: "OK",
        data: { next_billing_date: "2026-10-01", remaining_days: 30 },
      };
      httpClient.get.mockResolvedValue(mockResp);

      const result = await getPaymentReminder();

      expect(httpClient.get).toHaveBeenCalledWith("/notifications/paymentreminder", true);
      expect(result).toEqual(mockResp);
    });

    it("should return safe fallback on error instead of throwing", async () => {
      httpClient.get.mockRejectedValue(new Error("network error"));

      const result = await getPaymentReminder();

      expect(result.status).toBe(false);
      expect(result.error_message).toBe("network error");
      expect(result.data).toBeNull();
    });

    it("should include generic message when error has no message", async () => {
      httpClient.get.mockRejectedValue(new Error());

      const result = await getPaymentReminder();

      expect(result.status).toBe(false);
      expect(result.error_message).toBe("Failed to fetch payment reminder");
    });
  });
});
