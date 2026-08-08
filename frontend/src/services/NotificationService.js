import httpClient from "./HttpClient";

/**
 * Fetches the payment reminder notification for the current tenant.
 * GET /notifications/paymentreminder
 *
 * Expected response shape:
 * {
 *   status: boolean,
 *   error_message: string,
 *   message: string,
 *   data: {
 *     next_billing_date: string,   // e.g. "2026-09-01"
 *     remaining_days: number
 *   }
 * }
 *
 * @returns {Promise<object>} The API response.
 */
export const getPaymentReminder = async () => {
  try {
    console.log("Fetching payment reminder...");
    const response = await httpClient.get(
      "/notifications/paymentreminder",
      true
    );
    console.log("Payment reminder response:", response);
    return response;
  } catch (error) {
    console.error("Failed to fetch payment reminder:", error);
    // Return a safe fallback so callers don't need to handle thrown errors
    return {
      status: false,
      error_message: error.message || "Failed to fetch payment reminder",
      message: "",
      data: null,
    };
  }
};
