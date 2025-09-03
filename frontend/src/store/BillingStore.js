import { create } from 'zustand';

const useBillingStore = create((set, get) => ({
  // --- STATE ---
  selectedItems: [],
  customer: null, // Holds the selected customer object { id, name }
  paymentMethod: 'cash',
  currentBillId: null, // Stores the ID of a bill that is on hold or being processed

  // --- ACTIONS ---

  // Sets the customer for the current transaction
  setCustomer: (customerData) => set({ customer: customerData }),

  // Sets the ID for the current bill, useful for resuming a held bill
  setCurrentBillId: (id) => set({ currentBillId: id }),

  // Adds an item to the cart or increments its quantity if it already exists
  addItem: (item) => set((state) => {
    const existingIndex = state.selectedItems.findIndex(
      (existingItem) => existingItem.inventoryID === item.inventoryID
    );
    if (existingIndex !== -1) {
      const updatedItems = [...state.selectedItems];
      updatedItems[existingIndex].QTY += 1;
      return { selectedItems: updatedItems };
    } else {
      // Ensure new items have default QTY and Discount
      return { selectedItems: [...state.selectedItems, { ...item, QTY: 1, Discount: 0 }] };
    }
  }),

  // Removes an item from the cart entirely
  removeItem: (inventoryID) => set((state) => ({
    selectedItems: state.selectedItems.filter((item) => item.inventoryID !== inventoryID)
  })),

  // Updates the quantity of a specific item in the cart
  updateItemQuantity: (inventoryID, quantity) => set((state) => ({
    selectedItems: state.selectedItems.map((item) =>
      item.inventoryID === inventoryID ? { ...item, QTY: Math.max(1, quantity) } : item
    )
  })),

  // Updates the discount percentage of a specific item
  updateItemDiscount: (inventoryID, discount) => set((state) => ({
    selectedItems: state.selectedItems.map((item) =>
      item.inventoryID === inventoryID ? { ...item, Discount: Math.max(0, Math.min(100, discount)) } : item
    )
  })),

  // Resets the entire transaction state for a new sale
  resetTransaction: () => set({
    selectedItems: [],
    customer: null,
    paymentMethod: 'cash',
    currentBillId: null
  }),

  // --- COMPUTED GETTERS ---

  // Calculates the total price before any discounts or taxes
  getSubtotal: () => get().selectedItems.reduce((total, item) => total + (item.itemUnitPrice || 0) * (item.QTY || 1), 0),
  
  // Calculates the total monetary value of all discounts applied
  getTotalDiscount: () => get().selectedItems.reduce((total, item) => {
    const baseAmount = (item.itemUnitPrice || 0) * (item.QTY || 1);
    return total + (baseAmount * ((item.Discount || 0) / 100));
  }, 0),

  // Calculates the subtotal after discounts have been applied
  getDiscountedSubtotal: () => get().getSubtotal() - get().getTotalDiscount(),

  // Calculates the tax amount based on the discounted subtotal

  // Calculates the final, grand total to be paid
  getTotal: () => get().getDiscountedSubtotal(),

  // Calculates the total number of individual items in the cart (respecting quantity)
  getTotalItems: () => get().selectedItems.reduce((total, item) => total + (item.QTY || 1), 0),
}));

export default useBillingStore;