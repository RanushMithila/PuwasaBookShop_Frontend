import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock TenantService before importing the store
vi.mock("../../src/services/TenantService", () => ({
  getTenantSettings: vi.fn(),
}));

import useTenantStore from "../../src/store/TenantStore";
import { getTenantSettings } from "../../src/services/TenantService";

beforeEach(() => {
  vi.clearAllMocks();
  useTenantStore.getState().clear();
});

describe("TenantStore", () => {
  describe("fetchSettings", () => {
    it("should fetch, extract logoUrl and tenantName from settings array", async () => {
      getTenantSettings.mockResolvedValue({
        data: [
          { SettingKey: "logo", SettingValue: { url: "http://logo.png" } },
          { SettingKey: "displayName", SettingValue: { text: "Puwasa Books" } },
        ],
      });

      await useTenantStore.getState().fetchSettings();

      const state = useTenantStore.getState();
      expect(state.logoUrl).toBe("http://logo.png");
      expect(state.tenantName).toBe("Puwasa Books");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should not refetch if settings are already cached", async () => {
      getTenantSettings.mockResolvedValue({ data: [] });

      await useTenantStore.getState().fetchSettings();
      await useTenantStore.getState().fetchSettings();

      expect(getTenantSettings).toHaveBeenCalledTimes(1);
    });

    it("should set error on failure", async () => {
      getTenantSettings.mockRejectedValue(new Error("network error"));

      await expect(useTenantStore.getState().fetchSettings()).rejects.toThrow("network error");

      const state = useTenantStore.getState();
      expect(state.error).toBe("network error");
      expect(state.isLoading).toBe(false);
    });

    it("should set logoUrl to null when logo setting is missing", async () => {
      getTenantSettings.mockResolvedValue({ data: [] });

      await useTenantStore.getState().fetchSettings();

      expect(useTenantStore.getState().logoUrl).toBeNull();
    });
  });

  describe("refreshSettings", () => {
    it("should clear cache and re-fetch", async () => {
      getTenantSettings
        .mockResolvedValueOnce({ data: [{ SettingKey: "displayName", SettingValue: { text: "Old" } }] })
        .mockResolvedValueOnce({ data: [{ SettingKey: "displayName", SettingValue: { text: "New" } }] });

      await useTenantStore.getState().fetchSettings();
      expect(useTenantStore.getState().tenantName).toBe("Old");

      await useTenantStore.getState().refreshSettings();
      expect(useTenantStore.getState().tenantName).toBe("New");
      expect(getTenantSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe("clear", () => {
    it("should reset all state to initial values", async () => {
      getTenantSettings.mockResolvedValue({
        data: [{ SettingKey: "logo", SettingValue: { url: "http://x.png" } }],
      });
      await useTenantStore.getState().fetchSettings();

      useTenantStore.getState().clear();

      const state = useTenantStore.getState();
      expect(state.settings).toBeNull();
      expect(state.logoUrl).toBeNull();
      expect(state.tenantName).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
