import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null, // Will hold { id, name, role }
      location: null, // Will hold { id, name }
      isAuthenticated: false,
      accessToken: null, // JWT access token
      refreshToken: null, // JWT refresh token

      // Actions
      setSession: (sessionData) => {
        // Expects sessionData to contain user and location objects from the API
        set({
          user: sessionData.user,
          location: sessionData.location,
          isAuthenticated: true,
        });
      },

      // Set authentication tokens
      setTokens: (accessToken, refreshToken) => {
        set({
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
        });
      },

      // Update only the access token (useful for token refresh)
      updateAccessToken: (accessToken) => {
        set({ accessToken: accessToken || null });
      },

      // Clear session and tokens together - no more manual coordination needed
      clearSession: () => {
        set({
          user: null,
          location: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        });
      },

      // Getter helpers for convenience
      getAccessToken: () => get().accessToken,
      getRefreshToken: () => get().refreshToken,
    }),
    {
      name: "auth-session-storage", // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

export default useAuthStore;
