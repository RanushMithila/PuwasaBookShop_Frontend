import { describe, it, expect, beforeEach } from "vitest";
import useTokenStore from "../../src/store/TokenStore";

beforeEach(() => {
  useTokenStore.getState().clearTokens();
  localStorage.clear();
});

describe("TokenStore", () => {
  describe("setTokens", () => {
    it("should store access and refresh tokens in state", () => {
      useTokenStore.getState().setTokens("access-1", "refresh-1");

      const state = useTokenStore.getState();
      expect(state.accessToken).toBe("access-1");
      expect(state.refreshToken).toBe("refresh-1");
    });

    it("should persist tokens to localStorage", () => {
      useTokenStore.getState().setTokens("a", "r");

      const stored = JSON.parse(localStorage.getItem("puwasa_tokens_v1"));
      expect(stored.accessToken).toBe("a");
      expect(stored.refreshToken).toBe("r");
    });
  });

  describe("updateAccessToken", () => {
    it("should update only the access token", () => {
      useTokenStore.getState().setTokens("old", "refresh-keep");
      useTokenStore.getState().updateAccessToken("new-access");

      const state = useTokenStore.getState();
      expect(state.accessToken).toBe("new-access");
      expect(state.refreshToken).toBe("refresh-keep");
    });

    it("should persist the updated token", () => {
      useTokenStore.getState().setTokens("old", "r");
      useTokenStore.getState().updateAccessToken("updated");

      const stored = JSON.parse(localStorage.getItem("puwasa_tokens_v1"));
      expect(stored.accessToken).toBe("updated");
      expect(stored.refreshToken).toBe("r");
    });
  });

  describe("clearTokens", () => {
    it("should set both tokens to null in state", () => {
      useTokenStore.getState().setTokens("a", "r");
      useTokenStore.getState().clearTokens();

      const state = useTokenStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it("should persist nulls to localStorage", () => {
      useTokenStore.getState().setTokens("a", "r");
      useTokenStore.getState().clearTokens();

      const stored = JSON.parse(localStorage.getItem("puwasa_tokens_v1"));
      expect(stored.accessToken).toBeNull();
      expect(stored.refreshToken).toBeNull();
    });
  });

  describe("getter helpers", () => {
    it("getAccessToken should return current access token", () => {
      useTokenStore.getState().setTokens("tok", "ref");
      expect(useTokenStore.getState().getAccessToken()).toBe("tok");
    });

    it("getRefreshToken should return current refresh token", () => {
      useTokenStore.getState().setTokens("tok", "ref");
      expect(useTokenStore.getState().getRefreshToken()).toBe("ref");
    });
  });
});
