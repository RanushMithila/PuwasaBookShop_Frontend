import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/billing" }),
}));

// Mock TenantStore
vi.mock("../../src/store/TenantStore", () => {
  const mockStore = vi.fn();
  mockStore.mockImplementation(() => ({
    logoUrl: null,
    fetchSettings: vi.fn().mockResolvedValue({}),
  }));
  return { default: mockStore };
});

import Sidebar from "../../src/components/Sidebar";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Sidebar", () => {
  it("should render all menu items", () => {
    render(<Sidebar />);

    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Refund")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("should render emoji icons for each menu item", () => {
    render(<Sidebar />);

    expect(screen.getByText("🧾")).toBeInTheDocument();
    expect(screen.getByText("↩️")).toBeInTheDocument();
    expect(screen.getByText("👤")).toBeInTheDocument();
  });

  it("should render version text", () => {
    render(<Sidebar />);

    expect(screen.getByText("v1.0")).toBeInTheDocument();
  });

  it("should render a logo image", () => {
    render(<Sidebar />);

    const logo = screen.getByAltText("Logo");
    expect(logo).toBeInTheDocument();
  });

  it("should navigate when a menu item is clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByText("Refund"));
    expect(mockNavigate).toHaveBeenCalledWith("/refund");

    await user.click(screen.getByText("Customer"));
    expect(mockNavigate).toHaveBeenCalledWith("/customer");
  });
});
