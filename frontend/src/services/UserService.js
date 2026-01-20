import httpClient from "./HttpClient";

/**
 * Fetches all users.
 * @returns {Promise<object>} The API response containing user data.
 */
export const getUsers = async () => {
  try {
    const response = await httpClient.get("/user/users", true);
    return response;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};
