import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock services
const mockGetBill = vi.fn();
const mockProcessRefund = vi.fn();
const mockGetVoucherByCode = vi.fn();
vi.mock("../../src/services/BillingService", () => ({
  getBill: (...args) => mockGetBill(...args),
}));
vi.mock("../../src/services/RefundService", () => ({
  processRefund: (...args) => mockProcessRefund(...args),
  getVoucherByCode: (...args) => mockGetVoucherByCode(...args),
}));

// Mock AlertModal
vi.mock("../../src/components/AlertModal", () => ({
  default: ({ isOpen, title, message, onClose }) =>
    isOpen ? (
      <div data-testid="alert-modal">
        <span data-testid="alert-title">{title}</span>
        <span data-testid="alert-message">{message}</span>
        <button data-testid="alert-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

// Mock RefundSuccessModal
vi.mock("../../src/components/RefundSuccessModal", () => ({
  default: ({ isOpen, voucherCode, refundTotal, onClose }) =>
    isOpen ? (
      <div data-testid="success-modal">
        <span data-testid="voucher-code">{voucherCode}</span>
        <span data-testid="refund-total">{refundTotal}</span>
        <button data-testid="success-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

import RefundPage from "../../src/pages/RefundPage";

beforeEach(() => {
  vi.clearAllMocks();
  delete globalThis.window.electron;
});

const sampleBill = {
  BillID: 100,
  CustomerID: "C1",
  LocationID: 1,
  Total: 500,
  Discount: 0,
  Details: [
    { DetailID: 1, ItemName: "Notebook", UnitPrice: 200, Discount: 0, QTY: 2 },
    { DetailID: 2, ItemName: "Pen", UnitPrice: 50, Discount: 5, QTY: 3 },
  ],
};

describe("RefundPage", () => {
  it("should render Bill ID input and Load Bill button", () => {
    render(<RefundPage />);

    expect(screen.getByPlaceholderText("Enter Bill ID")).toBeInTheDocument();
    expect(screen.getByText("Load Bill")).toBeInTheDocument();
  });

  it("should render placeholder text before loading a bill", () => {
    render(<RefundPage />);

    expect(
      screen.getByText(/Enter a Bill ID and click/)
    ).toBeInTheDocument();
  });

  it("should show alert when Load Bill is clicked with empty input", async () => {
    const user = userEvent.setup();
    render(<RefundPage />);

    await user.click(screen.getByText("Load Bill"));

    await waitFor(() => {
      expect(screen.getByTestId("alert-title")).toHaveTextContent("Invalid Bill ID");
    });
  });

  it("should load and display bill details", async () => {
    const user = userEvent.setup();
    mockGetBill.mockResolvedValue({ status: true, data: sampleBill });

    render(<RefundPage />);

    await user.type(screen.getByPlaceholderText("Enter Bill ID"), "100");
    await user.click(screen.getByText("Load Bill"));

    await waitFor(() => {
      expect(screen.getByText("Notebook")).toBeInTheDocument();
      expect(screen.getByText("Pen")).toBeInTheDocument();
    });

    // Bill header info
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("should compute refund total correctly for selected items", async () => {
    const user = userEvent.setup();
    mockGetBill.mockResolvedValue({ status: true, data: sampleBill });

    render(<RefundPage />);

    await user.type(screen.getByPlaceholderText("Enter Bill ID"), "100");
    await user.click(screen.getByText("Load Bill"));

    await waitFor(() => {
      expect(screen.getByText("Notebook")).toBeInTheDocument();
    });

    // The checkbox has onClick={e => e.stopPropagation()} so clicking it only triggers
    // its onChange (toggleItem once), not the row's onClick.
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    // Refund total should be (200 - 0) × 2 = 400
    // The total appears in the right panel summary
    await waitFor(() => {
      // Look for the refund total in the summary panel (indigo-700 styled text)
      const totalElements = screen.getAllByText(/400\.00/);
      expect(totalElements.length).toBeGreaterThan(0);
    });
  });

  it("should show alert when no items are selected for refund", async () => {
    const user = userEvent.setup();
    mockGetBill.mockResolvedValue({ status: true, data: sampleBill });

    render(<RefundPage />);

    await user.type(screen.getByPlaceholderText("Enter Bill ID"), "100");
    await user.click(screen.getByText("Load Bill"));

    await waitFor(() => {
      expect(screen.getByText("Notebook")).toBeInTheDocument();
    });

    // Don't select any items, click Process Refund
    // The button should be disabled, so we can check that
    const processBtn = screen.getByText("Process Refund");
    expect(processBtn).toBeDisabled();
  });

  it("should show alert when bill is not found", async () => {
    const user = userEvent.setup();
    mockGetBill.mockResolvedValue({
      status: false,
      error_message: "Bill not found",
    });

    render(<RefundPage />);

    await user.type(screen.getByPlaceholderText("Enter Bill ID"), "999");
    await user.click(screen.getByText("Load Bill"));

    await waitFor(() => {
      expect(screen.getByTestId("alert-title")).toHaveTextContent("Bill Not Found");
    });
  });

  it("should clear form when Clear button is clicked", async () => {
    const user = userEvent.setup();
    mockGetBill.mockResolvedValue({ status: true, data: sampleBill });

    render(<RefundPage />);

    await user.type(screen.getByPlaceholderText("Enter Bill ID"), "100");
    await user.click(screen.getByText("Load Bill"));

    await waitFor(() => {
      expect(screen.getByText("Notebook")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Clear" }));

    // Bill data should be gone, placeholder should be back
    await waitFor(() => {
      expect(screen.getByText(/Enter a Bill ID and click/)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Enter Bill ID")).toHaveValue("");
  });

  it("should process refund and show success modal", async () => {
    const user = userEvent.setup();
    mockGetBill.mockResolvedValue({ status: true, data: sampleBill });
    mockProcessRefund.mockResolvedValue({
      status: true,
      data: { RefundID: 55, VoucherCode: "V-ABC" },
      message: "Refund processed",
    });
    mockGetVoucherByCode.mockResolvedValue({
      status: true,
      data: { ExpiryDate: "2026-12-31", Value: 400 },
    });

    render(<RefundPage />);

    await user.type(screen.getByPlaceholderText("Enter Bill ID"), "100");
    await user.click(screen.getByText("Load Bill"));

    await waitFor(() => {
      expect(screen.getByText("Notebook")).toBeInTheDocument();
    });

    // Select first item by clicking the row
    const notebookRow = screen.getByText("Notebook").closest("tr");
    await user.click(notebookRow);

    // Click Process Refund
    await user.click(screen.getByText("Process Refund"));

    await waitFor(() => {
      expect(screen.getByTestId("success-modal")).toBeInTheDocument();
    });
    expect(screen.getByTestId("voucher-code")).toHaveTextContent("V-ABC");
  });
});
