import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import SummaryBox from '../components/SummaryBox';
import BillingItemRow from '../components/BillingItemRow';
import useBillingStore from '../store/BillingStore';
import { useEffect, useRef } from 'react';
import { getItemByBarcode } from '../services/InventoryService';
import Receipt from '../components/Receipt';

const BillingPage = () => {
  const selectedItems = useBillingStore((state) => state.selectedItems);
  const addItem = useBillingStore((state) => state.addItem);
  const removeItem = useBillingStore((state) => state.removeItem);

  const receiptRef = useRef();

  useEffect(() => {
    let buffer = '';
    let lastTime = Date.now();

    const onKeyDown = (e) => {
      const currentTime = Date.now();

      if (currentTime - lastTime > 100) buffer = '';

      if (e.key === 'Enter') {
        if (buffer.length >= 5) {
          getItemByBarcode(buffer, 1).then((res) => {
            res.forEach((item) => {
              addItem({
                inventoryID: item.id,
                itemName: item.title,
                itemUnitPrice: item.price,
                itemCostPrice: item.cost_price,
                barcode: item.barcode,
                itemDescription: item.author,
                itemCategory: item.category,
                locationID: item.location_id,
                QTY: 1,
                Discount: 0,
                amount: item.price,
              });
            });
          });
        }
        buffer = '';
      } else {
        buffer += e.key;
      }

      lastTime = currentTime;
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addItem]);

  const handleItemSelect = (item) => {
    addItem({
      inventoryID: item.id,
      itemName: item.title,
      itemUnitPrice: item.price,
      itemCostPrice: item.cost_price,
      barcode: item.barcode,
      itemDescription: item.author,
      itemCategory: item.category,
      locationID: item.location_id,
      QTY: 1,
      Discount: 0,
      amount: item.price,
    });
  };

  const handleItemRemove = (itemId) => {
    removeItem(itemId);
  };

  const handlePrint = () => {
    const receiptData = {
      items: selectedItems,
      subtotal: useBillingStore.getState().getSubtotal(),
      discount: useBillingStore.getState().getTotalDiscount(),
      total: useBillingStore.getState().getTotal(),
    };

    window.electron.ipcRenderer.invoke('print-receipt', receiptData)
      .then((response) => {
        if (response.success) {
          console.log('Receipt printed successfully.');
        } else {
          console.error('Failed to print receipt:', response.error);
        }
      });
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-grow p-4 bg-gray-100">
          <SearchBar onItemSelect={handleItemSelect} />
          <div className="overflow-y-auto bg-white rounded shadow mt-4 px-4 py-2 flex-grow">
            <div className="grid grid-cols-5 text-sm font-semibold border-b py-2">
              <div>Item Name</div>
              <div>Unit Price</div>
              <div>QTY</div>
              <div>Amount</div>
              <div>Discount</div>
            </div>
            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items selected. Search and select items to add to bill.
                <br />
                <small className="text-xs">Double-click on items to remove them</small>
              </div>
            ) : (
              selectedItems.map((item, index) => (
                <BillingItemRow
                  key={item.inventoryID || `item-${index}`}
                  item={item}
                  onDoubleClick={() => handleItemRemove(item.inventoryID)}
                />
              ))
            )}
          </div>
          <button
            onClick={handlePrint}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 self-end"
          >
            Print Receipt
          </button>
        </div>
        <div className="w-[300px] bg-white p-4 border-l">
          <SummaryBox />
        </div>
      </div>

      {/* Hidden printable receipt */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef}>
          <Receipt items={selectedItems} />
        </div>
      </div>
    </>
  );
};

export default BillingPage;