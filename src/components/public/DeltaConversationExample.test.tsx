import { fireEvent, render, screen } from "@testing-library/react";
import DeltaConversationExample from "./DeltaConversationExample";

describe("public conversation examples", () => {
  it("identifies its content as illustrative and reveals the basis of an answer", () => {
    render(<DeltaConversationExample />);
    expect(screen.getByText("Illustrative content. No live session or account data.")).toBeInTheDocument();
    const context = screen.getByRole("button", { name: "Context behind this answer" });
    expect(context).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(context);
    expect(screen.getByText("No connected calendar is used in this example.")).toBeVisible();
    expect(context).toHaveAttribute("aria-expanded", "true");
  });

  it("supports keyboard selection and resets context when switching examples", () => {
    render(<DeltaConversationExample />);
    fireEvent.click(screen.getByRole("button", { name: "Context behind this answer" }));
    fireEvent.keyDown(screen.getByRole("tab", { name: "Your day" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "A decision" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "A decision" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Context behind this answer" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("A decision");
    fireEvent.keyDown(screen.getByRole("tab", { name: "A decision" }), { key: "End" });
    expect(screen.getByRole("tab", { name: "A project" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("tab", { name: "A project" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "Your day" })).toHaveFocus();
  });

  it("keeps project completion and approval separate without starting a request", () => {
    const fetchMock = jest.fn();
    const original = global.fetch;
    global.fetch = fetchMock;
    try {
      render(<DeltaConversationExample />);
      fireEvent.click(screen.getByRole("tab", { name: "A project" }));
      fireEvent.click(screen.getByRole("button", { name: "Context behind this answer" }));
      expect(screen.getByText("Publishing has not been authorized.")).toBeVisible();
      expect(screen.getByText("No release has been performed or verified.")).toBeVisible();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      global.fetch = original;
    }
  });
});
