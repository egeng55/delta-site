export type ProofStatus = "proven" | "implemented" | "pending validation" | "not built";

export type ConsoleEnvironment = {
  environment: "local" | "connected" | "unavailable";
  backend: "checking" | "connected" | "unavailable";
  supabase: "ready" | "unavailable" | "unknown";
  voiceReadiness: "ready" | "partial" | "unknown";
  sideEffects: "disabled by default" | "enabled" | "unknown";
  lastUpdated: string;
  dataSource: "backend" | "fallback";
};

export type ConsoleBehavioralState = {
  stateSource: "Supabase persisted state" | "fallback demo fixture" | "unavailable";
  stateIsSimulated: boolean;
  lastOutcome: string;
  tone: string;
  cooldownMinutes: string;
  successRate: string;
  deliveredCount: string;
  currentCooldown: string;
  suppression: string;
  learnedRuleSummary: string;
};

export type VoiceRuntimeStatus = {
  label: string;
  status: ProofStatus;
  detail: string;
};

export type RecentInterventionProof = {
  title: string;
  method: string;
  deliveryStatus: string;
  feedback: string;
  learnedChange: string;
  provenance: "real proof data" | "fallback fixture" | "simulated";
};

export type SafetyGate = {
  title: string;
  detail: string;
};

export type ProofLadderItem = {
  label: string;
  status: ProofStatus;
  detail: string;
};

export type ConsoleCommand = {
  title: string;
  command: string;
  detail: string;
};

export type OSConsoleFixture = {
  userId: string;
  environment: ConsoleEnvironment;
  behavioralState: ConsoleBehavioralState;
  voiceRuntime: VoiceRuntimeStatus[];
  recentInterventions: RecentInterventionProof[];
  safetyGates: SafetyGate[];
  proofLadder: ProofLadderItem[];
  nextSafeAction: ConsoleCommand;
  followUpAction: ConsoleCommand;
};

export const OS_CONSOLE_USER_ID = "eric-demo-live-notification-test";

export const OS_CONSOLE_TEXT_ONLY_COMMAND =
  'cd /Users/egeng/delta-backend\nset -a; source .env; set +a\n.venv/bin/python -m conversation_runtime --user-id eric-demo-live-notification-test --live --input-device-name "MacBook Pro Microphone" --max-seconds 10 --vad-threshold 0.015 --min-speech-seconds 0.05 --save-audio-debug';

export const OS_CONSOLE_LIVE_TTS_COMMAND =
  'cd /Users/egeng/delta-backend\nset -a; source .env; set +a\nENABLE_LOCAL_TTS=true .venv/bin/python -m conversation_runtime --user-id eric-demo-live-notification-test --live --input-device-name "MacBook Pro Microphone" --max-seconds 10 --vad-threshold 0.015 --min-speech-seconds 0.05 --save-audio-debug --tts';

export const OS_CONSOLE_FALLBACK: OSConsoleFixture = {
  userId: OS_CONSOLE_USER_ID,
  environment: {
    environment: "local",
    backend: "checking",
    supabase: "unknown",
    voiceReadiness: "partial",
    sideEffects: "disabled by default",
    lastUpdated: "fallback fixture",
    dataSource: "fallback",
  },
  behavioralState: {
    stateSource: "fallback demo fixture",
    stateIsSimulated: false,
    lastOutcome: "good_call",
    tone: "concise",
    cooldownMinutes: "105",
    successRate: "1.0",
    deliveredCount: "1",
    currentCooldown: "none reported",
    suppression: "not active",
    learnedRuleSummary: "Delta learned that concise late-caffeine guidance can still be useful.",
  },
  voiceRuntime: [
    {
      label: "Typed conversation",
      status: "proven",
      detail: "Read-only CLI conversation can answer from Behavioral OS state.",
    },
    {
      label: "Typed + TTS",
      status: "implemented",
      detail: "Conversation TTS requires explicit --tts and ENABLE_LOCAL_TTS=true.",
    },
    {
      label: "Live mic conversation",
      status: "proven",
      detail: "One-shot spoken question routed to text response once.",
    },
    {
      label: "Live mic + TTS conversation",
      status: "pending validation",
      detail: "Implemented in backend, but not user-validated yet.",
    },
    {
      label: "Wake word",
      status: "not built",
      detail: "No wake word exists.",
    },
    {
      label: "Always-on listening",
      status: "not built",
      detail: "No background listener exists.",
    },
  ],
  recentInterventions: [
    {
      title: "Live mic notification proof",
      method: "desktop_notification",
      deliveryStatus: "delivered",
      feedback: "good_call",
      learnedChange: "Concise tone preserved; cooldown settled near 105 minutes.",
      provenance: "real proof data",
    },
    {
      title: "TTS proof",
      method: "tts",
      deliveryStatus: "delivered",
      feedback: "good_call",
      learnedChange: "TTS delivered once separately with notification disabled.",
      provenance: "real proof data",
    },
    {
      title: "Negative feedback proof",
      method: "persistence only",
      deliveryStatus: "notified in controlled test",
      feedback: "too_much",
      learnedChange: "Tone softened, cooldown increased, and reduction level rose.",
      provenance: "real proof data",
    },
    {
      title: "Timing feedback proof",
      method: "persistence only",
      deliveryStatus: "controlled scripted test",
      feedback: "remind_earlier",
      learnedChange: "Timing offset shifted earlier.",
      provenance: "real proof data",
    },
  ],
  safetyGates: [
    {
      title: "TTS disabled by default",
      detail: "Conversation TTS needs --tts and ENABLE_LOCAL_TTS=true.",
    },
    {
      title: "Notifications require confirmation",
      detail: "Behavioral OS delivery side effects stay gated and separated from TTS.",
    },
    {
      title: "Memory writes gated",
      detail: "Conversation runtime reads state but does not write memory.",
    },
    {
      title: "Low-quality audio rejected",
      detail: "Transcript quality gate blocks punctuation-only and low-signal captures.",
    },
    {
      title: "Delivery channels separated",
      detail: "Notification, TTS, and disabled delivery are represented separately.",
    },
    {
      title: "No background listening",
      detail: "Only one-shot CLI microphone capture exists.",
    },
  ],
  proofLadder: [
    { label: "Scripted loop", status: "proven", detail: "Late-caffeine scenario can run end to end in dry-run." },
    { label: "Persistence", status: "proven", detail: "Behavioral OS tables are applied and write/read paths are verified." },
    { label: "Negative feedback", status: "proven", detail: "too_much persists and makes Delta back off." },
    { label: "Notification", status: "proven", detail: "One real desktop notification delivered." },
    { label: "TTS", status: "proven", detail: "One local TTS delivery succeeded separately." },
    { label: "Live mic persistence", status: "proven", detail: "Spoken late-caffeine input persisted once." },
    { label: "Live mic notification", status: "proven", detail: "Spoken input plus notification delivered once with TTS off." },
    { label: "Typed conversation", status: "proven", detail: "Read-only runtime answers from persisted state." },
    { label: "Typed conversation TTS", status: "implemented", detail: "Explicit TTS path exists; keep it opt-in." },
    { label: "Live conversation", status: "proven", detail: "Spoken question routed to text response once." },
    { label: "Live conversation TTS", status: "pending validation", detail: "Implemented but not user-validated yet." },
    { label: "Always-on", status: "not built", detail: "No wake word or background mode exists." },
  ],
  nextSafeAction: {
    title: "Run text-only live conversation validation first",
    command: OS_CONSOLE_TEXT_ONLY_COMMAND,
    detail: "Confirms microphone capture and persisted-state answer without TTS, notification, or writes.",
  },
  followUpAction: {
    title: "Only after that, validate live mic + TTS",
    command: OS_CONSOLE_LIVE_TTS_COMMAND,
    detail: "Speaks the response aloud. Run only when local TTS output is explicitly approved.",
  },
};
