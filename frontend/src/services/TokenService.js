import HttpClient from "./HttpClient";
import useAuthStore from "../store/AuthStore";

class TokenService {
  /**
   * Decode JWT token and check if it's expired
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    if (!token) return true;

    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token is expired (with 30 second buffer)
      return payload.exp < currentTime + 30;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true; // Treat invalid tokens as expired
    }
  }

  /**
   * Get user details from the JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} User details payload or null
   */
  getUserDetails(token) {
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token payload:", error);
      return null;
    }
  }

  /**
   * Redirect user to login page
   */
  redirectToLogin() {
    console.log("Redirecting to login page due to expired tokens");
    // Clear tokens before redirect
    const authStore = useAuthStore.getState();
    authStore.clearSession();

    // Redirect to login page
    window.location.hash = "#/login"; // or use your router navigation
  }

  /**
   * Refresh the access token using the refresh token
   * @returns {Promise<Object>} Response containing new access token
   */
  async refreshToken() {
    try {
      const authStore = useAuthStore.getState();
      const refreshToken = authStore.refreshToken;

      console.log("=== TOKEN REFRESH DEBUG ===");
      console.log("Current tokens in store:", {
        accessToken: authStore.accessToken
          ? `${authStore.accessToken.substring(0, 20)}...`
          : "null",
        refreshToken: refreshToken
          ? `${refreshToken.substring(0, 20)}...`
          : "null",
        hasAccessToken: !!authStore.accessToken,
        hasRefreshToken: !!refreshToken,
      });

      if (!refreshToken) {
        console.error("❌ No refresh token available in store");
        throw new Error("No refresh token available");
      }

      // Check if refresh token is expired
      if (this.isTokenExpired(refreshToken)) {
        console.log("❌ Refresh token is expired, redirecting to login");
        this.redirectToLogin();
        return {
          success: false,
          error: "Refresh token expired",
          requiresLogin: true,
        };
      }

      console.log(
        "✅ Refresh token is valid, delegating refresh to HttpClient.refreshAccessToken()"
      );
      // Delegate refresh to HttpClient which already implements query-param then JSON fallback
      const newAccess = await HttpClient.refreshAccessToken();
      if (newAccess) {
        console.log(
          "✅ Access token refreshed by HttpClient:",
          `${String(newAccess).substring(0, 20)}...`
        );
        return { success: true, access_token: newAccess, token_type: "Bearer" };
      } else {
        throw new Error("Invalid response from refresh token endpoint");
      }
    } catch (error) {
      console.error("❌ Token refresh failed with error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status || error.status,
        statusText: error.response?.statusText || "unknown",
      });

      // Check if it's a 401 error (refresh token expired)
      if (error.response?.status === 401 || error.status === 401) {
        console.log(
          "🚪 Refresh token expired or invalid (401 response), redirecting to login"
        );
        this.redirectToLogin();
        return {
          success: false,
          error: "Refresh token expired",
          requiresLogin: true,
        };
      }

      // Clear tokens for other errors
      console.log("🧹 Clearing tokens due to refresh failure");
      const authStore = useAuthStore.getState();
      authStore.clearSession();

      return {
        success: false,
        error: error.message || "Token refresh failed",
      };
    }
  }

  /**
   * Check if the current access token is expired and refresh if needed
   * @returns {Promise<boolean>} True if token is valid/refreshed, false otherwise
   */
  async ensureValidToken() {
    try {
      const authStore = useAuthStore.getState();
      const accessToken = authStore.accessToken;

      // If no access token, try to refresh
      if (!accessToken) {
        console.log("No access token found, attempting refresh");
        const refreshResult = await this.refreshToken();
        return refreshResult.success;
      }

      // Check if access token is expired
      if (this.isTokenExpired(accessToken)) {
        console.log("Access token is expired, attempting refresh");
        const refreshResult = await this.refreshToken();
        return refreshResult.success;
      }

      // Token exists and is not expired
      console.log("Access token is valid");
      return true;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @returns {Promise<string|null>} Valid access token or null if refresh failed
   */
  async getValidAccessToken() {
    const isValid = await this.ensureValidToken();
    if (isValid) {
      const authStore = useAuthStore.getState();
      return authStore.accessToken;
    }
    return null;
  }

  /**
   * Check if user needs to login (no valid tokens)
   * @returns {boolean} True if user needs to login
   */
  requiresLogin() {
    const authStore = useAuthStore.getState();
    const refreshToken = authStore.refreshToken;
    return !refreshToken || this.isTokenExpired(refreshToken);
  }
}

// Export a singleton instance
export default new TokenService();
