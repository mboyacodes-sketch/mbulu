import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/chat/empty-state";
import { ThinkingIndicator } from "@/components/thinking-indicator";

describe("EmptyState", () => {
  it("renders brand copy and suggestion actions", async () => {
    const user = userEvent.setup();
    const onSuggest = jest.fn();

    render(<EmptyState onSuggest={onSuggest} />);

    expect(screen.getByRole("heading", { name: "Mbulu" })).toBeInTheDocument();
    expect(
      screen.getByText(/Ask anything\. Keep it simple/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Help me plan my day" }));
    expect(onSuggest).toHaveBeenCalledWith("Help me plan my day");
  });
});

describe("ThinkingIndicator", () => {
  it("exposes a polite typing status", () => {
    render(<ThinkingIndicator />);

    expect(screen.getByRole("status", { name: "Mbulu is typing" })).toBeInTheDocument();
  });
});
