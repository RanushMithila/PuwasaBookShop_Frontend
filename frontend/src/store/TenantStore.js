import { create } from "zustand";
import { getTenantSettings } from "../services/TenantService";

/**
 * Extracts a specific setting value from the tenant settings array.
 * The API returns: { data: [{ SettingKey: "logo", SettingValue: { url: "..." } }, ...] }
 */
const getSettingValue = (settings, key) => {
  if (!Array.isArray(settings)) return null;
  const setting = settings.find((s) => s.SettingKey === key);
  return setting?.SettingValue || null;
};

const useTenantStore = create((set, get) => ({
  // State
  settings: null,
  logoUrl: null,
  tenantName: null,
  isLoading: false,
  error: null,

  // Fetch tenant settings from API
  fetchSettings: async () => {
    // Don't refetch if already loaded successfully
    if (get().settings && !get().error) return get().settings;

    set({ isLoading: true, error: null });
    try {
      const response = await getTenantSettings();
      const settingsArray = response?.data || response || [];

      console.log("Tenant settings loaded:", settingsArray);

      // Extract logo URL from settings array
      const logoSetting = getSettingValue(settingsArray, "logo");
      const logoUrl = logoSetting?.url || null;

      // Extract display name
      const displayNameSetting = getSettingValue(settingsArray, "displayName");
      const tenantName = displayNameSetting?.text || null;

      console.log("Tenant logo URL:", logoUrl);
      console.log("Tenant name:", tenantName);

      set({
        settings: settingsArray,
        logoUrl,
        tenantName,
        isLoading: false,
      });

      return response;
    } catch (error) {
      console.error("Failed to load tenant settings:", error);
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  // Force refresh
  refreshSettings: async () => {
    set({ settings: null, error: null });
    return get().fetchSettings();
  },

  // Clear store
  clear: () => {
    set({
      settings: null,
      logoUrl: null,
      tenantName: null,
      isLoading: false,
      error: null,
    });
  },
}));

export default useTenantStore;
