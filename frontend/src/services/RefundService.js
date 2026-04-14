import httpClient from "./HttpClient";

/**
 * Processes a refund for selected items from a completed bill.
 * @param {object} refundData - { BillID: number, Items: [{ BillDetailID: number, QTY: number }] }
 * @returns {Promise<object>} The API response containing RefundID and VoucherCode.
 */
export const processRefund = async (refundData) => {
  try {
    console.log("[processRefund] Sending refund request:", refundData);
    console.log(
      "[processRefund] Full request body:",
      JSON.stringify(refundData, null, 2),
    );
    const response = await httpClient.post("/refund/refund", refundData, true);
    console.log("[processRefund] Response:", response);
    return response;
  } catch (error) {
    console.error("[processRefund] Failed:", error);
    throw error;
  }
};

/**
 * Sends a refund notification email to the customer.
 * @param {number} refundId - The refund ID returned from processRefund.
 * @param {string} email - The customer's email address.
 * @returns {Promise<object>} The API response.
 */
export const sendRefundNotification = async (refundId, email) => {
  try {
    console.log("[sendRefundNotification] Sending notification:", { refundId, email });
    const response = await httpClient.post(
      `/refund/refund/notify?refund_id=${encodeURIComponent(refundId)}&email=${encodeURIComponent(email)}`,
      {},
      true,
    );
    console.log("[sendRefundNotification] Response:", response);
    return response;
  } catch (error) {
    console.error("[sendRefundNotification] Failed:", error);
    throw error;
  }
};

/**
 * Fetches voucher details by voucher code.
 * @param {string} voucherCode - The voucher code to look up.
 * @returns {Promise<object>} The API response containing Code, Value, ExpiryDate, etc.
 */
export const getVoucherByCode = async (voucherCode) => {
  try {
    console.log("[getVoucherByCode] Fetching voucher:", voucherCode);
    const response = await httpClient.get(
      `/voucher/search/${voucherCode}`,
      true,
    );
    console.log("[getVoucherByCode] Response:", response);
    return response;
  } catch (error) {
    console.error("[getVoucherByCode] Failed:", error);
    throw error;
  }
};
