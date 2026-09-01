import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "../../src/components/Toast";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("should render the message text", () => {
    render(<Toast message="Saved!" onClose={() => {}} />);
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("should render success icon for success type", () => {
    render(<Toast message="OK" type="success" onClose={() => {}} />);
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("should render error icon for error type", () => {
    render(<Toast message="Fail" type="error" onClose={() => {}} />);
    expect(screen.getByText("❌")).toBeInTheDocument();
  });

  it("should auto-dismiss after duration", () => {
    const onClose = vi.fn();
    render(<Toast message="Auto" onClose={onClose} duration={2000} />);

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should use default 3000ms duration", () => {
    const onClose = vi.fn();
    render(<Toast message="Default" onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when close button is clicked", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Toast message="Click me" onClose={onClose} />);

    await user.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
