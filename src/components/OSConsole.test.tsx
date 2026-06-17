import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OSConsole from "./OSConsole";
import { askDeltaConversation, type ConversationTurnResponse } from "@/lib/conversationApi";

jest.mock("@/lib/conversationApi", () => ({
  askDeltaConversation: jest.fn(),
}));

const mockAskDeltaConversation = askDeltaConversation as jest.MockedFunction<typeof askDeltaConversation>;

function conversationTurn(overrides: Partial<ConversationTurnResponse> = {}): ConversationTurnResponse {
  return {
    session_id: "session-1",
    user_id: "eric-demo-live-notification-test",
    input_mode: "typed",
    message: "what did you learn about late caffeine?",
    response:
      "Your latest late-caffeine feedback was good_call. Delta kept the tone concise with a 105-minute cooldown and a 1.0 success rate.",
    intent: "state_inquiry",
    read_only: true,
    memory_writes: false,
    notification: false,
    tts: false,
    side_effect_status: "none",
    state_source: "supabase",
    metadata: {
      input_mode: "typed",
      memory_writes: false,
      notification: false,
      tts_enabled: false,
    },
    context_summary: {
      state_source: "supabase",
    },
    ...overrides,
  };
}

function backendStatusResponse(): Response {
  return {
    ok: true,
    json: async () => ({
      runtime_status: {
        updated_at: "2026-06-16T12:00:00Z",
      },
      persisted_state_status: {
        status: "reachable",
      },
      late_caffeine_state: {
        last_outcome: "good_call",
        success_rate: 1,
        adaptation: {
          tone: "concise",
          cooldown_minutes: 105,
        },
        metrics: {
          interventions_delivered: 1,
        },
      },
    }),
  } as Response;
}

describe("OSConsole command center", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockAskDeltaConversation.mockReset();
    global.fetch = jest.fn(
      () => new Promise<Response>(() => undefined),
    ) as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders enabled typed input while voice and speech controls remain disabled", () => {
    render(<OSConsole />);

    expect(screen.getByLabelText("Ask Delta prompt")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ask Delta" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Voice input coming soon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Speak response pending validation" })).toBeDisabled();
    expect(screen.getAllByText("read-only API").length).toBeGreaterThan(0);
    expect(screen.getByText("no automatic memory writes")).toBeInTheDocument();
  });

  it("keeps previous messages when sending multiple questions", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation
      .mockResolvedValueOnce(conversationTurn())
      .mockResolvedValueOnce(
        conversationTurn({
          message: "what would you do if I drank a Monster at 10 PM?",
          response: "I would classify a Monster at 10 PM as late caffeine and likely recommend making it the last one.",
          intent: "hypothetical_policy",
        }),
      );

    render(<OSConsole />);

    const prompt = screen.getByLabelText("Ask Delta prompt");
    await user.clear(prompt);
    await user.type(prompt, "what did you learn about late caffeine?");
    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();

    await user.type(prompt, "what would you do if I drank a Monster at 10 PM?");
    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(await screen.findByText(/likely recommend making it the last one/)).toBeInTheDocument();
    expect(screen.getByText("what did you learn about late caffeine?")).toBeInTheDocument();
    expect(screen.getByText("what would you do if I drank a Monster at 10 PM?")).toBeInTheDocument();
    expect(mockAskDeltaConversation).toHaveBeenLastCalledWith({
      userId: "eric-demo-live-notification-test",
      message: "what would you do if I drank a Monster at 10 PM?",
      sessionId: "session-1",
    });
  });

  it("shows loading state while the backend request is pending", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockImplementation(() => new Promise<ConversationTurnResponse>(() => undefined));

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(screen.getByText("Reading Behavioral OS state...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Asking Delta" })).toBeDisabled();
  });

  it("appends backend errors as local system messages", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockRejectedValue(new Error("Conversation backend unavailable"));

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(
      await screen.findByText("Backend conversation unavailable: Conversation backend unavailable"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/105-minute cooldown/)).not.toBeInTheDocument();
  });

  it("clears only the local browser session", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear session" }));

    expect(screen.queryByText(/105-minute cooldown/)).not.toBeInTheDocument();
    expect(screen.getByText(/Ask a typed, read-only question/)).toBeInTheDocument();
  });

  it("lets suggested prompts populate the input", async () => {
    const user = userEvent.setup();

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Can you talk like Jarvis yet?" }));

    expect(screen.getByLabelText("Ask Delta prompt")).toHaveValue("Can you talk like Jarvis yet?");
  });

  it("shows assistant metadata chips for read-only responses", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(await screen.findByText("intent: state_inquiry")).toBeInTheDocument();
    expect(screen.getByText("state: supabase")).toBeInTheDocument();
    expect(screen.getByText("no writes: true")).toBeInTheDocument();
    expect(screen.getByText("no TTS: true")).toBeInTheDocument();
    expect(screen.getByText("no notification: true")).toBeInTheDocument();
  });

  it("refreshes OS state from the read-only status endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue(backendStatusResponse()) as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;

    render(<OSConsole />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    await user.click(await screen.findByRole("button", { name: "Refresh OS State" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText("Source: Supabase persisted state. Simulated: no.")).toBeInTheDocument();
  });

  it("keeps fallback status labeling honest when status fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("backend offline")) as jest.MockedFunction<typeof fetch>;

    render(<OSConsole />);

    expect(
      await screen.findByText("Showing labeled fallback fixture because the backend is unavailable.", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it("renders command cards for local validation", () => {
    render(<OSConsole />);

    expect(screen.getByText("Start backend")).toBeInTheDocument();
    expect(screen.getByText("Start site")).toBeInTheDocument();
    expect(screen.getByText("Validate typed conversation API")).toBeInTheDocument();
    expect(screen.getByText("Pending live + TTS validation")).toBeInTheDocument();
    expect(screen.getByText(/uvicorn api_server:app/)).toBeInTheDocument();
    expect(screen.getByText(/conversation\/turn/)).toBeInTheDocument();
    expect(screen.getAllByText(/ENABLE_LOCAL_TTS=true/).length).toBeGreaterThan(0);
  });
});
