import React, { useEffect, useRef, useState } from "react";
import useBillingStore from "../store/BillingStore";

const BillingItemRow = ({
  item,
  onDoubleClick,
  registerRowRef,
  onFocusItemCode,
}) => {
  const [quantity, setQuantity] = useState(item.QTY || 1);
  // perItemDiscount: the numeric value (per single item)
  const [perItemDiscount, setPerItemDiscount] = useState(0);
  // discountInputValue: the raw string shown in the input while typing
  const [discountInputValue, setDiscountInputValue] = useState("0.00");
  // isDiscountFocused: tracks if discount input is focused (to show raw vs formatted)
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);
  // totalDiscount: the calculated discount (perItemDiscount × quantity) used for amount display
  const [totalDiscount, setTotalDiscount] = useState(item.Discount || 0);
  const updateItemQuantity = useBillingStore(
    (state) => state.updateItemQuantity,
  );
  const updateItemDiscount = useBillingStore(
    (state) => state.updateItemDiscount,
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
    // Recalculate total discount when quantity changes
    if (perItemDiscount > 0) {
      const newTotalDiscount = parseFloat((perItemDiscount * qty).toFixed(2));
      setTotalDiscount(newTotalDiscount);
      updateItemDiscount(item.inventoryID, newTotalDiscount);
    }
  };

  const handleDiscountInputChange = (newDiscount) => {
    // Store raw input value while typing
    setDiscountInputValue(newDiscount);
    // Parse and store numeric value
    const raw = parseFloat(newDiscount);
    const disc = isNaN(raw) ? 0 : Math.max(0, raw);
    setPerItemDiscount(disc);
  };

  const handleDiscountBlur = () => {
    // Format to 2 decimal places when leaving the field
    setDiscountInputValue(perItemDiscount.toFixed(2));
    setIsDiscountFocused(false);
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick(item.inventoryID);
    }
  };

  // Calculate amount after total discount (per-item × quantity)
  const baseAmount = (item.itemUnitPrice || 0) * quantity;
  const discountAmount = Math.min(totalDiscount, baseAmount);
  const finalAmount = baseAmount - discountAmount;

  return (
    <div
      className="grid text-sm py-2 border-b hover:bg-emerald-50/40 cursor-pointer transition-colors"
      style={{
        gridTemplateColumns: "240px 1fr 120px 70px 120px 100px",
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

      {/* Discount (per-item) column */}
      <div className="flex items-center">
        <span className="text-xs mr-1">Rs:</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={discountInputValue}
          onChange={(e) => handleDiscountInputChange(e.target.value)}
          className="w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="0.00"
          onClick={(e) => {
            e.stopPropagation();
            e.target.select();
          }}
          onFocus={(e) => {
            setIsDiscountFocused(true);
            e.target.select();
          }}
          onBlur={handleDiscountBlur}
          onDoubleClick={(e) => e.stopPropagation()}
          ref={discountRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              // Multiply the entered per-item discount by quantity
              // e.g., if user enters 10 and qty is 5, the total discount becomes 50
              // Input stays at 10.00, but amount shows -Rs: 50.00
              const perItem = parseFloat(e.target.value) || 0;
              const total = parseFloat((perItem * quantity).toFixed(2));
              setTotalDiscount(total);
              updateItemDiscount(item.inventoryID, total);
              // Format the input to 2 decimal places
              setDiscountInputValue(perItem.toFixed(2));
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
