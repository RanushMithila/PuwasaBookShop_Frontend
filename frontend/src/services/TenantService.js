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

/**
 * Fetches tenant business information (name, email, address, city, etc.).
 * GET /tenant/me
 * @returns {Promise<object>} The tenant info response.
 */
export const getTenantInfo = async () => {
  try {
    const response = await httpClient.get("/tenant/me", true);
    return response;
  } catch (error) {
    console.error("Failed to fetch tenant info:", error);
    throw error;
  }
};
