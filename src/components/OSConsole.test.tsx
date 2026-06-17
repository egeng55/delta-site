import React from "react";
import { renderToString } from "react-dom/server";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OSConsole from "./OSConsole";
import type { BrowserSpeechControls } from "@/lib/browserSpeech";
import { askDeltaConversation, type ConversationTurnResponse } from "@/lib/conversationApi";
import { getSystemReadiness, type SystemReadinessResponse } from "@/lib/systemReadinessApi";

jest.mock("@/lib/conversationApi", () => ({
  askDeltaConversation: jest.fn(),
}));

jest.mock("@/lib/systemReadinessApi", () => ({
  getSystemReadiness: jest.fn(),
}));

const mockAskDeltaConversation = askDeltaConversation as jest.MockedFunction<typeof askDeltaConversation>;
const mockGetSystemReadiness = getSystemReadiness as jest.MockedFunction<typeof getSystemReadiness>;

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

function readinessResponse(overrides: Partial<SystemReadinessResponse> = {}): SystemReadinessResponse {
  return {
    backend: {
      reachable: true,
      status: "ok",
      service: "delta-backend",
    },
    supabase: {
      configured: true,
      reachable: true,
      status: "reachable",
      schema_status: "behavioral_os_ready",
      tables: {
        behavioral_loop_state: { readable: true, status: "readable" },
      },
    },
    conversation: {
      api_available: true,
      read_only: true,
      input_mode: "typed",
      tts: false,
      notification: false,
      live_mic: false,
      memory_writes: false,
    },
    proof_user: {
      user_id: "eric-demo-live-notification-test",
      state_readable: true,
      state_source: "supabase",
      last_outcome: "good_call",
      cooldown_minutes: 105,
      tone: "concise",
      success_rate: 1,
    },
    local_runtime: {
      mic_check_available: true,
      mic_check_status: "terminal_only",
      tts_check_available: true,
      tts_check_status: "terminal_only",
      notification_check_available: true,
      notification_check_status: "terminal_only",
      tts_enabled_effective: false,
      desktop_notifications_enabled_effective: false,
      live_mic_from_web: false,
      browser_tts_from_web: false,
      always_on: false,
      wake_word: false,
    },
    status_json: {
      available: true,
      freshness: "fresh",
      path: "/tmp/bedroom_copilot_status.json",
      status_age_seconds: 1,
      updated_at: "2026-06-16T12:00:00Z",
    },
    safety: {
      side_effects_default: "disabled",
      memory_writes_default: "disabled",
      requires_explicit_confirmation: true,
      low_quality_audio_gated: true,
      web_voice_controls_enabled: false,
    },
    generated_at: "2026-06-16T12:00:00Z",
    ...overrides,
  };
}

function browserSpeechControls(overrides: Partial<BrowserSpeechControls> = {}): BrowserSpeechControls {
  return {
    available: true,
    speak: jest.fn(() => "speaking"),
    cancel: jest.fn(() => "cancelled"),
    ...overrides,
  };
}

describe("OSConsole command center", () => {
  const originalFetch = global.fetch;
  const clipboardWriteText = jest.fn<Promise<void>, [string]>();

  beforeEach(() => {
    mockAskDeltaConversation.mockReset();
    mockGetSystemReadiness.mockReset();
    clipboardWriteText.mockReset();
    clipboardWriteText.mockResolvedValue(undefined);
    mockGetSystemReadiness.mockImplementation(() => new Promise<SystemReadinessResponse>(() => undefined));
    global.fetch = jest.fn(
      () => new Promise<Response>(() => undefined),
    ) as jest.MockedFunction<typeof fetch>;
    Object.defineProperty(Object.getPrototypeOf(window.navigator), "clipboard", {
      configurable: true,
      get: () => ({
        writeText: clipboardWriteText,
      }),
    });
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      get: () => ({
        writeText: clipboardWriteText,
      }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("server render keeps browser TTS text stable until client capability detection", () => {
    const html = renderToString(<OSConsole clipboardWriter={clipboardWriteText} />);

    expect(html).toContain("Speak response");
    expect(html).toContain("browser TTS: <!-- -->checking");
    expect(html).not.toContain("Browser TTS unavailable");
  });

  it("renders enabled typed input while voice input remains disabled and speech waits for a response", () => {
    render(<OSConsole clipboardWriter={clipboardWriteText} speechControls={browserSpeechControls()} />);

    expect(screen.getByLabelText("Ask Delta prompt")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ask Delta" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Voice input coming soon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Speak response" })).toBeDisabled();
    expect(screen.getAllByText("read-only API").length).toBeGreaterThan(0);
    expect(screen.getByText("no automatic memory writes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Command Palette" })).toBeInTheDocument();
  });

  it("renders successful live system readiness", async () => {
    mockGetSystemReadiness.mockResolvedValue(readinessResponse());

    render(<OSConsole clipboardWriter={clipboardWriteText} />);

    expect(screen.getByText("Can Delta run safely right now?")).toBeInTheDocument();
    expect(await screen.findByText("backend ready")).toBeInTheDocument();
    expect(screen.getByText("supabase ready")).toBeInTheDocument();
    expect(screen.getByText("schema ready")).toBeInTheDocument();
    expect(screen.getByText("conversation ready")).toBeInTheDocument();
    expect(screen.getByText(/Readable for eric-demo-live-notification-test: good_call, concise tone, cooldown 105/)).toBeInTheDocument();
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

    render(<OSConsole clipboardWriter={clipboardWriteText} />);

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

  it("opens and closes the command palette", async () => {
    const user = userEvent.setup();

    render(<OSConsole speechControls={browserSpeechControls()} />);

    await user.click(screen.getByRole("button", { name: "Command Palette" }));
    const dialog = screen.getByRole("dialog", { name: "Delta command palette" });
    expect(within(dialog).getByText("Ask: What did you learn about late caffeine?")).toBeInTheDocument();
    expect(within(dialog).getByText("Speak latest Delta response").closest("button")).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog", { name: "Delta command palette" })).not.toBeInTheDocument();
  });

  it("opens the command palette with CtrlK", async () => {
    const user = userEvent.setup();

    render(<OSConsole />);

    await user.keyboard("{Control>}k{/Control}");

    expect(screen.getByRole("dialog", { name: "Delta command palette" })).toBeInTheDocument();
  });

  it("command palette action sends a suggested question", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Command Palette" }));
    await user.click(within(screen.getByRole("dialog", { name: "Delta command palette" })).getByText("Ask: What did you learn about late caffeine?"));

    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();
    expect(mockAskDeltaConversation).toHaveBeenCalledWith({
      userId: "eric-demo-live-notification-test",
      message: "What did you learn about late caffeine?",
    });
  });

  it("command palette action refreshes readiness", async () => {
    const user = userEvent.setup();
    mockGetSystemReadiness.mockResolvedValue(readinessResponse());

    render(<OSConsole />);

    await waitFor(() => {
      expect(mockGetSystemReadiness).toHaveBeenCalledTimes(1);
    });
    await user.click(screen.getByRole("button", { name: "Command Palette" }));
    await user.click(within(screen.getByRole("dialog", { name: "Delta command palette" })).getByText("Refresh readiness"));

    await waitFor(() => {
      expect(mockGetSystemReadiness).toHaveBeenCalledTimes(2);
    });
  });

  it("command palette action clears browser-local chat", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Command Palette" }));
    await user.click(within(screen.getByRole("dialog", { name: "Delta command palette" })).getByText("Clear chat session"));

    expect(screen.queryByText(/105-minute cooldown/)).not.toBeInTheDocument();
    expect(screen.getByText(/Ask a typed, read-only question/)).toBeInTheDocument();
  });

  it("command palette copy action writes the expected command", async () => {
    const user = userEvent.setup();

    render(<OSConsole clipboardWriter={clipboardWriteText} />);

    await user.click(screen.getByRole("button", { name: "Command Palette" }));
    await user.click(within(screen.getByRole("dialog", { name: "Delta command palette" })).getByText("Copy backend start command"));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("uvicorn api_server:app"));
    });
    expect(screen.getByText("Backend start command copied.")).toBeInTheDocument();
  });

  it("command palette can speak the latest Delta response with browser TTS", async () => {
    const user = userEvent.setup();
    const speech = browserSpeechControls();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole speechControls={speech} />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Command Palette" }));
    await user.click(within(screen.getByRole("dialog", { name: "Delta command palette" })).getByText("Speak latest Delta response"));

    expect(speech.speak).toHaveBeenCalledWith(expect.stringContaining("105-minute cooldown"), expect.any(Object));
  });

  it("command palette can stop browser speech playback", async () => {
    const user = userEvent.setup();
    const speech = browserSpeechControls();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole speechControls={speech} />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    await user.click(await screen.findByRole("button", { name: "Speak response" }));
    await user.click(screen.getByRole("button", { name: "Command Palette" }));
    await user.click(within(screen.getByRole("dialog", { name: "Delta command palette" })).getByText("Stop speaking"));

    expect(speech.cancel).toHaveBeenCalled();
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

  it("renders follow-up suggestions after an assistant response and sends one directly", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation
      .mockResolvedValueOnce(conversationTurn())
      .mockResolvedValueOnce(
        conversationTurn({
          message: "Why did Delta lower the cooldown?",
          response: "Delta lowered the cooldown because the feedback was positive.",
          intent: "explanation",
        }),
      );

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    expect(await screen.findByText("Why did Delta lower the cooldown?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Why did Delta lower the cooldown?" }));

    expect(await screen.findByText(/because the feedback was positive/)).toBeInTheDocument();
    expect(mockAskDeltaConversation).toHaveBeenLastCalledWith({
      userId: "eric-demo-live-notification-test",
      message: "Why did Delta lower the cooldown?",
      sessionId: "session-1",
    });
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

  it("enables browser TTS after an assistant response and speaks the latest response", async () => {
    const user = userEvent.setup();
    const speech = browserSpeechControls();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole speechControls={speech} />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();

    const speakButton = screen.getByRole("button", { name: "Speak response" });
    expect(speakButton).toBeEnabled();
    await user.click(speakButton);

    expect(speech.speak).toHaveBeenCalledWith(
      expect.stringContaining("105-minute cooldown"),
      expect.objectContaining({
        onStart: expect.any(Function),
        onEnd: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(screen.getByText("browser TTS: speaking")).toBeInTheDocument();
  });

  it("stops browser TTS playback", async () => {
    const user = userEvent.setup();
    const speech = browserSpeechControls();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole speechControls={speech} />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    await user.click(await screen.findByRole("button", { name: "Speak response" }));
    await user.click(screen.getByRole("button", { name: "Stop speaking" }));

    expect(speech.cancel).toHaveBeenCalled();
    expect(screen.getByText("browser TTS: cancelled")).toBeInTheDocument();
  });

  it("shows unavailable browser TTS label when speech synthesis is unavailable", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole speechControls={browserSpeechControls({ available: false })} />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(await screen.findByRole("button", { name: "Browser TTS unavailable" })).toBeDisabled();
    expect(screen.getByText("browser TTS: unavailable")).toBeInTheDocument();
  });

  it("browser TTS does not call the backend conversation API again or change transcript", async () => {
    const user = userEvent.setup();
    const speech = browserSpeechControls();
    mockAskDeltaConversation.mockResolvedValue(conversationTurn());

    render(<OSConsole speechControls={speech} />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    expect(await screen.findByText(/105-minute cooldown/)).toBeInTheDocument();
    mockAskDeltaConversation.mockClear();

    await user.click(screen.getByRole("button", { name: "Speak response" }));

    expect(mockAskDeltaConversation).not.toHaveBeenCalled();
    expect(screen.getAllByText(/105-minute cooldown/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Voice input coming soon" })).toBeDisabled();
  });

  it("updates local session summary after multiple turns", async () => {
    const user = userEvent.setup();
    mockAskDeltaConversation
      .mockResolvedValueOnce(conversationTurn())
      .mockResolvedValueOnce(
        conversationTurn({
          message: "Can you talk like Jarvis yet?",
          response: "Not fully. Typed conversation works; always-on is not built.",
          intent: "capability_inquiry",
        }),
      );

    render(<OSConsole />);

    await user.click(screen.getByRole("button", { name: "Ask Delta" }));
    await user.type(screen.getByLabelText("Ask Delta prompt"), "Can you talk like Jarvis yet?");
    await user.click(screen.getByRole("button", { name: "Ask Delta" }));

    expect(await screen.findByText("capability_inquiry")).toBeInTheDocument();
    expect(screen.getByText("This summarizes browser-local chat state only. It is not written to memory or Supabase.")).toBeInTheDocument();
    expect(screen.getByText("User turns")).toBeInTheDocument();
    expect(screen.getByText("Assistant turns")).toBeInTheDocument();
    expect(screen.getByText("Read-only turns")).toBeInTheDocument();
  });

  it("copies a proof report with readiness, proof, and safety fields", async () => {
    const user = userEvent.setup();
    mockGetSystemReadiness.mockResolvedValue(readinessResponse());

    render(<OSConsole clipboardWriter={clipboardWriteText} />);

    expect(await screen.findByText("backend ready")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy Proof Report" }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("# Delta OS Proof Report"));
    });
    expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("## Backend Readiness"));
    expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("## Safety Posture"));
  });

  it("copies the current local session summary", async () => {
    const user = userEvent.setup();

    render(<OSConsole clipboardWriter={clipboardWriteText} />);

    await user.click(screen.getByRole("button", { name: "Copy current session summary" }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("# Delta OS Local Session Summary"));
    });
    expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining("not written to Delta memory"));
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

  it("refreshes system readiness without calling the conversation API", async () => {
    const user = userEvent.setup();
    mockGetSystemReadiness.mockResolvedValue(readinessResponse());

    render(<OSConsole />);

    await waitFor(() => {
      expect(mockGetSystemReadiness).toHaveBeenCalledTimes(1);
    });
    await user.click(await screen.findByRole("button", { name: "Refresh readiness" }));

    await waitFor(() => {
      expect(mockGetSystemReadiness).toHaveBeenCalledTimes(2);
    });
    expect(mockAskDeltaConversation).not.toHaveBeenCalled();
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

  it("shows readiness unavailable when backend readiness fails", async () => {
    mockGetSystemReadiness.mockRejectedValue(new Error("readiness backend unavailable"));

    render(<OSConsole />);

    expect(await screen.findByText("readiness backend unavailable")).toBeInTheDocument();
    expect(screen.getByText("backend fallback")).toBeInTheDocument();
  });

  it("recommended next step changes when backend is unavailable versus ready", async () => {
    const { unmount } = render(<OSConsole />);

    expect(screen.getAllByText("Start backend").length).toBeGreaterThan(0);

    unmount();
    mockGetSystemReadiness.mockReset();
    mockGetSystemReadiness.mockResolvedValue(readinessResponse());
    render(<OSConsole />);

    expect(await screen.findByText("Try a typed read-only OS Console question")).toBeInTheDocument();
  });

  it("keeps browser voice input, wake word, and always-on marked not built", async () => {
    mockGetSystemReadiness.mockResolvedValue(readinessResponse());

    render(<OSConsole />);

    expect(await screen.findByText("Browser voice input")).toBeInTheDocument();
    expect(screen.getAllByText("not built").length).toBeGreaterThan(0);
    expect(screen.getByText(/Browser mic, wake word, and always-on mode are not built/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voice input coming soon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Speak response" })).toBeDisabled();
  });

  it("renders command cards for local validation", () => {
    render(<OSConsole />);

    expect(screen.getAllByText("Start backend").length).toBeGreaterThan(0);
    expect(screen.getByText("Start site")).toBeInTheDocument();
    expect(screen.getByText("Validate typed conversation API")).toBeInTheDocument();
    expect(screen.getByText("Pending live + TTS validation")).toBeInTheDocument();
    expect(screen.getAllByText(/uvicorn api_server:app/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/conversation\/turn/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ENABLE_LOCAL_TTS=true/).length).toBeGreaterThan(0);
  });
});
