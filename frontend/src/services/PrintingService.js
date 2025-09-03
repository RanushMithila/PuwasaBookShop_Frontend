/**
 * Formats the bill data into a structured array for the thermal printer.
 * This format is required by the 'electron-pos-printer' library.
 * @param {object} billData - Contains items, totals, etc.
 * @returns {Array<object>} - The structured data array for printing.
 */
const formatReceiptForPrinting = (billData) => {
  // ESC/POS commands can be used for styling (bold, underline, etc.)
  const options = {
    width: '100%',
    style: {
      fontWeight: '700',
      textAlign: 'center',
      fontSize: '24px',
      fontFamily: 'sans-serif',
    },
  };

  // Line items with proper spacing
  const items = billData.items.map(item => ({
    type: 'text',
    value: `${item.itemName.padEnd(20)} ${item.QTY} x ${item.itemUnitPrice.toFixed(2).padStart(7)}`,
    style: { fontFamily: 'monospace', fontSize: '15px' }
  }));

  const receiptData = [
    { type: 'text', value: 'Puwasa Bookshop', style: { ...options.style, textAlign: 'center' } },
    { type: 'text', value: '123 Bookworm Lane, Colombo', style: { textAlign: 'center' } },
    { type: 'text', value: 'Tel: 011-1234567', style: { textAlign: 'center', marginBottom: '10px' } },
    { type: 'hr' },
    { type: 'text', value: `Bill ID: ${billData.billId}`, style: { fontFamily: 'monospace', fontSize: '15px' } },
    { type: 'text', value: `Date: ${new Date().toLocaleString()}`, style: { fontFamily: 'monospace', fontSize: '15px', marginBottom: '10px' } },
    { type: 'hr' },
    ...items,
    { type: 'hr' },
    { type: 'text', value: `Subtotal: ${billData.subtotal.toFixed(2).padStart(10)}`, style: { fontFamily: 'monospace', fontSize: '16px', textAlign: 'right' } },
    { type: 'text', value: `Discount: ${billData.discount.toFixed(2).padStart(10)}`, style: { fontFamily: 'monospace', fontSize: '16px', textAlign: 'right' } },
    { type: 'text', value: `TOTAL:    ${billData.total.toFixed(2).padStart(10)}`, style: { fontFamily: 'monospace', fontSize: '18px', fontWeight: '700', textAlign: 'right', marginTop: '5px' } },
    { type: 'hr' },
    { type: 'text', value: 'Thank you for your purchase!', style: { textAlign: 'center', marginTop: '10px' } },
    { type: 'qrCode', value: `BILLID-${billData.billId}`, size: 6 }, // Example QR Code
  ];

  return receiptData;
};

/**
 * Sends the formatted bill data to the Electron main process for printing.
 * @param {object} billData - The raw bill data from the store.
 * @returns {Promise<void>}
 */
/**
 * Sends the bill data to the Electron main process for printing.
 * The main process will handle all the formatting.
 * @param {object} billData - The raw bill data from the store.
 * @returns {Promise<void>}
 */
export const printBill = async (billData) => {
  // Check if the Electron print API is available on the window object
  if (window.electronAPI && window.electronAPI.printReceipt) {
    try {
      console.log("Sending data to main process for printing:", billData);
      // 'invoke' sends a request and waits for a response from the main process
      const result = await window.electronAPI.printReceipt(billData);
      
      if (result.success) {
        alert('Receipt sent to printer successfully!');
      } else {
        // The error message now comes directly from the main process
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Printing failed:', error);
      alert(`Printing failed: ${error.message}`);
    }
  } else {
    console.warn('Print function not available. Are you running in Electron?');
    alert('Printing is only available in the desktop app.');
  }
};