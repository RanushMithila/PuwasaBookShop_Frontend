import { describe, it, expect, beforeEach } from "vitest";
import useBillingStore from "../../src/store/BillingStore";

// Reset store before each test
beforeEach(() => {
  useBillingStore.setState({
    selectedItems: [],
    customer: null,
    paymentMethod: "cash",
    currentBillId: null,
  });
});

describe("BillingStore", () => {
  describe("addItem", () => {
    it("should add a new item with QTY 1 and Discount 0", () => {
      useBillingStore.getState().addItem({
        inventoryID: "A1",
        itemName: "Notebook",
        itemUnitPrice: 100,
      });

      const items = useBillingStore.getState().selectedItems;
      expect(items).toHaveLength(1);
      expect(items[0].inventoryID).toBe("A1");
      expect(items[0].QTY).toBe(1);
      expect(items[0].Discount).toBe(0);
    });

    it("should increment QTY when adding an existing item", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "Notebook", itemUnitPrice: 100 });
      store.addItem({ inventoryID: "A1", itemName: "Notebook", itemUnitPrice: 100 });

      const items = useBillingStore.getState().selectedItems;
      expect(items).toHaveLength(1);
      expect(items[0].QTY).toBe(2);
    });

    it("should preserve provided QTY and Discount from loaded bill", () => {
      useBillingStore.getState().addItem({
        inventoryID: "B1",
        itemName: "Pen",
        itemUnitPrice: 50,
        QTY: 5,
        Discount: 10,
      });

      const items = useBillingStore.getState().selectedItems;
      expect(items[0].QTY).toBe(5);
      expect(items[0].Discount).toBe(10);
    });

    it("should match inventoryID as string comparison", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: 42, itemName: "Book", itemUnitPrice: 200 });
      store.addItem({ inventoryID: "42", itemName: "Book", itemUnitPrice: 200 });

      // Same item because String(42) === String("42")
      const items = useBillingStore.getState().selectedItems;
      expect(items).toHaveLength(1);
      expect(items[0].QTY).toBe(2);
    });
  });

  describe("removeItem", () => {
    it("should remove item by inventoryID", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "Notebook", itemUnitPrice: 100 });
      store.addItem({ inventoryID: "A2", itemName: "Pen", itemUnitPrice: 50 });

      useBillingStore.getState().removeItem("A1");

      const items = useBillingStore.getState().selectedItems;
      expect(items).toHaveLength(1);
      expect(items[0].inventoryID).toBe("A2");
    });

    it("should do nothing when inventoryID does not exist", () => {
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 10 });

      useBillingStore.getState().removeItem("NONEXISTENT");

      expect(useBillingStore.getState().selectedItems).toHaveLength(1);
    });
  });

  describe("updateItemQuantity", () => {
    it("should update quantity for matching inventoryID", () => {
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 10 });

      useBillingStore.getState().updateItemQuantity("A1", 5);

      expect(useBillingStore.getState().selectedItems[0].QTY).toBe(5);
    });

    it("should clamp quantity to minimum 1", () => {
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 10 });

      useBillingStore.getState().updateItemQuantity("A1", 0);

      expect(useBillingStore.getState().selectedItems[0].QTY).toBe(1);
    });
  });

  describe("updateItemPrice", () => {
    it("should update itemUnitPrice", () => {
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });

      useBillingStore.getState().updateItemPrice("A1", 75);

      expect(useBillingStore.getState().selectedItems[0].itemUnitPrice).toBe(75);
    });
  });

  describe("updateItemDiscount", () => {
    it("should cap discount at line total", () => {
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });
      useBillingStore.getState().updateItemQuantity("A1", 2);

      // Line total = 100 * 2 = 200, requesting 300 should cap at 200
      useBillingStore.getState().updateItemDiscount("A1", 300);

      expect(useBillingStore.getState().selectedItems[0].Discount).toBe(200);
    });

    it("should clamp negative discount to 0", () => {
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });

      useBillingStore.getState().updateItemDiscount("A1", -50);

      expect(useBillingStore.getState().selectedItems[0].Discount).toBe(0);
    });

    it("should accept valid discount within range", () => {
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });

      useBillingStore.getState().updateItemDiscount("A1", 30);

      expect(useBillingStore.getState().selectedItems[0].Discount).toBe(30);
    });
  });

  describe("resetTransaction", () => {
    it("should reset all state to initial values", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });
      store.setCustomer({ id: "c1" });
      store.setCurrentBillId(42);

      useBillingStore.getState().resetTransaction();

      const state = useBillingStore.getState();
      expect(state.selectedItems).toEqual([]);
      expect(state.customer).toBeNull();
      expect(state.paymentMethod).toBe("cash");
      expect(state.currentBillId).toBeNull();
    });
  });

  describe("computed getters", () => {
    it("should compute subtotal correctly", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });
      store.addItem({ inventoryID: "A2", itemName: "Y", itemUnitPrice: 200 });
      store.updateItemQuantity("A1", 3);

      // Subtotal = (100 * 3) + (200 * 1) = 500
      expect(useBillingStore.getState().getSubtotal()).toBe(500);
    });

    it("should compute total discount correctly", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100, Discount: 10 });
      store.addItem({ inventoryID: "A2", itemName: "Y", itemUnitPrice: 200, Discount: 20 });

      expect(useBillingStore.getState().getTotalDiscount()).toBe(30);
    });

    it("should compute discounted subtotal as subtotal minus discount", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });
      store.updateItemDiscount("A1", 10);

      // Subtotal = 100, discount = 10, discountedSubtotal = 90
      expect(useBillingStore.getState().getDiscountedSubtotal()).toBe(90);
    });

    it("should compute total same as discounted subtotal", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 150 });

      expect(useBillingStore.getState().getTotal()).toBe(150);
    });

    it("should count distinct item rows for getTotalItems", () => {
      const store = useBillingStore.getState();
      store.addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });
      store.addItem({ inventoryID: "A2", itemName: "Y", itemUnitPrice: 200 });
      // Adding A1 again increments QTY, not row count
      store.addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });

      expect(useBillingStore.getState().getTotalItems()).toBe(2);
    });
  });

  describe("setItems / clearItems", () => {
    it("should replace selectedItems exactly", () => {
      const items = [
        { inventoryID: "A1", itemName: "X", itemUnitPrice: 100, QTY: 3, Discount: 0 },
      ];
      useBillingStore.getState().setItems(items);

      expect(useBillingStore.getState().selectedItems).toEqual(items);
    });

    it("should clear only items, preserving currentBillId", () => {
      useBillingStore.getState().setCurrentBillId(99);
      useBillingStore.getState().addItem({ inventoryID: "A1", itemName: "X", itemUnitPrice: 100 });

      useBillingStore.getState().clearItems();

      expect(useBillingStore.getState().selectedItems).toEqual([]);
      expect(useBillingStore.getState().currentBillId).toBe(99);
    });
  });
});
