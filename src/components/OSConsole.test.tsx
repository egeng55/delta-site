import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OSConsole from "./OSConsole";
import { askDeltaConversation, type ConversationTurnResponse } from "@/lib/conversationApi";

jest.mock("@/lib/conversationApi", () => ({
  askDeltaConversation: jest.fn(),
}));

const mockAskDeltaConversation = askDeltaConversation as jest.MockedFunction<typeof askDeltaConversation>;

const successfulTurn: ConversationTurnResponse = {
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
};

describe("OSConsole conversation panel", () => {
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

  it("calls the conversation backend and renders a successful response", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockResolvedValue(successfulTurn);

    render(<OSConsole />);

    const prompt = screen.getByLabelText("Ask Delta prompt");
    await user.clear(prompt);
    await user.type(prompt, "what did you learn about late caffeine?");
    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    await waitFor(() => {
      expect(mockAskDeltaConversation).toHaveBeenCalledWith({
        userId: "eric-demo-live-notification-test",
        message: "what did you learn about late caffeine?",
      });
    });

    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();
    expect(screen.getByText("state source: supabase")).toBeInTheDocument();
    expect(screen.getByText("memory writes: false")).toBeInTheDocument();
    expect(screen.getByText("TTS: false")).toBeInTheDocument();
    expect(screen.getByText("notification: false")).toBeInTheDocument();
  });

  it("shows a loading state while the backend request is pending", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockImplementation(() => new Promise<ConversationTurnResponse>(() => undefined));

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(screen.getByText("Reading Behavioral OS state...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Asking Delta" })).toBeDisabled();
  });

  it("shows backend errors without faking a successful conversation", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockRejectedValue(new Error("Conversation backend unavailable"));

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(
      await screen.findByText("Backend conversation unavailable: Conversation backend unavailable"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/105-minute cooldown/)).not.toBeInTheDocument();
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
});
