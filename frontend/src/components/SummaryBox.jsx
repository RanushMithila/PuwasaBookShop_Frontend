import { useState } from 'react';
import useBillingStore from '../store/BillingStore';
import useAuthStore from '../store/AuthStore';
import { createBill, addBillDetails, completeBill } from '../services/BillingService'; // Ensure this import exists

const SummaryBox = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, location } = useAuthStore.getState();
  const {
    getTotal,
    getTotalDiscount,
    getSubtotal,
    getTotalItems,
    resetTransaction,
    setCurrentBillId,
  } = useBillingStore.getState();

  const selectedItems = useBillingStore((state) => state.selectedItems);
  const customer = useBillingStore((state) => state.customer);

  const total = getTotal();
  const totalDiscount = getTotalDiscount();
  const subtotal = getSubtotal();
  const totalItems = getTotalItems();

  const handlePayAndPrintReceipt = async () => {
    if (selectedItems.length === 0) {
      alert('No items in cart.');
      return;
    }
    setIsProcessing(true);

    try {
      const billData = {
        LocationID: location?.id || 1,
        CustomerID: customer?.id || 1,
        CashierID: user?.id || 1,
      };

      const billResponse = await createBill(billData); // Ensure createBill is defined and imported
      if (!billResponse.status) throw new Error(billResponse.error_message || 'Failed to create bill.');

      const billId = billResponse.data;
      setCurrentBillId(billId);

      const itemsPayload = selectedItems.map(item => ({
        InventoryID: item.inventoryID,
        Discount: item.Discount,
        QTY: item.QTY,
      }));
      await addBillDetails({ BillID: billId, Items: itemsPayload });

      const paymentData = { CashAmount: total, CardAmount: 0 };
      const completeResponse = await completeBill(billId, paymentData);
      if (!completeResponse.status) throw new Error(completeResponse.error_message || 'Failed to complete billing.');

      alert(`${completeResponse.message}\nBalance: ${completeResponse.data}`);

      const receiptData = {
        billId,
        items: [...selectedItems],
        subtotal,
        discount: totalDiscount,
        total,
      };

      const printResponse = await window.electron.ipcRenderer.invoke('print-receipt', receiptData);
      if (!printResponse.success) throw new Error(printResponse.error);

      alert('Receipt printed successfully.');
      resetTransaction();
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      <div className="flex-grow space-y-2">
        <div className="flex justify-between text-sm"><span>Total Items:</span><span className="font-medium">{totalItems}</span></div>
        <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
        {totalDiscount > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Discount:</span><span className="font-medium">-${totalDiscount.toFixed(2)}</span></div>)}
        <hr className="my-2" />
        <div className="flex justify-between text-lg font-bold"><span>Total:</span><span>${total.toFixed(2)}</span></div>
      </div>

      <div className="space-y-2 pt-4">
        <button
          onClick={() => processBill(false)}
          disabled={isProcessing || selectedItems.length === 0}
          className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Hold Bill'}
        </button>
        <button
          onClick={handlePayAndPrintReceipt}
          disabled={isProcessing || selectedItems.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
};

export default SummaryBox;