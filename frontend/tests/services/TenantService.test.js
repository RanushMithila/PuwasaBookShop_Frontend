import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import { getTenantSettings, getTenantInfo } from "../../src/services/TenantService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TenantService", () => {
  describe("getTenantSettings", () => {
    it("should GET /tenant/settings with auth", async () => {
      const mockResp = { data: [{ SettingKey: "logo", SettingValue: { url: "http://logo.png" } }] };
      httpClient.get.mockResolvedValue(mockResp);

      const result = await getTenantSettings();

      expect(httpClient.get).toHaveBeenCalledWith("/tenant/settings", true);
      expect(result.data[0].SettingKey).toBe("logo");
    });

    it("should re-throw on failure", async () => {
      httpClient.get.mockRejectedValue(new Error("unauthorized"));
      await expect(getTenantSettings()).rejects.toThrow("unauthorized");
    });
  });

  describe("getTenantInfo", () => {
    it("should GET /tenant/me with auth", async () => {
      const mockResp = { status: true, data: { tenant_name: "Puwasa" } };
      httpClient.get.mockResolvedValue(mockResp);

      const result = await getTenantInfo();

      expect(httpClient.get).toHaveBeenCalledWith("/tenant/me", true);
      expect(result.data.tenant_name).toBe("Puwasa");
    });
  });
});
