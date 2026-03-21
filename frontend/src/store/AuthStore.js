import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null, // Will hold { id, name, role }
      location: null, // Will hold { id, name }
      LocationID: null,
      isAuthenticated: false,
      accessToken: null, // JWT access token
      refreshToken: null, // JWT refresh token
      deviceId: null, // Machine ID for cash register

      // Actions
      setSession: (sessionData) => {
        // Expects sessionData to contain user and location objects from the API
        const locId =
          sessionData.LocationID ||
          sessionData.location?.id ||
          sessionData.locationID ||
          null;
        set({
          user: sessionData.user,
          location: sessionData.location,
          LocationID: locId ? parseInt(locId, 10) : null,
          isAuthenticated: true,
        });
      },

      // Set Location ID explicitly
      setLocationID: (id) => {
        set({ LocationID: id });
      },

      // Set authentication tokens
      setTokens: (accessToken, refreshToken) => {
        console.log("[AuthStore] 🔑 setTokens called (initial login)");
        console.log("[AuthStore] Access Token:", accessToken || "null");
        console.log("[AuthStore] Refresh Token:", refreshToken || "null");
        set({
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
        });
      },

      // Update only the access token (useful for token refresh)
      updateAccessToken: (accessToken) => {
        const previousToken = get().accessToken;
        console.log("[AuthStore] 🔄 updateAccessToken called (token refresh)");
        console.log("[AuthStore] Previous Access Token:", previousToken || "null");
        console.log("[AuthStore] New Access Token:", accessToken || "null");
        console.log("[AuthStore] Tokens match (same)?:", previousToken === accessToken);
        set({ accessToken: accessToken || null });
      },

      // Set device ID (machine ID for cash register)
      setDeviceId: (deviceId) => {
        set({ deviceId: deviceId || null });
      },

      // Clear session and tokens together - no more manual coordination needed
      clearSession: () => {
        set({
          user: null,
          location: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          deviceId: null,
        });
      },

      // Getter helpers for convenience
      getAccessToken: () => get().accessToken,
      getRefreshToken: () => get().refreshToken,
      getDeviceId: () => get().deviceId,
    }),
    {
      name: "auth-session-storage", // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    },
  ),
);

export default useAuthStore;
