const { ipcMain } = require('electron');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

let printerModule = null;
try {
  printerModule = require('printer'); // native module
  console.log('Printer module loaded successfully');
} catch (err) {
  console.error('Failed to load "printer" module:', err.message);
}

ipcMain.handle('print-receipt', async (event, receiptData = {}) => {
  console.log('print receipt: receiptData:', receiptData);

  try {
    const out = execSync('./printing/main.py', { input: JSON.stringify(receiptData) }).toString().trim();
    if (out) {
      console.log('print receipt: python output:', out);
      return { success: true, savedTo: out };
    }
  } catch (e) {
    console.warn('Failed to query default printer via WMIC:', e.message);
  }
    console.log('Print job sent successfully to', printerName);
    return { success: true, printer: printerName };
});

// Helper for fallback receipt file
function formatReceiptText(receiptData = {}) {
  let lines = [];
  lines.push('Puwasa Bookshop');
  lines.push(`Date: ${new Date().toLocaleString()}`);
  lines.push(`Bill ID: ${receiptData.billId || 'N/A'}`);
  lines.push('----------------------------------------');
  (receiptData.items || []).forEach(i => {
    const qty = Number(i.QTY || i.quantity || 0);
    const unit = Number(i.itemUnitPrice || i.price || 0);
    const total = qty * unit || 0;
    lines.push(`${i.itemName || i.name || 'N/A'}\t${qty} x ${unit.toFixed(2)}\t${total.toFixed(2)}`);
  });
  lines.push('----------------------------------------');
  lines.push(`Subtotal: ${(Number(receiptData.subtotal) || 0).toFixed(2)}`);
  lines.push(`Discount: ${(Number(receiptData.discount) || 0).toFixed(2)}`);
  lines.push(`TOTAL: ${(Number(receiptData.total) || 0).toFixed(2)}`);
  lines.push('');
  lines.push('Thank you for your purchase!');
  return lines.join(os.EOL);
}
