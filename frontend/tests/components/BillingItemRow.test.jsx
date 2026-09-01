import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the BillingStore used inside BillingItemRow
vi.mock("../../src/store/BillingStore", () => {
  const mockStore = vi.fn();
  // BillingItemRow calls useBillingStore(selector) twice — for updateItemQuantity and updateItemDiscount
  const updateItemQuantity = vi.fn();
  const updateItemDiscount = vi.fn();
  mockStore.mockImplementation((selector) => {
    const state = { updateItemQuantity, updateItemDiscount };
    return selector(state);
  });
  mockStore.__mocks = { updateItemQuantity, updateItemDiscount };
  return { default: mockStore };
});

import BillingItemRow from "../../src/components/BillingItemRow";
import useBillingStore from "../../src/store/BillingStore";

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleItem = {
  inventoryID: "INV-1",
  barcode: "BC-001",
  itemName: "Notebook A5",
  itemDescription: "80 pages ruled",
  itemUnitPrice: 250,
  QTY: 2,
  Discount: 0,
};

describe("BillingItemRow", () => {
  it("should render item barcode, name, description, and unit price", () => {
    render(<BillingItemRow item={sampleItem} />);

    expect(screen.getByText("BC-001")).toBeInTheDocument();
    expect(screen.getByText("Notebook A5")).toBeInTheDocument();
    expect(screen.getByText("80 pages ruled")).toBeInTheDocument();
    expect(screen.getByText("Rs: 250.00")).toBeInTheDocument();
  });

  it("should render quantity input with correct initial value", () => {
    render(<BillingItemRow item={sampleItem} />);

    const qtyInput = screen.getByDisplayValue("2");
    expect(qtyInput).toBeInTheDocument();
    expect(qtyInput).toHaveAttribute("type", "number");
  });

  it("should render computed amount (price × quantity)", () => {
    // 250 × 2 = 500
    render(<BillingItemRow item={sampleItem} />);

    expect(screen.getByText("Rs: 500.00")).toBeInTheDocument();
  });

  it("should update quantity and call store when quantity input changes", async () => {
    render(<BillingItemRow item={sampleItem} />);

    const qtyInput = screen.getByDisplayValue("2");
    fireEvent.change(qtyInput, { target: { value: "5" } });

    expect(useBillingStore.__mocks.updateItemQuantity).toHaveBeenCalledWith("INV-1", 5);
  });

  it("should call onDoubleClick when row is double-clicked", async () => {
    const user = userEvent.setup();
    const onDoubleClick = vi.fn();

    render(<BillingItemRow item={sampleItem} onDoubleClick={onDoubleClick} />);

    const row = screen.getByText("Notebook A5").closest("div[title]");
    if (row) {
      await user.dblClick(row);
      expect(onDoubleClick).toHaveBeenCalledWith("INV-1");
    }
  });

  it("should show inventoryID as fallback when barcode is missing", () => {
    const itemNoBc = { ...sampleItem, barcode: "" };
    render(<BillingItemRow item={itemNoBc} />);

    expect(screen.getByText("INV-1")).toBeInTheDocument();
  });
});
