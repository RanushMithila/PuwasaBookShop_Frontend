import { describe, it, expect, beforeEach } from "vitest";
import useAuthStore from "../../src/store/AuthStore";

beforeEach(() => {
  // Reset store state between tests
  useAuthStore.getState().clearSession();
});

describe("AuthStore", () => {
  describe("setTokens", () => {
    it("should store access and refresh tokens", () => {
      useAuthStore.getState().setTokens("access-123", "refresh-456");

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe("access-123");
      expect(state.refreshToken).toBe("refresh-456");
    });

    it("should set tokens to null when given falsy values", () => {
      useAuthStore.getState().setTokens("", null);

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe("updateAccessToken", () => {
    it("should replace only the access token", () => {
      useAuthStore.getState().setTokens("old-access", "refresh-keep");
      useAuthStore.getState().updateAccessToken("new-access");

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe("new-access");
      expect(state.refreshToken).toBe("refresh-keep");
    });
  });

  describe("setSession", () => {
    it("should store user, location, and parse LocationID", () => {
      useAuthStore.getState().setSession({
        user: { id: 1, name: "Admin" },
        location: { id: 5, name: "Main" },
        LocationID: "5",
        locationName: "Main Branch",
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual({ id: 1, name: "Admin" });
      expect(state.location).toEqual({ id: 5, name: "Main" });
      expect(state.LocationID).toBe(5);
      expect(state.locationName).toBe("Main Branch");
      expect(state.isAuthenticated).toBe(true);
    });

    it("should extract LocationID from location.id fallback", () => {
      useAuthStore.getState().setSession({
        user: null,
        location: { id: 7 },
      });

      expect(useAuthStore.getState().LocationID).toBe(7);
    });

    it("should set LocationID to null when no ID provided", () => {
      useAuthStore.getState().setSession({
        user: null,
        location: null,
      });

      expect(useAuthStore.getState().LocationID).toBeNull();
    });
  });

  describe("setDeviceId", () => {
    it("should store device ID", () => {
      useAuthStore.getState().setDeviceId("DEV-ABC");
      expect(useAuthStore.getState().deviceId).toBe("DEV-ABC");
    });

    it("should set to null for falsy value", () => {
      useAuthStore.getState().setDeviceId("");
      expect(useAuthStore.getState().deviceId).toBeNull();
    });
  });

  describe("setTenantInfo", () => {
    it("should store tenant info", () => {
      const info = { tenant_name: "Puwasa", city: "Colombo" };
      useAuthStore.getState().setTenantInfo(info);
      expect(useAuthStore.getState().tenantInfo).toEqual(info);
    });
  });

  describe("setLocationData", () => {
    it("should store location data", () => {
      const data = { locationName: "Branch A", city: "Kandy" };
      useAuthStore.getState().setLocationData(data);
      expect(useAuthStore.getState().locationData).toEqual(data);
    });
  });

  describe("setCurrentUserName", () => {
    it("should store display name", () => {
      useAuthStore.getState().setCurrentUserName("John Doe");
      expect(useAuthStore.getState().currentUserName).toBe("John Doe");
    });
  });

  describe("setUsersList", () => {
    it("should store array of users", () => {
      const users = [{ UserID: 1 }, { UserID: 2 }];
      useAuthStore.getState().setUsersList(users);
      expect(useAuthStore.getState().usersList).toEqual(users);
    });

    it("should default to empty array for non-array input", () => {
      useAuthStore.getState().setUsersList("not-an-array");
      expect(useAuthStore.getState().usersList).toEqual([]);
    });
  });

  describe("clearSession", () => {
    it("should reset all fields to initial values", () => {
      useAuthStore.getState().setTokens("a", "b");
      useAuthStore.getState().setSession({
        user: { id: 1 },
        location: { id: 2 },
        LocationID: 2,
        locationName: "X",
      });
      useAuthStore.getState().setDeviceId("DEV-1");
      useAuthStore.getState().setTenantInfo({ tenant_name: "T" });
      useAuthStore.getState().setCurrentUserName("Admin");
      useAuthStore.getState().setUsersList([{ UserID: 1 }]);

      useAuthStore.getState().clearSession();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.location).toBeNull();
      expect(state.LocationID).toBeNull();
      expect(state.locationName).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.deviceId).toBeNull();
      expect(state.tenantInfo).toBeNull();
      expect(state.locationData).toBeNull();
      expect(state.currentUserName).toBeNull();
      expect(state.usersList).toEqual([]);
    });
  });

  describe("getter helpers", () => {
    it("getAccessToken should return current access token", () => {
      useAuthStore.getState().setTokens("tok123", "ref456");
      expect(useAuthStore.getState().getAccessToken()).toBe("tok123");
    });

    it("getRefreshToken should return current refresh token", () => {
      useAuthStore.getState().setTokens("tok123", "ref456");
      expect(useAuthStore.getState().getRefreshToken()).toBe("ref456");
    });

    it("getDeviceId should return current device ID", () => {
      useAuthStore.getState().setDeviceId("DEV-X");
      expect(useAuthStore.getState().getDeviceId()).toBe("DEV-X");
    });
  });
});
