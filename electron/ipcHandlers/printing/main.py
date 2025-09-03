import sys
import json
import win32print
import win32api
import tempfile
from datetime import datetime

def generate_receipt_text(data):
    lines = []
    lines.append("Puwasa Bookshop".center(32))
    if data.get("storeAddress"):
        lines.append(data["storeAddress"].center(32))
    lines.append("Tel: 011-1234567".center(32))
    lines.append("-" * 32)
    lines.append(f"Bill ID: {data.get('billId', 'N/A')}")
    lines.append(f"Date: {data.get('date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))}")
    lines.append("-" * 32)
    for item in data.get("items", []):
        qty = item.get("QTY", 0)
        price = item.get("itemUnitPrice", 0)
        total = qty * price
        name = item.get("itemName", "N/A")[:20]
        lines.append(f"{name:20} {qty} x {price:.2f} {total:.2f}")
    lines.append("-" * 32)
    lines.append(f"Subtotal: {data.get('subtotal',0):.2f}")
    lines.append(f"Discount: {data.get('discount',0):.2f}")
    lines.append(f"TOTAL: {data.get('total',0):.2f}")
    lines.append("\nThank you for your purchase!\n\n")
    lines.append("\x1dV\x41")  # ESC/POS cut command
    return "\n".join(lines)

def print_to_default_printer(data):
    printer_name = win32print.GetDefaultPrinter()
    receipt_text = generate_receipt_text(data)

    # write to temp file
    with tempfile.NamedTemporaryFile(delete=False, mode='w', suffix=".txt") as f:
        f.write(receipt_text)
        temp_file = f.name

    # send to printer
    win32api.ShellExecute(
        0,
        "print",
        temp_file,
        f'/d:"{printer_name}"',
        ".",
        0
    )

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: print_receipt.py '<json_data>'")
        sys.exit(1)
    try:
        data = json.loads(sys.argv[1])
        print_to_default_printer(data)
        print("Print job sent successfully to", win32print.GetDefaultPrinter())
        sys.exit(0)
    except Exception as e:
        print("Error:", e)
        sys.exit(2)
