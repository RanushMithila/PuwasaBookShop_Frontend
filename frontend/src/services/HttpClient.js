import useAuthStore from "../store/AuthStore";

class HttpClient {
  constructor() {
    // Use full API URL in production (Electron), proxy in development
    this.baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Process failed requests after token refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // Refresh token method
  async refreshAccessToken() {
    try {
      const authStore = useAuthStore.getState();
      const refreshToken = authStore.refreshToken;

      console.log("=== HTTPCLIENT TOKEN REFRESH DEBUG ===");
      console.log("Current tokens in HttpClient:", {
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
        console.error("❌ No refresh token available");
        throw new Error("No refresh token available");
      }

      console.log("✅ Making refresh request with query parameter...");

      // Prefer refresh using query parameter (matches backend sample). If that fails with 422,
      // try JSON-body fallback for compatibility with other deployments.
      const refreshUrlQuery = `${
        this.baseURL
      }/auth/refresh-token?refresh_token=${encodeURIComponent(refreshToken)}`;
      console.log("📤 Refresh request details (attempt 1 - query param):", {
        url: refreshUrlQuery,
        method: "POST",
        contentType: "application/json (empty body)",
      });

      let response = await fetch(refreshUrlQuery, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "",
      });

      // If server rejects with 422 (unprocessable entity), retry using JSON body format
      if (!response.ok && response.status === 422) {
        console.warn(
          "Refresh with query param returned 422, retrying with JSON body format"
        );
        const refreshUrl = `${this.baseURL}/auth/refresh-token`;
        console.log("📤 Refresh request details (attempt 2 - JSON body):", {
          url: refreshUrl,
          method: "POST",
          contentType: "application/json",
          body: "refresh_token=[HIDDEN]",
        });

        response = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }

      console.log("📥 Refresh response status:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Refresh request failed:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      console.log("📥 Refresh response data:", {
        hasData: !!data,
        hasAccessToken: !!(data && data.access_token),
        tokenType: data?.token_type || "not provided",
        dataKeys: data ? Object.keys(data) : [],
      });

      if (data && data.access_token) {
        authStore.updateAccessToken(data.access_token);
        console.log("✅ Access token updated successfully via HttpClient");
        console.log(
          "🎯 New token preview:",
          `${data.access_token.substring(0, 20)}...`
        );
        return data.access_token;
      } else {
        console.error("❌ Invalid response structure:", data);
        throw new Error("Invalid response from refresh token endpoint");
      }
    } catch (error) {
      console.error("❌ HttpClient token refresh failed:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200) + "...",
      });

      const authStore = useAuthStore.getState();
      authStore.clearSession();
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    try {
      const authStore = useAuthStore.getState();
      const token =
        authStore.getAccessToken?.() ||
        authStore.accessToken ||
        authStore.access_token ||
        authStore.token;
      return !!token && typeof token === "string" && token.length > 10;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  // Redirect to login
  redirectToLogin(reason = "Authentication required") {
    console.warn(`${reason}, redirecting to login`);

    // Clear any existing tokens
    try {
      const authStore = useAuthStore.getState();
      if (authStore.clearTokens) {
        authStore.clearSession();
      }
    } catch (error) {
      console.warn("Failed to clear tokens:", error);
    }

    // Redirect
    window.location.hash = "#/";
  }

  // Helper method to get headers
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      if (!this.isAuthenticated()) {
        this.redirectToLogin("No valid authentication token found");
        throw new Error("Authentication required");
      }

      try {
        const authStore = useAuthStore.getState();
        const token =
          authStore.getAccessToken?.() ||
          authStore.accessToken ||
          authStore.access_token ||
          authStore.token;

        headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        this.redirectToLogin("Failed to retrieve authentication token");
        throw error;
      }
    }

    return headers;
  }

  // Helper method for form data headers
  getFormHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (includeAuth) {
      if (!this.isAuthenticated()) {
        this.redirectToLogin("No valid authentication token found");
        throw new Error("Authentication required");
      }

      try {
        const authStore = useAuthStore.getState();
        const token =
          authStore.getAccessToken?.() ||
          authStore.accessToken ||
          authStore.access_token ||
          authStore.token;

        headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        this.redirectToLogin("Failed to retrieve authentication token");
        throw error;
      }
    }

    return headers;
  }

  // Enhanced response handler with automatic token refresh
  async handleResponse(response, originalRequest = null) {
    if (response.status === 401) {
      // Token might be expired, try to refresh
      if (originalRequest && !originalRequest._retry) {
        if (this.isRefreshing) {
          // If already refreshing, queue the request
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry the original request with new token
            return this.retryRequest(originalRequest);
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.processQueue(null, newToken);

          // Retry the original request with new token
          return this.retryRequest(originalRequest);
        } catch (refreshError) {
          this.isRefreshing = false;
          this.processQueue(refreshError, null);
          this.redirectToLogin("Token refresh failed");
          throw new Error("Authentication failed");
        }
      } else {
        this.redirectToLogin("Token expired or invalid");
        throw new Error("Authentication failed");
      }
    }

    if (!response.ok) {
      const errorText = await response.text();

      // Create an enhanced error with status code
      const error = new Error(`HTTP ${response.status}: ${errorText}`);
      error.status = response.status;
      error.statusText = response.statusText;

      // Handle specific status codes
      if (response.status === 404) {
        error.message = "Item not found (404)";
      } else if (response.status === 400) {
        error.message = "Bad request (400)";
      } else if (response.status === 500) {
        error.message = "Server error (500)";
      }

      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  }

  // Retry a failed request with new token
  async retryRequest(originalRequest) {
    const authStore = useAuthStore.getState();
    const token = authStore.getAccessToken?.() || authStore.accessToken;

    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(originalRequest.url, originalRequest);
    return await this.handleResponse(response);
  }

  // GET request
  async get(endpoint, includeAuth = true) {
    try {
      console.log("Making GET request to:", `${this.baseURL}${endpoint}`);

      const requestConfig = {
        method: "GET",
        headers: this.getHeaders(includeAuth),
        url: `${this.baseURL}${endpoint}`,
      };

      const response = await fetch(requestConfig.url, requestConfig);
      return await this.handleResponse(response, requestConfig);
    } catch (error) {
      console.error("GET request failed:", error);
      throw error;
    }
  }

  // POST request
  async post(endpoint, data, includeAuth = true) {
    try {
      console.log("Making POST request to:", `${this.baseURL}${endpoint}`);

      const requestConfig = {
        method: "POST",
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
        url: `${this.baseURL}${endpoint}`,
      };

      const response = await fetch(requestConfig.url, requestConfig);
      return await this.handleResponse(response, requestConfig);
    } catch (error) {
      console.error("POST request failed:", error);
      throw error;
    }
  }

  // POST with form data (for OAuth endpoints)
  async postForm(endpoint, formData, includeAuth = false) {
    try {
      console.log("Making POST form request to:", `${this.baseURL}${endpoint}`);

      const requestConfig = {
        method: "POST",
        headers: this.getFormHeaders(includeAuth),
        body: formData,
        url: `${this.baseURL}${endpoint}`,
      };

      const response = await fetch(requestConfig.url, requestConfig);
      return await this.handleResponse(response, requestConfig);
    } catch (error) {
      console.error("POST form request failed:", error);
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data, includeAuth = true) {
    try {
      console.log("Making PUT request to:", `${this.baseURL}${endpoint}`);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error("PUT request failed:", error);
      throw error;
    }
  }

  // PATCH request
  async patch(endpoint, data, includeAuth = true) {
    try {
      console.log("Making PATCH request to:", `${this.baseURL}${endpoint}`);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PATCH",
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error("PATCH request failed:", error);
      throw error;
    }
  }

  // DELETE request
  async delete(endpoint, includeAuth = true) {
    try {
      console.log("Making DELETE request to:", `${this.baseURL}${endpoint}`);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(includeAuth),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error("DELETE request failed:", error);
      throw error;
    }
  }

  // Upload file
  async uploadFile(endpoint, file, includeAuth = true) {
    try {
      console.log("Uploading file to:", `${this.baseURL}${endpoint}`);

      const formData = new FormData();
      formData.append("file", file);

      const headers = {};
      if (includeAuth) {
        if (!this.isAuthenticated()) {
          this.redirectToLogin("No valid authentication token found");
          throw new Error("Authentication required");
        }

        const authStore = useAuthStore.getState();
        const token =
          authStore.getAccessToken?.() ||
          authStore.accessToken ||
          authStore.access_token ||
          authStore.token;

        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  }

  // Download file
  async downloadFile(endpoint, includeAuth = true) {
    try {
      console.log("Downloading file from:", `${this.baseURL}${endpoint}`);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(includeAuth),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error("File download failed:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new HttpClient();
