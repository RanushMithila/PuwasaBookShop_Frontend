import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock CashRegisterService
const mockGetMachineId = vi.fn();
const mockCheckRegisterClosed = vi.fn();
vi.mock("../../src/services/CashRegisterService", () => ({
  getMachineId: (...args) => mockGetMachineId(...args),
  checkRegisterClosed: (...args) => mockCheckRegisterClosed(...args),
  getRegisterByDeviceId: vi.fn(),
  createRegister: vi.fn(),
  getAllLocations: vi.fn(),
  listCashRegisters: vi.fn(),
  checkRegisterOpen: vi.fn(),
}));

// Mock LoginForm to isolate LoginPage logic
vi.mock("../../src/components/LoginForm", () => ({
  default: () => <div data-testid="login-form">LoginForm</div>,
}));

// Mock the image import
vi.mock("../../src/assets/login_illustration.png", () => ({
  default: "test-illustration.png",
}));

import LoginPage from "../../src/pages/LoginPage";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("should show loading spinner initially", () => {
    // getMachineId never resolves — keeps in loading state
    mockGetMachineId.mockReturnValue(new Promise(() => {}));

    render(<LoginPage />);

    // Loading spinner is a div with animate-spin class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  });

  it("should show LoginForm when register is not closed", async () => {
    mockGetMachineId.mockResolvedValue("DEV-1");
    mockCheckRegisterClosed.mockResolvedValue({
      status: true,
      data: { isClosed: false },
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });

  it("should show blocked message when register is closed", async () => {
    mockGetMachineId.mockResolvedValue("DEV-1");
    mockCheckRegisterClosed.mockResolvedValue({
      status: true,
      data: { isClosed: true },
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText("POS Endpoint Closed")).toBeInTheDocument();
    });

    expect(screen.getByText(/Access Denied/)).toBeInTheDocument();
    expect(screen.getByText("Retry Connection")).toBeInTheDocument();
  });

  it("should show LoginForm when getMachineId fails (web fallback)", async () => {
    mockGetMachineId.mockRejectedValue(new Error("Not Electron"));

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });

  it("should show LoginForm when checkRegisterClosed fails", async () => {
    mockGetMachineId.mockResolvedValue("DEV-1");
    mockCheckRegisterClosed.mockRejectedValue(new Error("API down"));

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });
});
