const { ipcMain } = require('electron');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const { execSync } = require('child_process');

ipcMain.handle('print-receipt', async (event, receiptData) => {
  try {
    const defaultPrinter = execSync('wmic printer get name,default | findstr /C:"TRUE"').toString().trim();
    const printerName = defaultPrinter.split('TRUE')[0].trim();

    if (!printerName) throw new Error("No default printer found.");

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `printer:${printerName}`,
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: "=",
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) throw new Error("Printer not connected.");

    printer.alignCenter();
    printer.bold(true).println("Puwasa Bookshop").bold(false);
    printer.println("123 Bookworm Lane, Colombo");
    printer.println("Tel: 011-1234567").newLine();

    printer.alignLeft();
    printer.println(`Bill ID: ${receiptData.billId || 'N/A'}`);
    printer.println(`Date: ${new Date().toLocaleString()}`);
    printer.drawLine();

    receiptData.items.forEach(item => {
      const total = (item.QTY * item.itemUnitPrice).toFixed(2);
      printer.tableCustom([
        { text: item.itemName || 'N/A', align: "LEFT", width: 0.55 },
        { text: `${item.QTY || 0} x ${(item.itemUnitPrice || 0).toFixed(2)}`, align: "RIGHT", width: 0.20 },
        { text: total, align: "RIGHT", width: 0.25 },
      ]);
    });

    printer.drawLine();
    printer.alignRight();
    printer.println(`Subtotal: ${(receiptData.subtotal || 0).toFixed(2)}`);
    printer.println(`Discount: ${(receiptData.discount || 0).toFixed(2)}`);
    printer.bold(true).println(`TOTAL: ${(receiptData.total || 0).toFixed(2)}`).bold(false);
    printer.newLine();

    printer.alignCenter().println("Thank you for your purchase!").newLine();
    printer.cut();

    await printer.execute();
    console.log("Print job sent successfully.");
    return { success: true };
  } catch (error) {
    console.error("Print error:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
});