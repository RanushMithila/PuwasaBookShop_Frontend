import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the HttpClient module — every service imports the default export
vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import { login, getProfile, getCurrentUser } from "../../src/services/AuthService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthService", () => {
  describe("login", () => {
    it("should call postForm with correct endpoint and form data", async () => {
      const mockResponse = { access_token: "abc", token_type: "bearer" };
      httpClient.postForm.mockResolvedValue(mockResponse);

      const result = await login("user@test.com", "pass123");

      expect(httpClient.postForm).toHaveBeenCalledTimes(1);
      const [endpoint, formData, includeAuth] = httpClient.postForm.mock.calls[0];
      expect(endpoint).toBe("/auth/token");
      expect(includeAuth).toBe(false);
      expect(formData.get("username")).toBe("user@test.com");
      expect(formData.get("password")).toBe("pass123");
      expect(formData.get("grant_type")).toBe("password");
      expect(result).toEqual(mockResponse);
    });

    it("should re-throw when postForm fails", async () => {
      httpClient.postForm.mockRejectedValue(new Error("Network error"));

      await expect(login("u", "p")).rejects.toThrow("Network error");
    });
  });

  describe("getProfile", () => {
    it("should call get with /user/me", async () => {
      const mockProfile = { user: { id: 1 }, location: { id: 2 } };
      httpClient.get.mockResolvedValue(mockProfile);

      const result = await getProfile();

      expect(httpClient.get).toHaveBeenCalledWith("/user/me");
      expect(result).toEqual(mockProfile);
    });

    it("should re-throw on failure", async () => {
      httpClient.get.mockRejectedValue(new Error("401"));
      await expect(getProfile()).rejects.toThrow("401");
    });
  });

  describe("getCurrentUser", () => {
    it("should call get with /user/me and auth enabled", async () => {
      const mockUser = { UserID: "abc", Email: "a@b.com" };
      httpClient.get.mockResolvedValue(mockUser);

      const result = await getCurrentUser();

      expect(httpClient.get).toHaveBeenCalledWith("/user/me", true);
      expect(result).toEqual(mockUser);
    });

    it("should re-throw on failure", async () => {
      httpClient.get.mockRejectedValue(new Error("forbidden"));
      await expect(getCurrentUser()).rejects.toThrow("forbidden");
    });
  });
});
