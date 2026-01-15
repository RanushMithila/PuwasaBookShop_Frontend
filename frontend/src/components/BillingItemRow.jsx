import React, { useEffect, useRef, useState } from "react";
import useBillingStore from "../store/BillingStore";

const BillingItemRow = ({
  item,
  onDoubleClick,
  registerRowRef,
  onFocusItemCode,
}) => {
  const [quantity, setQuantity] = useState(item.QTY || 1);
  const [discount, setDiscount] = useState(item.Discount || 0);
  const updateItemQuantity = useBillingStore(
    (state) => state.updateItemQuantity
  );
  const updateItemDiscount = useBillingStore(
    (state) => state.updateItemDiscount
  );
  const qtyRef = useRef(null);
  const discountRef = useRef(null);

  useEffect(() => {
    if (typeof registerRowRef === "function") {
      registerRowRef(item.inventoryID, { qtyRef, discountRef });
    }
  }, [item.inventoryID, registerRowRef]);

  const handleQuantityChange = (newQuantity) => {
    const qty = Math.max(1, parseInt(newQuantity) || 1);
    setQuantity(qty);
    updateItemQuantity(item.inventoryID, qty);
  };

  const handleDiscountChange = (newDiscount) => {
    const raw = parseFloat(newDiscount);
    const disc = isNaN(raw) ? 0 : Math.max(0, raw);
    const rounded = parseFloat(disc.toFixed(2));
    setDiscount(rounded);
    updateItemDiscount(item.inventoryID, rounded);
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(item.inventoryID);
    }
  };

  // Calculate amount after discount
  const baseAmount = (item.itemUnitPrice || 0) * quantity;
  const discountAmount = Math.min(discount, baseAmount);
  const finalAmount = baseAmount - discountAmount;

  return (
    <div
      className="grid text-sm py-2 border-b hover:bg-emerald-50/40 cursor-pointer transition-colors"
      style={{
        gridTemplateColumns: "120px 1fr 120px 70px 120px 100px",
        columnGap: "12px",
      }}
      onDoubleClick={handleDoubleClick}
      title="Double-click to remove item"
    >
      {/* Item Code column */}
      <div className="pr-2 flex items-center text-sm text-gray-700 uppercase">
        <div className="truncate">
          {item.barcode || item.inventoryID || "N/A"}
        </div>
      </div>

      {/* Description column */}
      <div className="truncate pr-2 uppercase">
        <div className="font-medium">{item.itemName}</div>
        <div className="text-xs text-gray-500">{item.itemDescription}</div>
      </div>

      {/* Unit Price column */}
      <div className="flex items-center font-medium text-gray-800">
        Rs: {(item.itemUnitPrice || 0).toFixed(2)}
      </div>

      {/* Quantity column */}
      <div className="flex items-center">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-16 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          onClick={(e) => e.stopPropagation()} // Prevent click events from bubbling
          onDoubleClick={(e) => e.stopPropagation()} // Prevent double-click from removing item
          ref={qtyRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              // Move focus to discount input
              if (discountRef.current) {
                discountRef.current.focus();
                discountRef.current.select?.();
              }
            }
          }}
        />
      </div>

      {/* Amount column */}
      <div className="flex items-center font-semibold text-gray-900">
        Rs: {finalAmount.toFixed(2)}
        {discountAmount > 0 && (
          <span className="text-xs text-emerald-700 ml-1">
            (-Rs: {discountAmount.toFixed(2)})
          </span>
        )}
      </div>

      {/* Discount (absolute) column */}
      <div className="flex items-center">
        <span className="text-xs mr-1">Rs:</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={discount}
          onChange={(e) => handleDiscountChange(e.target.value)}
          className="w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="0.00"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          ref={discountRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              // After discount, focus back to the Item Code input to continue adding items
              if (typeof onFocusItemCode === "function") {
                onFocusItemCode();
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default BillingItemRow;
