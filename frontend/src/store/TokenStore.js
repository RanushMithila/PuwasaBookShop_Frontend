import { create } from "zustand";

// Helper for localStorage persistence (keeps tokens across reloads)
const STORAGE_KEY = "puwasa_tokens_v1";

function loadSavedTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed.accessToken || null,
      refreshToken: parsed.refreshToken || null,
    };
  } catch (e) {
    return { accessToken: null, refreshToken: null };
  }
}

function saveTokensToStorage(accessToken, refreshToken) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken, refreshToken })
    );
  } catch (e) {
    // ignore storage errors
  }
}

const initial = loadSavedTokens();

const useTokenStore = create((set, get) => ({
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    saveTokensToStorage(accessToken || null, refreshToken || null);
  },
  updateAccessToken: (accessToken) => {
    set((state) => ({ ...state, accessToken }));
    saveTokensToStorage(accessToken || null, get().refreshToken || null);
  },
  clearTokens: () => {
    set({ accessToken: null, refreshToken: null });
    saveTokensToStorage(null, null);
  },
  // Getter helpers
  getAccessToken: () => get().accessToken,
  getRefreshToken: () => get().refreshToken,
}));

export default useTokenStore;
