import React from 'react';

const Receipt = React.forwardRef(({ items = [], total = 0, discount = 0, netTotal = 0 }, ref) => {
  const currentDate = new Date().toLocaleString();

  return (
    <div ref={ref} className="p-4 text-sm text-black w-80 print:block hidden">
      <h2 className="text-center font-bold text-lg">POS Receipt</h2>
      <p className="text-center mb-2">{currentDate}</p>

      <table className="w-full mb-2 border-t border-b border-black">
        <thead>
          <tr>
            <th className="text-left">Item</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.name || 'N/A'}</td>
              <td className="text-right">{item.quantity || 0}</td>
              <td className="text-right">
                Rs: {(item.price && item.quantity ? item.price * item.quantity : 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>Rs: {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>Rs: {discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-black pt-1 mt-1">
          <span>Total:</span>
          <span>Rs: {netTotal.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-center mt-4">Thank you for your purchase!</p>
    </div>
  );
});

export default Receipt;