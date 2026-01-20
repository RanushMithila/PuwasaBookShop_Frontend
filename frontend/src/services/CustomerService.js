import httpClient from "./HttpClient";

/**
 * Fetches a customer by their phone number.
 * @param {string} phone - The phone number to search for.
 * @returns {Promise<object>} The API response containing customer data.
 */
export const getCustomerByPhone = async (phone) => {
  try {
    const response = await httpClient.get(`/customer/phone/${phone}`, true);
    return response;
  } catch (error) {
    console.error(`Failed to fetch customer by phone ${phone}:`, error);
    throw error;
  }
};

/**
 * Searches for customers by a search term (can be phone or name).
 * If the backend doesn't have a specific search endpoint, we'll rely on getCustomerByPhone.
 * However, usually search endpoints return an array.
 * @param {string} term - The search term.
 * @returns {Promise<object>} The API response.
 */
export const searchCustomers = async (term) => {
  try {
    // Assuming there might be a search endpoint, otherwise falling back to phone
    // If the user only gave /customer/phone/, maybe it handles partials?
    const response = await httpClient.get(`/customer/phone/${term}`, true);
    return response;
  } catch (error) {
    console.error(`Failed to search customers with term ${term}:`, error);
    throw error;
  }
};
