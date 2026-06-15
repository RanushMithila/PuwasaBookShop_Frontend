import httpClient from "./HttpClient";

/**
 * Fetches tenant settings (includes logo, name, etc.).
 * GET /tenant/settings
 * @returns {Promise<object>} The tenant settings response.
 */
export const getTenantSettings = async () => {
  try {
    const response = await httpClient.get("/tenant/settings", true);
    return response;
  } catch (error) {
    console.error("Failed to fetch tenant settings:", error);
    throw error;
  }
};
