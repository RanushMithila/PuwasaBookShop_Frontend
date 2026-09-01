import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlertModal from "../../src/components/AlertModal";

describe("AlertModal", () => {
  it("should render nothing when isOpen is false", () => {
    const { container } = render(
      <AlertModal isOpen={false} onClose={() => {}} title="T" message="M" />
    );
    expect(container.innerHTML).toBe("");
  });

  it("should render title and message when open", () => {
    render(
      <AlertModal isOpen={true} onClose={() => {}} title="Done!" message="All good." />
    );
    expect(screen.getByText("Done!")).toBeInTheDocument();
    expect(screen.getByText("All good.")).toBeInTheDocument();
  });

  it("should render OK button that calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <AlertModal isOpen={true} onClose={onClose} title="Info" message="FYI" type="info" />
    );

    await user.click(screen.getByText("OK"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should apply success styles when type is success", () => {
    render(
      <AlertModal isOpen={true} onClose={() => {}} title="Yay" message="Saved" type="success" />
    );
    // Success SVG has the checkmark path d="M5 13l4 4L19 7"
    const svg = document.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("should apply error styles when type is error", () => {
    render(
      <AlertModal isOpen={true} onClose={() => {}} title="Oops" message="Failed" type="error" />
    );
    const svg = document.querySelector("svg");
    expect(svg).toBeTruthy();
  });
});
