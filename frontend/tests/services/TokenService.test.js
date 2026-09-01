import { describe, it, expect, vi, beforeEach } from "vitest";

// TokenService imports both HttpClient and AuthStore — mock them
vi.mock("../../src/services/HttpClient", () => ({
  default: {
    refreshAccessToken: vi.fn(),
  },
}));

vi.mock("../../src/store/AuthStore", () => {
  const state = {
    accessToken: null,
    refreshToken: null,
    clearSession: vi.fn(),
  };
  return {
    default: {
      getState: () => state,
      __mockState: state,
    },
  };
});

import HttpClient from "../../src/services/HttpClient";
import useAuthStore from "../../src/store/AuthStore";
import TokenService from "../../src/services/TokenService";

// Helper: create a fake JWT with an `exp` claim
function createFakeJwt(expUnix) {
  const header = btoa(JSON.stringify({ alg: "HS256" }));
  const payload = btoa(JSON.stringify({ exp: expUnix, sub: "user1" }));
  return `${header}.${payload}.signature`;
}

beforeEach(() => {
  vi.clearAllMocks();
  const s = useAuthStore.__mockState;
  s.accessToken = null;
  s.refreshToken = null;
  delete globalThis.window.location;
  globalThis.window.location = { hash: "" };
});

describe("TokenService", () => {
  describe("isTokenExpired", () => {
    it("should return true for null/empty token", () => {
      expect(TokenService.isTokenExpired(null)).toBe(true);
      expect(TokenService.isTokenExpired("")).toBe(true);
    });

    it("should return true for an expired token", () => {
      const expired = createFakeJwt(Math.floor(Date.now() / 1000) - 60);
      expect(TokenService.isTokenExpired(expired)).toBe(true);
    });

    it("should return false for a valid (future) token", () => {
      const valid = createFakeJwt(Math.floor(Date.now() / 1000) + 600);
      expect(TokenService.isTokenExpired(valid)).toBe(false);
    });

    it("should return true for a token expiring within 30-second buffer", () => {
      const almostExpired = createFakeJwt(Math.floor(Date.now() / 1000) + 10);
      expect(TokenService.isTokenExpired(almostExpired)).toBe(true);
    });

    it("should return true for a malformed token", () => {
      expect(TokenService.isTokenExpired("not-a-jwt")).toBe(true);
    });
  });

  describe("getUserDetails", () => {
    it("should return null for null token", () => {
      expect(TokenService.getUserDetails(null)).toBeNull();
    });

    it("should decode and return the JWT payload", () => {
      const exp = Math.floor(Date.now() / 1000) + 600;
      const token = createFakeJwt(exp);

      const details = TokenService.getUserDetails(token);

      expect(details.sub).toBe("user1");
      expect(details.exp).toBe(exp);
    });

    it("should return null for a malformed token", () => {
      expect(TokenService.getUserDetails("bad.token")).toBeNull();
    });
  });

  describe("requiresLogin", () => {
    it("should return true when no refresh token exists", () => {
      useAuthStore.__mockState.refreshToken = null;
      expect(TokenService.requiresLogin()).toBe(true);
    });

    it("should return true when refresh token is expired", () => {
      useAuthStore.__mockState.refreshToken = createFakeJwt(
        Math.floor(Date.now() / 1000) - 60
      );
      expect(TokenService.requiresLogin()).toBe(true);
    });

    it("should return false when refresh token is valid", () => {
      useAuthStore.__mockState.refreshToken = createFakeJwt(
        Math.floor(Date.now() / 1000) + 600
      );
      expect(TokenService.requiresLogin()).toBe(false);
    });
  });

  describe("ensureValidToken", () => {
    it("should return true when access token is valid", async () => {
      useAuthStore.__mockState.accessToken = createFakeJwt(
        Math.floor(Date.now() / 1000) + 600
      );
      useAuthStore.__mockState.refreshToken = createFakeJwt(
        Math.floor(Date.now() / 1000) + 600
      );

      const result = await TokenService.ensureValidToken();

      expect(result).toBe(true);
    });

    it("should return false when no tokens exist at all", async () => {
      useAuthStore.__mockState.accessToken = null;
      useAuthStore.__mockState.refreshToken = null;

      const result = await TokenService.ensureValidToken();

      expect(result).toBe(false);
    });

    it("should return false when access token is expired and refresh token is also expired", async () => {
      useAuthStore.__mockState.accessToken = createFakeJwt(
        Math.floor(Date.now() / 1000) - 60
      );
      useAuthStore.__mockState.refreshToken = createFakeJwt(
        Math.floor(Date.now() / 1000) - 60
      );

      const result = await TokenService.ensureValidToken();

      expect(result).toBe(false);
    });
  });
});
