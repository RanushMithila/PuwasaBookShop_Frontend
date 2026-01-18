import httpClient from "./HttpClient";

/**
 * Creates a new bill record.
 * @param {object} billingData - Data for creating the bill (e.g., { LocationID, CustomerID, CashierID }).
 * @returns {Promise<object>} The API response.
 */
export const createBill = async (billingData) => {
  try {
    console.log("Creating bill with data:", billingData);
    const response = await httpClient.post(
      "/billing/billing",
      billingData,
      true
    );
    console.log("Create bill response:", response);
    return response;
  } catch (error) {
    console.error("Create bill failed:", error);
    throw error;
  }
};

/**
 * Adds items to an existing bill.
 * @param {object} detailsData - Data for the bill details (e.g., { BillID, Items }).
 * @returns {Promise<object>} The API response.
 */
export const addBillDetails = async (detailsData) => {
  try {
    console.log("Adding bill details with data:", detailsData);
    const response = await httpClient.post(
      "/billing/details",
      detailsData,
      true
    );
    console.log("Add bill details response:", response);
    return response;
  } catch (error) {
    console.error("Add bill details failed:", error);
    throw error;
  }
};

/**
 * Gets a bill by ID.
 * @param {number} billId - The ID of the bill to retrieve.
 * @returns {Promise<object>} The API response.
 */
export const getBill = async (billId) => {
  try {
    console.log(`Getting bill ${billId}`);
    const response = await httpClient.get(`/billing/billing/${billId}`, true);
    console.log("Get bill response:", response);
    return response;
  } catch (error) {
    console.error("Get bill failed:", error);
    throw error;
  }
};

/**
 * Completes a bill with payment information.
 * @param {number} billId - The ID of the bill to complete.
 * @param {object} paymentData - Payment details (e.g., { CashAmount, CardAmount }).
 * @returns {Promise<object>} The API response.
 */
export const completeBill = async (billId, paymentData) => {
  try {
    console.log(`Completing bill ${billId} with payment:`, paymentData);
    const response = await httpClient.post(
      `/billing/billing/complete/${billId}`,
      paymentData,
      true
    );
    console.log("Complete bill response:", response);
    return response;
  } catch (error) {
    console.error("Complete bill failed:", error);
    throw error;
  }
};

/**
 * Gets item details by barcode and location.
 * @param {string} barcode - The barcode of the item.
 * @param {number} locationId - The location ID.
 * @returns {Promise<object>} The API response.
 */
export const getItemByBarcode = async (barcode, locationId) => {
  try {
    console.log(`Getting item by barcode: ${barcode}, location: ${locationId}`);
    const response = await httpClient.get(
      `/inventory/getItem/${barcode}/${locationId}`,
      false
    );
    console.log("Get item by barcode response:", response);
    return response;
  } catch (error) {
    console.error("Get item by barcode failed:", error);
    throw error;
  }
};

/**
 * Gets item quantity by barcode and location.
 * @param {string} barcode - The barcode of the item.
 * @param {number} locationId - The location ID.
 * @returns {Promise<object>} The API response.
 */
export const getItemQuantity = async (barcode, locationId) => {
  try {
    console.log(
      `Getting item quantity by barcode: ${barcode}, location: ${locationId}`
    );
    const response = await httpClient.get(
      `/inventory/getItemQTY/${barcode}/${locationId}`,
      false
    );
    console.log("Get item quantity response:", response);
    return response;
  } catch (error) {
    console.error("Get item quantity failed:", error);
    throw error;
  }
};

/**
 * Cancels a billing (temporary) by ID.
 * @param {number} billId
 * @returns {Promise<object>}
 */
export const cancelBill = async (billId) => {
  try {
    console.log(`Cancelling bill ${billId}`);
    const response = await httpClient.delete(
      `/billing/billing/cancel/${billId}`,
      true
    );
    console.log("Cancel bill response:", response);
    return response;
  } catch (error) {
    console.error("Cancel bill failed:", error);
    throw error;
  }
};

/**
 * Retrieves list of temporary (incomplete) bills for a location.
 * @param {number} locationId
 * @returns {Promise<object>} API response containing data: [ { BillID, CustomerID, Total, Discount, createdDateTime } ]
 */
export const getTemporaryBills = async (locationId) => {
  try {
    console.log(`Getting temporary bills for location ${locationId}`);
    const response = await httpClient.get(
      `/billing/tempbills/${locationId}`,
      true
    );
    console.log("Get temporary bills response:", response);
    return response;
  } catch (error) {
    console.error("Get temporary bills failed:", error);
    throw error;
  }
};

/**
 * Gets inventory items.
 * @param {number} locationId - The location ID.
 * @returns {Promise<object>} The API response.
 */
export const getInventory = async (locationId) => {
  try {
    console.log(`Getting inventory for location: ${locationId}`);
    const response = await httpClient.get(
      `/inventory/getAll/${locationId}`,
      true
    );
    console.log("Get inventory response:", response);
    return response;
  } catch (error) {
    console.error("Get inventory failed:", error);
    throw error;
  }
};

/**
 * Searches items by name.
 * @param {string} name - The search term.
 * @param {number} locationId - The location ID.
 * @returns {Promise<object>} The API response.
 */
export const searchItemsByName = async (name, locationId) => {
  try {
    console.log(`Searching items by name: ${name}, location: ${locationId}`);
    const response = await httpClient.get(
      `/inventory/searchByName/${name}/${locationId}`,
      true
    );
    console.log("Search items by name response:", response);
    return response;
  } catch (error) {
    console.error("Search items by name failed:", error);
    throw error;
  }
};
