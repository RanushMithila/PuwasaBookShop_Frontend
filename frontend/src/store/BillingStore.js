import { create } from "zustand";

const useBillingStore = create((set, get) => ({
  // --- STATE ---
  selectedItems: [],
  customer: null, // Holds the selected customer object { id, name }
  paymentMethod: "cash",
  currentBillId: null, // Stores the ID of a bill that is on hold or being processed

  // --- ACTIONS ---

  // Sets the customer for the current transaction
  setCustomer: (customerData) => set({ customer: customerData }),

  // Sets the ID for the current bill, useful for resuming a held bill
  setCurrentBillId: (id) => set({ currentBillId: id }),

  // Adds an item to the cart or increments its quantity if it already exists
  addItem: (item) =>
    set((state) => {
      const existingIndex = state.selectedItems.findIndex(
        (existingItem) => existingItem.inventoryID === item.inventoryID,
      );
      if (existingIndex !== -1) {
        const updatedItems = [...state.selectedItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          QTY: updatedItems[existingIndex].QTY + 1,
        };
        return { selectedItems: updatedItems };
      } else {
        // Keep provided QTY / Discount if passed (used when loading existing bill)
        const initialQty = item.QTY != null ? Math.max(1, item.QTY) : 1;
        const initialDiscount = item.Discount != null ? item.Discount : 0;
        return {
          selectedItems: [
            ...state.selectedItems,
            { ...item, QTY: initialQty, Discount: initialDiscount },
          ],
        };
      }
    }),

  // Removes an item from the cart entirely
  removeItem: (inventoryID) =>
    set((state) => ({
      selectedItems: state.selectedItems.filter(
        (item) => item.inventoryID !== inventoryID,
      ),
    })),

  // Updates the quantity of a specific item in the cart
  updateItemQuantity: (inventoryID, quantity) =>
    set((state) => ({
      selectedItems: state.selectedItems.map((item) =>
        item.inventoryID === inventoryID
          ? { ...item, QTY: Math.max(1, quantity) }
          : item,
      ),
    })),

  // Updates the discount amount (absolute rupees) of a specific item
  updateItemDiscount: (inventoryID, discount) =>
    set((state) => ({
      // Discount now represents an absolute currency amount applied to the whole line, capped at line total
      selectedItems: state.selectedItems.map((item) => {
        if (item.inventoryID !== inventoryID) return item;
        const lineTotal = (item.itemUnitPrice || 0) * (item.QTY || 1);
        const safeDiscount = Math.max(
          0,
          Math.min(lineTotal, parseFloat(discount) || 0),
        );
        const rounded = parseFloat(safeDiscount.toFixed(2));
        return { ...item, Discount: rounded };
      }),
    })),

  // Resets the entire transaction state for a new sale
  resetTransaction: () =>
    set({
      selectedItems: [],
      customer: null,
      paymentMethod: "cash",
      currentBillId: null,
    }),

  // Clears only the selected items (used when loading a temporary bill) while preserving current bill id
  clearItems: () => set({ selectedItems: [] }),

  // --- COMPUTED GETTERS ---

  // Calculates the total price before any discounts or taxes (rounded to 2 decimals)
  getSubtotal: () => {
    const sum = get().selectedItems.reduce(
      (total, item) => total + (item.itemUnitPrice || 0) * (item.QTY || 1),
      0,
    );
    return parseFloat(sum.toFixed(2));
  },

  // Calculates the total monetary value of all discounts applied (rounded)
  getTotalDiscount: () => {
    const sum = get().selectedItems.reduce(
      (total, item) => total + (item.Discount || 0),
      0,
    );
    return parseFloat(sum.toFixed(2));
  },

  // Calculates the subtotal after discounts have been applied (rounded)
  getDiscountedSubtotal: () => {
    return parseFloat(
      (get().getSubtotal() - get().getTotalDiscount()).toFixed(2),
    );
  },

  // Calculates the final, grand total to be paid
  getTotal: () => get().getDiscountedSubtotal(),

  // Calculates the total number of individual items in the cart (respecting quantity)
  // Counts number of distinct item rows (not total quantity)
  getTotalItems: () => get().selectedItems.length,
}));

export default useBillingStore;
