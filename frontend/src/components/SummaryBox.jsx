import { useState } from 'react';
import useBillingStore from '../store/BillingStore';
import useAuthStore from '../store/AuthStore';
import { createBill, addBillDetails, completeBill } from '../services/BillingService';
import { printBill } from '../services/PrintingService';

const SummaryBox = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBillData, setLastBillData] = useState(null); // Holds data for the print receipt button

  // --- Correct State Management ---

  // 1. Get static data and functions that DO NOT change from the stores.
  const { user, location } = useAuthStore.getState();
  const {
    getTotal,
    getTotalDiscount,
    getSubtotal,
    getTotalItems,
    getTax,
    resetTransaction,
    setCurrentBillId,
  } = useBillingStore.getState();

  // 2. Subscribe ONLY to the data that should trigger re-renders.
  const selectedItems = useBillingStore((state) => state.selectedItems);
  const customer = useBillingStore((state) => state.customer);

  // 3. Calculate totals. These will be re-calculated whenever the component re-renders.
  const total = getTotal();
  const totalDiscount = getTotalDiscount();
  const subtotal = getSubtotal();
  const totalItems = getTotalItems();
  const tax = getTax();

  /**
   * A unified function to process the bill for both "Hold" and "Pay Now".
   * @param {boolean} isFinalCheckout - If true, completes the bill. If false, only holds it.
   */
  const processBill = async (isFinalCheckout) => {
    if (selectedItems.length === 0) {
      alert('No items in cart.');
      return;
    }
    setIsProcessing(true);
    setLastBillData(null); // Clear any previous bill data

    try {
      const billData = {
        LocationID: location?.id || 1,
        CustomerID: customer?.id || 1,
        CashierID: user?.id || 1,
      };

      const billResponse = await createBill(billData);
      if (!billResponse.status) throw new Error(billResponse.error_message || 'Failed to create bill.');
      
      const billId = billResponse.data;
      setCurrentBillId(billId);

      const itemsPayload = selectedItems.map(item => ({
        InventoryID: item.inventoryID,
        Discount: item.Discount,
        QTY: item.QTY,
      }));
      await addBillDetails({ BillID: billId, Items: itemsPayload });

      if (isFinalCheckout) {
        const paymentData = { CashAmount: total, CardAmount: 0 };
        const completeResponse = await completeBill(billId, paymentData);
        if (!completeResponse.status) throw new Error(completeResponse.error_message || 'Failed to complete billing.');
        alert(`${completeResponse.message}\nBalance: ${completeResponse.data}`);
      } else {
        alert('Bill has been successfully placed on hold.');
      }

      // On success, store the bill data for printing
      setLastBillData({
        billId,
        items: [...selectedItems],
        subtotal,
        discount: totalDiscount,
        tax,
        total,
      });

      resetTransaction();

    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles the print receipt action.
   */
  const handlePrintReceipt = () => {
    if (lastBillData) {
      printBill(lastBillData);
      setLastBillData(null); // Reset UI to show checkout buttons again
    } else {
      alert('No recent bill information available to print.');
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      
      <div className="flex-grow space-y-2">
        <div className="flex justify-between text-sm"><span>Total Items:</span><span className="font-medium">{totalItems}</span></div>
        <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
        {totalDiscount > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Discount:</span><span className="font-medium">-${totalDiscount.toFixed(2)}</span></div>)}
        <div className="flex justify-between text-sm"><span>Tax:</span><span className="font-medium">${tax.toFixed(2)}</span></div>
        <hr className="my-2"/>
        <div className="flex justify-between text-lg font-bold"><span>Total:</span><span>${total.toFixed(2)}</span></div>
      </div>
      
      <div className="space-y-2 pt-4">
        {/* Conditionally render buttons based on whether a transaction was just completed */}
        {!lastBillData ? (
          <>
            <button
              onClick={() => processBill(false)}
              disabled={isProcessing || selectedItems.length === 0}
              className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Hold Bill'}
            </button>
            <button
              onClick={() => processBill(true)}
              disabled={isProcessing || selectedItems.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </button>
          </>
        ) : (
          <button
            onClick={handlePrintReceipt}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Print Receipt
          </button>
        )}
      </div>
    </div>
  );
};

export default SummaryBox; 