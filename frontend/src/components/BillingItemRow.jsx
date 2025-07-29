import React, { useState } from 'react';
import useBillingStore from '../store/BillingStore';

const BillingItemRow = ({ item, onDoubleClick }) => {
  const [quantity, setQuantity] = useState(item.QTY || 1);
  const [discount, setDiscount] = useState(item.Discount || 0);
  const updateItemQuantity = useBillingStore((state) => state.updateItemQuantity);
  const updateItemDiscount = useBillingStore((state) => state.updateItemDiscount);

  const handleQuantityChange = (newQuantity) => {
    const qty = Math.max(1, parseInt(newQuantity) || 1);
    setQuantity(qty);
    updateItemQuantity(item.inventoryID, qty);
  };

  const handleDiscountChange = (newDiscount) => {
    const disc = Math.max(0, Math.min(100, parseFloat(newDiscount) || 0));
    setDiscount(disc);
    updateItemDiscount(item.inventoryID, disc);
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(item.inventoryID);
    }
  };

  // Calculate amount after discount
  const baseAmount = (item.itemUnitPrice || 0) * quantity;
  const discountAmount = baseAmount * (discount / 100);
  const finalAmount = baseAmount - discountAmount;

  return (
    <div 
      className="grid grid-cols-5 text-sm py-2 border-b hover:bg-gray-50 cursor-pointer transition-colors"
      onDoubleClick={handleDoubleClick}
      title="Double-click to remove item"
    >
      <div className="truncate pr-2">
        <div className="font-medium">{item.itemName}</div>
        <div className="text-xs text-gray-500">{item.itemDescription}</div>
      </div>
      
      <div className="flex items-center">
        ${(item.itemUnitPrice || 0).toFixed(2)}
      </div>
      
      <div className="flex items-center">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-16 px-2 py-1 border rounded text-center"
          onClick={(e) => e.stopPropagation()} // Prevent double-click when editing
        />
      </div>
      
      <div className="flex items-center font-medium">
        ${finalAmount.toFixed(2)}
        {discount > 0 && (
          <span className="text-xs text-green-600 ml-1">
            (-${discountAmount.toFixed(2)})
          </span>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={discount}
          onChange={(e) => handleDiscountChange(e.target.value)}
          className="w-16 px-2 py-1 border rounded text-center"
          placeholder="0"
          onClick={(e) => e.stopPropagation()} // Prevent double-click when editing
        />
        <span className="text-xs text-gray-500 ml-1">%</span>
      </div>
    </div>
  );
};

export default BillingItemRow;