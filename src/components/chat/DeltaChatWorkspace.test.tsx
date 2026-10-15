import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("loads account history without a provider request", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ conversations: [] }) });
    render(<DeltaChatWorkspace />);

    expect(
      screen.getByRole("heading", { name: "What should we work through?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Authenticated account")).toBeInTheDocument();
    expect(screen.getByText(/separate approval required/i)).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith('/api/conversations', expect.any(Object));
  });

  it("sends only conversation content with the authenticated bearer token", async () => {
    global.fetch = jest.fn(async (url, options) => url === '/api/conversations' ? ({ ok: true, json: async () => options?.method === 'POST' ? JSON.parse(options.body as string) : { conversations: [] } }) : ({
      ok: true,
      json: async () => ({ response: "Start with the evidence that is current." }),
    })) as jest.Mock;
    render(<DeltaChatWorkspace />);

    fireEvent.change(screen.getByLabelText("Message Delta"), {
      target: { value: "What matters now?" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Start with the evidence that is current.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(3);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[2];
    expect(url).toBe("/api/chat");
    expect(options.headers.Authorization).toBe("Bearer private-session-token");
    const body = JSON.parse(options.body);
    expect(body.message).toBe("What matters now?");
    expect(body).not.toHaveProperty("user_id");
    expect(body.conversation_id).toMatch(/^[a-f0-9-]{36}$/);
    expect(body.request_id).toMatch(/^[a-f0-9-]{36}$/);
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
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect((global.fetch as jest.Mock).mock.calls.some(([url]) => url === '/api/chat')).toBe(false);
  });

  it('clears old-account messages and ignores late responses after account switch', async () => {
    let finish!: (value: unknown) => void;
    global.fetch = jest.fn(async (url, options) => {
      if (url === '/api/chat') return new Promise(resolve => { finish = resolve; });
      return { ok: true, json: async () => options?.method === 'POST' ? JSON.parse(options.body as string) : { conversations: [] } };
    }) as jest.Mock;
    const view = render(<DeltaChatWorkspace />);
    fireEvent.change(screen.getByLabelText('Message Delta'), { target: { value: 'Account A private question' } });
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(finish).toBeDefined());
    mockUseAuth.mockReturnValue({ ...mockUseAuth(), user: { ...mockUseAuth().user!, id: 'account-b' }, session: { access_token: 'account-b-token' } } as ReturnType<typeof useAuth>);
    view.rerender(<DeltaChatWorkspace />);
    expect(screen.queryByText('Account A private question')).not.toBeInTheDocument();
    await act(async () => finish({ ok: true, json: async () => ({ response: 'Account A secret answer' }) }));
    expect(screen.queryByText('Account A secret answer')).not.toBeInTheDocument();
  });

  it('restores a saved thread without inference', async () => {
    global.fetch = jest.fn(async url => ({ ok: true, json: async () => String(url).endsWith('/messages') ? { messages: [{ id: 'saved', role: 'assistant', text: 'Saved answer' }] } : { conversations: [{ id: '11111111-1111-4111-8111-111111111111', title: 'Saved thread' }] } })) as jest.Mock;
    render(<DeltaChatWorkspace />);
    await userEvent.click(await screen.findByRole('button', { name: 'Saved thread' }));
    expect(await screen.findByText('Saved answer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saved thread' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Reload saved conversation' })).toBeInTheDocument();
    expect((global.fetch as jest.Mock).mock.calls.some(([url]) => url === '/api/chat')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    expect(screen.getByRole('button', { name: 'Saved thread' })).not.toHaveAttribute('aria-current');
    expect(screen.queryByRole('button', { name: 'Reload saved conversation' })).not.toBeInTheDocument();
  });
});
