import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock CustomerService
const mockRegisterCustomer = vi.fn();
vi.mock("../../src/services/CustomerService", () => ({
  registerCustomer: (...args) => mockRegisterCustomer(...args),
}));

// Mock AlertModal to make assertions simpler
vi.mock("../../src/components/AlertModal", () => ({
  default: ({ isOpen, title, message, type, onClose }) =>
    isOpen ? (
      <div data-testid="alert-modal">
        <span data-testid="alert-title">{title}</span>
        <span data-testid="alert-message">{message}</span>
        <span data-testid="alert-type">{type}</span>
        <button data-testid="alert-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

import CustomerPage from "../../src/pages/CustomerPage";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CustomerPage", () => {
  it("should render the page heading", () => {
    render(<CustomerPage />);
    expect(screen.getByText("Customer Registration")).toBeInTheDocument();
  });

  it("should render all required input fields", () => {
    render(<CustomerPage />);

    expect(screen.getByPlaceholderText("Enter first name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter last name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter phone number")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
  });

  it("should render address fields", () => {
    render(<CustomerPage />);

    expect(screen.getByPlaceholderText("Street address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter city")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter country")).toBeInTheDocument();
  });

  it("should show validation error when firstname is empty", async () => {
    const user = userEvent.setup();
    render(<CustomerPage />);

    await user.click(screen.getByText("Register Customer"));

    await waitFor(() => {
      expect(screen.getByTestId("alert-modal")).toBeInTheDocument();
    });
    expect(screen.getByTestId("alert-title")).toHaveTextContent("Missing Information");
    expect(screen.getByTestId("alert-message")).toHaveTextContent(
      "First name and last name are required."
    );
  });

  it("should show validation error when phone is empty", async () => {
    const user = userEvent.setup();
    render(<CustomerPage />);

    await user.type(screen.getByPlaceholderText("Enter first name"), "John");
    await user.type(screen.getByPlaceholderText("Enter last name"), "Doe");
    await user.click(screen.getByText("Register Customer"));

    await waitFor(() => {
      expect(screen.getByTestId("alert-message")).toHaveTextContent(
        "Phone number is required."
      );
    });
  });

  it("should show validation error when email is empty", async () => {
    const user = userEvent.setup();
    render(<CustomerPage />);

    await user.type(screen.getByPlaceholderText("Enter first name"), "John");
    await user.type(screen.getByPlaceholderText("Enter last name"), "Doe");
    await user.type(screen.getByPlaceholderText("Enter phone number"), "0771234567");
    await user.click(screen.getByText("Register Customer"));

    await waitFor(() => {
      expect(screen.getByTestId("alert-message")).toHaveTextContent(
        "Email is required."
      );
    });
  });

  it("should auto-generate password from firstname on blur", async () => {
    const user = userEvent.setup();
    render(<CustomerPage />);

    const firstnameInput = screen.getByPlaceholderText("Enter first name");
    await user.type(firstnameInput, "John");
    // Trigger blur by tabbing away
    await user.tab();

    const passwordInput = screen.getByPlaceholderText("Enter password");
    // Password should contain "John" + today's date in YYYYMMDD format
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    expect(passwordInput).toHaveValue(`John${yyyy}${mm}${dd}`);
  });

  it("should clear form when Clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<CustomerPage />);

    await user.type(screen.getByPlaceholderText("Enter first name"), "John");
    await user.type(screen.getByPlaceholderText("Enter last name"), "Doe");

    await user.click(screen.getByText("Clear"));

    expect(screen.getByPlaceholderText("Enter first name")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter last name")).toHaveValue("");
  });

  it("should call registerCustomer and show success on valid submission", async () => {
    const user = userEvent.setup();
    mockRegisterCustomer.mockResolvedValue({
      status: true,
      message: "Customer created!",
    });

    render(<CustomerPage />);

    await user.type(screen.getByPlaceholderText("Enter first name"), "Jane");
    await user.tab(); // triggers password generation
    await user.type(screen.getByPlaceholderText("Enter last name"), "Smith");
    await user.type(screen.getByPlaceholderText("Enter phone number"), "0771111111");
    await user.type(screen.getByPlaceholderText("Enter email address"), "j@s.com");

    await user.click(screen.getByText("Register Customer"));

    await waitFor(() => {
      expect(mockRegisterCustomer).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId("alert-title")).toHaveTextContent("Success");
    });
  });

  it("should show error when API returns failure", async () => {
    const user = userEvent.setup();
    mockRegisterCustomer.mockResolvedValue({
      status: false,
      error_message: "Duplicate phone",
    });

    render(<CustomerPage />);

    await user.type(screen.getByPlaceholderText("Enter first name"), "Jane");
    await user.tab();
    await user.type(screen.getByPlaceholderText("Enter last name"), "Smith");
    await user.type(screen.getByPlaceholderText("Enter phone number"), "0771111111");
    await user.type(screen.getByPlaceholderText("Enter email address"), "j@s.com");

    await user.click(screen.getByText("Register Customer"));

    await waitFor(() => {
      expect(screen.getByTestId("alert-title")).toHaveTextContent("Registration Failed");
      expect(screen.getByTestId("alert-message")).toHaveTextContent("Duplicate phone");
    });
  });
});
