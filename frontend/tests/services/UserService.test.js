import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import { getUsers } from "../../src/services/UserService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserService", () => {
  describe("getUsers", () => {
    it("should GET /user/users with auth", async () => {
      const mockResp = { status: true, data: [{ UserID: 1, Email: "a@b.com" }] };
      httpClient.get.mockResolvedValue(mockResp);

      const result = await getUsers();

      expect(httpClient.get).toHaveBeenCalledWith("/user/users", true);
      expect(result.data).toHaveLength(1);
    });

    it("should re-throw on failure", async () => {
      httpClient.get.mockRejectedValue(new Error("server error"));
      await expect(getUsers()).rejects.toThrow("server error");
    });
  });
});
