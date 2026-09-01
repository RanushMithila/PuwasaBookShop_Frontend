import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/services/HttpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import httpClient from "../../src/services/HttpClient";
import {
  registerCustomer,
  getCustomerByPhone,
  searchCustomers,
} from "../../src/services/CustomerService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CustomerService", () => {
  describe("registerCustomer", () => {
    it("should POST to /customer/register with customer data", async () => {
      const data = { firstname: "John", lastname: "Doe", phone: "077" };
      httpClient.post.mockResolvedValue({ status: true });

      const result = await registerCustomer(data);

      expect(httpClient.post).toHaveBeenCalledWith("/customer/register", data, true);
      expect(result.status).toBe(true);
    });

    it("should re-throw on failure", async () => {
      httpClient.post.mockRejectedValue(new Error("400"));
      await expect(registerCustomer({})).rejects.toThrow("400");
    });
  });

  describe("getCustomerByPhone", () => {
    it("should GET /customer/phone/{phone}", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: { id: 1 } });

      const result = await getCustomerByPhone("0771234567");

      expect(httpClient.get).toHaveBeenCalledWith("/customer/phone/0771234567", true);
      expect(result.data.id).toBe(1);
    });

    it("should re-throw on failure", async () => {
      httpClient.get.mockRejectedValue(new Error("not found"));
      await expect(getCustomerByPhone("000")).rejects.toThrow("not found");
    });
  });

  describe("searchCustomers", () => {
    it("should GET /customer/phone/{term}", async () => {
      httpClient.get.mockResolvedValue({ status: true, data: [] });

      await searchCustomers("077");

      expect(httpClient.get).toHaveBeenCalledWith("/customer/phone/077", true);
    });
  });
});
