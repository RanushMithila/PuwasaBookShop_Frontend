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

  // Fail early if driver not loaded
  if (!printerModule) {
    const msg = 'Printer module not loaded. Please install & rebuild the "printer" package for Electron.';
    console.error(msg);
    return { success: false, error: msg };
  }

  // Try to detect default Windows printer
  let printerName = null;
  try {
    const out = execSync('wmic printer get name,default | findstr /C:"TRUE"').toString().trim();
    if (out) {
      const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const trueLine = lines.find(l => /TRUE/i.test(l));
      if (trueLine) {
        printerName = trueLine.replace(/TRUE/i, '').trim();
      }
    }
  } catch (e) {
    console.warn('Failed to query default printer via WMIC:', e.message);
  }

  if (!printerName) {
    const msg = 'No default printer found.';
    console.error(msg);
    // Save receipt to file for debugging
    const dumpPath = path.join(os.tmpdir(), `receipt-${Date.now()}.txt`);
    fs.writeFileSync(dumpPath, formatReceiptText(receiptData), 'utf8');
    return { success: false, error: msg, savedTo: dumpPath };
  }

  // Create ThermalPrinter instance
  let printer;
  try {
    printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `printer:${printerName}`,
      driver: printerModule, // pass the loaded driver
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: '='
    });
    console.log(`ThermalPrinter instance created for "${printerName}"`);
  } catch (err) {
    const msg = `Failed to create ThermalPrinter instance: ${err.message}`;
    console.error(msg);
    return { success: false, error: msg };
  }

  // Check connection
  let isConnected = false;
  try {
    isConnected = await printer.isPrinterConnected();
  } catch (err) {
    console.error('Error checking printer connection:', err.message);
  }
  if (!isConnected) {
    const msg = `Printer "${printerName}" not connected or not responding.`;
    console.error(msg);
    return { success: false, error: msg };
  }

  // Now safe to print
  try {
    printer.clear();
    printer.alignCenter();
    printer.bold(true).println('Puwasa Bookshop').bold(false);
    if (receiptData.storeAddress) printer.println(receiptData.storeAddress);
    printer.println('Tel: 011-1234567').newLine();

    printer.alignLeft();
    printer.println(`Bill ID: ${receiptData.billId || 'N/A'}`);
    printer.println(`Date: ${new Date().toLocaleString()}`);
    printer.drawLine();

    (receiptData.items || []).forEach(item => {
      const qty = Number(item.QTY || item.quantity || 0);
      const unit = Number(item.itemUnitPrice || item.price || 0);
      const lineTotal = qty * unit || 0;
      printer.tableCustom([
        { text: String(item.itemName || item.name || 'N/A'), align: 'LEFT', width: 0.55 },
        { text: `${qty} x ${unit.toFixed(2)}`, align: 'RIGHT', width: 0.20 },
        { text: lineTotal.toFixed(2), align: 'RIGHT', width: 0.25 }
      ]);
    });

    printer.drawLine();
    printer.alignRight();
    printer.println(`Subtotal: ${(Number(receiptData.subtotal) || 0).toFixed(2)}`);
    printer.println(`Discount: ${(Number(receiptData.discount) || 0).toFixed(2)}`);
    printer.bold(true).println(`TOTAL: ${(Number(receiptData.total) || 0).toFixed(2)}`).bold(false);
    printer.newLine();

    printer.alignCenter().println('Thank you for your purchase!').newLine();
    printer.cut();

    await printer.execute();
    console.log('Print job sent successfully to', printerName);
    return { success: true, printer: printerName };

  } catch (err) {
    console.error('Error during printing:', err.message);
    return { success: false, error: err.message };
  }
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
