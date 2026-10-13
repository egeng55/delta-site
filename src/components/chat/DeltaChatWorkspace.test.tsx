import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/context/AuthContext";
import DeltaChatWorkspace from "./DeltaChatWorkspace";

jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const originalFetch = global.fetch;

describe("Delta chat workspace", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "verified-user",
        email: "person@example.test",
        name: "Example Person",
        username: "example",
        role: "user",
      },
      session: { access_token: "private-session-token" },
      isLoading: false,
      logout: jest.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("opens with an account-bound empty state and no provider request", () => {
    global.fetch = jest.fn();
    render(<DeltaChatWorkspace />);

    expect(
      screen.getByRole("heading", { name: "What should we work through?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Authenticated account")).toBeInTheDocument();
    expect(screen.getByText(/separate approval required/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends only conversation content with the authenticated bearer token", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: "Start with the evidence that is current." }),
    });
    render(<DeltaChatWorkspace />);

    fireEvent.change(screen.getByLabelText("Message Delta"), {
      target: { value: "What matters now?" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Start with the evidence that is current.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(options.headers.Authorization).toBe("Bearer private-session-token");
    const body = JSON.parse(options.body);
    expect(body.message).toBe("What matters now?");
    expect(body).not.toHaveProperty("user_id");
  });

  it("does not retry or expose a private server failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("private backend detail"));
    render(<DeltaChatWorkspace />);

    fireEvent.change(screen.getByLabelText("Message Delta"), {
      target: { value: "Try once" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "not resubmitted automatically",
    );
    expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });
});
