import { useState } from 'react';
import useBillingStore from '../store/BillingStore';
import useAuthStore from '../store/AuthStore';
import { createBill, addBillDetails, completeBill } from '../services/BillingService';
import { useSearch } from '../contexts/SearchContext';

const SummaryBox = () => {
  console.log('Electron API:', window.electron);
  const [isProcessing, setIsProcessing] = useState(false);
  const { hideSearchResults } = useSearch();

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
    // Hide search results when Pay Now is clicked
    hideSearchResults();

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

      // Prefer the bill id stored in the billing store (ensures consistency)
      const storeBillId = useBillingStore.getState().currentBillId || billId;

      const receiptData = {
        BillID: storeBillId,
        date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        CashierID: user?.id || 1,
        Total: total,
        Discount: totalDiscount,
        // Provide a normalized Details array expected by the printer
        Details: selectedItems.map(item => ({
          ItemName: item.itemName || item.ItemName || 'Item',
          QTY: Number(item.QTY || 1),
          UnitPrice: Number(item.itemUnitPrice || item.UnitPrice || 0),
        })),
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

  const handleHoldBill = () => {
    // Hide search results when Hold Bill is clicked
    hideSearchResults();
    
    // Add your hold bill logic here
    processBill(false);
  };

  return (
    <div className="space-y-4 p-4 bg-white h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      <div className="flex-grow space-y-2">
        <div className="flex justify-between text-sm"><span>Total Items:</span><span className="font-medium">{totalItems}</span></div>
        <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-medium">Rs:{subtotal.toFixed(2)}</span></div>
        {totalDiscount > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Discount:</span><span className="font-medium">-Rs:{totalDiscount.toFixed(2)}</span></div>)}
        <hr className="my-2" />
        <div className="flex justify-between text-lg font-bold"><span>Total:</span><span>Rs:{total.toFixed(2)}</span></div>
      </div>

      <div className="space-y-2 pt-4">
        <button
          onClick={handleHoldBill}
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
        <button
          onClick={() => {
            // Clear store-level transaction
            try { resetTransaction(); } catch (e) { /* ignore */ }
            // Dispatch a global event so pages with local UI can clear too
            try { window.dispatchEvent(new CustomEvent('puwasa:clear')); } catch (e) { /* ignore */ }
          }}
          className="w-full bg-white text-red-600 py-3 px-4 rounded-lg font-semibold border border-red-200 hover:bg-red-50 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SummaryBox;