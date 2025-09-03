import httpClient from './HttpClient';

/**
 * Creates a new bill record.
 * @param {object} billingData - Data for creating the bill (e.g., { LocationID, CustomerID, CashierID }).
 * @returns {Promise<object>} The API response.
 */
export const createBill = async (billingData) => {
    try {
        console.log('Creating bill with data:', billingData);
        // HttpClient is configured to handle auth, so no need to pass headers manually.
        const response = await httpClient.post('/billing/billing', billingData);
        console.log('Create bill response:', response);
        return response;
    } catch (error) {
        console.error('Create bill failed:', error);
        // Propagate the error to be handled by the component.
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
        console.log('Adding bill details with data:', detailsData);
        const response = await httpClient.post('/billing/details', detailsData);
        console.log('Add bill details response:', response);
        return response;
    } catch (error) {
        console.error('Add bill details failed:', error);
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
        const response = await httpClient.post(`/billing/billing/complete/${billId}`, paymentData);
        console.log('Complete bill response:', response);
        return response;
    } catch (error) {
        console.error('Complete bill failed:', error);
        throw error;
    }
};