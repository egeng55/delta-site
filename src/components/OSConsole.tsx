"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DELTA_API_URL } from "@/lib/api";
import { createBrowserSpeechControls, type BrowserSpeechControls, type BrowserSpeechStatus } from "@/lib/browserSpeech";
import { askDeltaConversation, type ConversationTurnResponse } from "@/lib/conversationApi";
import { getSystemReadiness, type ReadinessStatus, type SystemReadinessResponse } from "@/lib/systemReadinessApi";
import {
  OS_CONSOLE_FALLBACK,
  OS_CONSOLE_LIVE_TTS_COMMAND,
  OS_CONSOLE_USER_ID,
  type ConsoleBehavioralState,
  type ConsoleCommand,
  type ConsoleEnvironment,
  type OSConsoleFixture,
  type ProofStatus,
  type RecentInterventionProof,
} from "@/lib/osConsoleFixtures";

type BackendStatusPayload = {
  runtime_status?: Record<string, unknown> | null;
  late_caffeine_state?: Record<string, unknown> | null;
  recent_interventions?: Array<Record<string, unknown>>;
  state_provenance?: Record<string, unknown>;
  persisted_state_status?: Record<string, unknown>;
};

type ConversationDisplayTurn = {
  id: string;
  role: "user" | "delta" | "system";
  content: string;
  orderLabel: string;
  metadata?: ConversationTurnResponse;
};

type LocalSessionSummary = {
  userTurns: number;
  assistantTurns: number;
  errorTurns: number;
  latestIntent: string;
  latestStateSource: string;
  allTurnsReadOnly: boolean;
};

type CommandPaletteAction = {
  id: string;
  title: string;
  detail: string;
  run: () => void | Promise<void>;
  disabled?: boolean;
};

type FollowUpAction = {
  label: string;
  kind: "ask" | "refresh_readiness" | "copy_backend";
};

type ConsoleView = "chat" | "state" | "readiness" | "proof" | "developer";

const CONSOLE_VIEWS: Array<{ id: ConsoleView; label: string; detail: string }> = [
  { id: "chat", label: "Chat", detail: "Ask Delta questions in read-only mode." },
  { id: "state", label: "State", detail: "Understand the current Behavioral OS rule." },
  { id: "readiness", label: "Readiness", detail: "Check what can run safely right now." },
  { id: "proof", label: "Proof", detail: "Review validated capabilities and safety gates." },
  { id: "developer", label: "Developer", detail: "Copy local commands and audit metadata." },
];

const SUGGESTED_PROMPTS = [
  "What did you learn about late caffeine?",
  "What does good_call mean?",
  "What would you do if I drank a Monster at 10 PM?",
  "Can you talk like Jarvis yet?",
  "Why did you notify me?",
  "What is still not built?",
];

const COMMAND_CENTER_COMMANDS: ConsoleCommand[] = [
  {
    title: "Start backend",
    detail: "Runs the local API used by the OS Console. This does not start mic, TTS, notification, or writes by itself.",
    command:
      "cd /Users/egeng/delta-backend\nset -a; source .env; set +a\n.venv/bin/python -m uvicorn api_server:app --host 127.0.0.1 --port 8000",
  },
  {
    title: "Start site",
    detail: "Runs the local web console at http://127.0.0.1:3000/os.",
    command: "cd /Users/egeng/delta-site\nnpm run dev -- --hostname 127.0.0.1 --port 3000",
  },
  {
    title: "Validate typed conversation API",
    detail: "Calls the read-only typed endpoint directly. It reads state only and does not run delivery.",
    command:
      "curl -s -X POST http://127.0.0.1:8000/conversation/turn \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"user_id\":\"eric-demo-live-notification-test\",\"message\":\"what did you learn about late caffeine?\",\"read_only\":true}'",
  },
  {
    title: "Pending live + TTS validation",
    detail: "Local terminal only, not web UI. Run only when spoken output is explicitly approved.",
    command: OS_CONSOLE_LIVE_TTS_COMMAND,
  },
];

function turnId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function initialConversationTurns(): ConversationDisplayTurn[] {
  return [
    {
      id: "initial-delta",
      role: "delta",
      orderLabel: "Ready",
      content:
        "Ask a typed, read-only question. Delta will answer through the local backend conversation runtime when it is available.",
    },
  ];
}

function makeTurn(
  role: ConversationDisplayTurn["role"],
  content: string,
  order: number,
  metadata?: ConversationTurnResponse,
): ConversationDisplayTurn {
  return {
    id: turnId(),
    role,
    content,
    orderLabel: role === "system" ? "System" : `Turn ${order}`,
    metadata,
  };
}

function summarizeSession(turns: ConversationDisplayTurn[], lastResponse: ConversationTurnResponse | null): LocalSessionSummary {
  const assistantResponses = turns.filter((turn) => turn.role === "delta" && turn.metadata);
  const errorTurns = turns.filter((turn) => turn.role === "system").length;
  return {
    userTurns: turns.filter((turn) => turn.role === "user").length,
    assistantTurns: assistantResponses.length,
    errorTurns,
    latestIntent: lastResponse?.intent || "none yet",
    latestStateSource: lastResponse?.state_source || "pending",
    allTurnsReadOnly: assistantResponses.every((turn) => turn.metadata?.read_only === true && turn.metadata.memory_writes === false),
  };
}

function buildSessionSummaryMarkdown(summary: LocalSessionSummary): string {
  return [
    "# Delta OS Local Session Summary",
    "",
    `- User turns: ${summary.userTurns}`,
    `- Assistant turns: ${summary.assistantTurns}`,
    `- Error turns: ${summary.errorTurns}`,
    `- Latest intent: ${summary.latestIntent}`,
    `- Latest state source: ${summary.latestStateSource}`,
    `- All assistant turns read-only: ${summary.allTurnsReadOnly ? "yes" : "no"}`,
    "",
    "This summary is browser-local UI state only. It is not written to Delta memory or Supabase.",
  ].join("\n");
}

function buildProofReportMarkdown({
  readiness,
  readinessLoadState,
  consoleData,
  sessionSummary,
}: {
  readiness: SystemReadinessResponse | null;
  readinessLoadState: "checking" | "ready" | "fallback";
  consoleData: OSConsoleFixture;
  sessionSummary: LocalSessionSummary;
}) {
  const proven = consoleData.proofLadder.filter((item) => item.status === "proven").map((item) => item.label);
  const pending = consoleData.proofLadder.filter((item) => item.status !== "proven").map((item) => `${item.label}: ${item.status}`);
  const readinessLabel = readiness ? "live read-only readiness" : `${readinessLoadState} readiness`;
  return [
    "# Delta OS Proof Report",
    "",
    `Generated locally from /os state at ${new Date().toLocaleString()}.`,
    `Readiness source: ${readinessLabel}.`,
    "",
    "## Backend Readiness",
    `- Backend: ${readiness ? readiness.backend.status : "unavailable or not checked"}`,
    `- Supabase: ${readiness ? readiness.supabase.status : "unavailable or not checked"}`,
    `- Behavioral OS schema: ${readiness ? readiness.supabase.schema_status : "unavailable or not checked"}`,
    "",
    "## Proof User State",
    `- User: ${readiness?.proof_user.user_id || consoleData.userId}`,
    `- Readable: ${readiness?.proof_user.state_readable ? "yes" : "no or fallback"}`,
    `- Last outcome: ${readiness?.proof_user.last_outcome || consoleData.behavioralState.lastOutcome}`,
    `- Tone: ${readiness?.proof_user.tone || consoleData.behavioralState.tone}`,
    `- Cooldown minutes: ${readiness?.proof_user.cooldown_minutes ?? consoleData.behavioralState.cooldownMinutes}`,
    `- Success rate: ${readiness?.proof_user.success_rate ?? consoleData.behavioralState.successRate}`,
    "",
    "## Proven Capabilities",
    ...proven.map((item) => `- ${item}`),
    "",
    "## Pending Or Not Built",
    ...pending.map((item) => `- ${item}`),
    "",
    "## Safety Posture",
    `- Side effects default: ${readiness?.safety.side_effects_default || "disabled"}`,
    `- Memory writes default: ${readiness?.safety.memory_writes_default || "disabled"}`,
    `- Explicit confirmation required: ${readiness?.safety.requires_explicit_confirmation ? "yes" : "not checked"}`,
    "- Browser TTS preview: user-triggered local browser playback only",
    "- Backend local TTS: not called from /os",
    "- Browser mic: not built",
    "- Browser TTS autoplay/background mode: not built",
    "- Wake word: not built",
    "- Always-on listening: not built",
    "",
    "## Local Chat Session",
    `- User turns: ${sessionSummary.userTurns}`,
    `- Assistant turns: ${sessionSummary.assistantTurns}`,
    `- Latest intent: ${sessionSummary.latestIntent}`,
    "",
    "This report is generated locally from read-only OS Console state. It does not prove production readiness.",
  ].join("\n");
}

function followUpsForResponse(lastResponse: ConversationTurnResponse | null, latestSystemError: string | null): FollowUpAction[] {
  if (latestSystemError) {
    return [
      { label: "Copy backend start command", kind: "copy_backend" },
      { label: "Refresh readiness", kind: "refresh_readiness" },
    ];
  }
  if (!lastResponse) return [];
  if (lastResponse.intent === "state_inquiry") {
    return [
      { label: "Why did Delta lower the cooldown?", kind: "ask" },
      { label: "What would happen if I said this was annoying?", kind: "ask" },
      { label: "Show me the proof ladder.", kind: "ask" },
    ];
  }
  if (lastResponse.intent === "capability_inquiry") {
    return [
      { label: "What is still not built?", kind: "ask" },
      { label: "What is the safest next validation?", kind: "ask" },
      { label: "Can you explain the voice pipeline?", kind: "ask" },
    ];
  }
  if (lastResponse.intent === "hypothetical_policy") {
    return [
      { label: "Would you stay silent if cooldown is active?", kind: "ask" },
      { label: "What feedback would make Delta back off?", kind: "ask" },
      { label: "Why would you notify me?", kind: "ask" },
    ];
  }
  return [
    { label: "What did you learn about late caffeine?", kind: "ask" },
    { label: "Can you talk like Jarvis yet?", kind: "ask" },
  ];
}

const statusStyles: Record<ProofStatus, string> = {
  proven: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
  implemented: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "pending validation": "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "not built": "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

const readinessStyles: Record<ReadinessStatus, string> = {
  ready: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
  unavailable: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  not_checked: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  terminal_only: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  not_built: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  fallback: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback = "unknown") {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

function timeLabel(value: unknown) {
  if (!value || typeof value !== "string") return new Date().toLocaleString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[`'"]/g, "").replace(/\s+/g, " ").trim();
}

function outcomeSummary(outcome: string) {
  if (outcome === "good_call") return "Delta judged the last late-caffeine guidance as useful or appropriate.";
  if (outcome === "too_much") return "The last guidance was marked as too much, so Delta should soften or back off.";
  if (outcome === "remind_earlier") return "The last feedback asked Delta to intervene earlier next time.";
  if (outcome === "dont_mention_again") return "Delta was told not to bring up this pattern again.";
  if (!outcome || outcome === "unknown") return "Delta does not have a clear outcome for the latest late-caffeine guidance yet.";
  return `Delta recorded the latest outcome as ${outcome}.`;
}

function toneSummary(tone: string) {
  if (tone === "concise") return "Delta should keep the wording short and direct.";
  if (tone === "soft") return "Delta should use a softer, lower-pressure tone.";
  if (tone === "direct") return "Delta can use a direct reminder.";
  return "Delta has not translated this tone into a plain-language rule yet.";
}

function cooldownSummary(minutes: string) {
  const value = Number(minutes);
  if (Number.isFinite(value) && value > 0) {
    return `Delta would wait ${value} minutes before giving another similar late-caffeine nudge.`;
  }
  return "Delta does not currently have a meaningful cooldown window for this pattern.";
}

function suppressionSummary(suppression: string) {
  if (!suppression || suppression === "not active") return "Delta is not currently suppressing this late-caffeine pattern.";
  return `Delta is currently suppressing this pattern: ${suppression}.`;
}

function successRateSummary(successRate: string) {
  const value = Number(successRate);
  if (Number.isFinite(value)) {
    const percent = Math.round(value * 100);
    return `So far, ${percent}% of recorded feedback for this pattern has been positive.`;
  }
  return "Delta does not have enough usable feedback to calculate a clear success rate.";
}

function deliveredCountSummary(deliveredCount: string) {
  const value = Number(deliveredCount);
  if (Number.isFinite(value)) {
    return `Delta has recorded ${value} delivered intervention${value === 1 ? "" : "s"} for this pattern.`;
  }
  return "Delta does not have a clear delivered-count value for this pattern.";
}

function sourceSummary(source: string) {
  if (source === "Supabase persisted state") return "This state was loaded from saved read-only system data.";
  if (source === "fallback demo fixture") return "This is labeled fallback data, not a live persisted read.";
  if (source === "unavailable") return "Saved state is not currently available for this user.";
  if (source === "persisted" || source === "supabase") return "This answer used saved read-only system data.";
  return `This state source is ${source}.`;
}

function intentSummary(intent: string) {
  if (!intent || intent === "none yet") return "Delta has not classified an intent yet.";
  if (intent === "unknown") return "Delta could not confidently classify the user’s intent for that message.";
  if (intent === "state_inquiry") return "Delta understood the message as a question about saved Behavioral OS state.";
  if (intent === "capability_inquiry") return "Delta understood the message as a question about what is currently built.";
  if (intent === "hypothetical_policy") return "Delta understood the message as a hypothetical policy question.";
  if (intent === "clarification") return "Delta answered a plain-English clarification about a visible console term.";
  return `Delta classified the message as ${intent}.`;
}

function stateInterpretation(state: ConsoleBehavioralState) {
  return {
    pattern: "Late caffeine",
    summary: `${outcomeSummary(state.lastOutcome)} ${toneSummary(state.tone)} ${cooldownSummary(state.cooldownMinutes)}`,
    currentRule: `${toneSummary(state.tone)} ${cooldownSummary(state.cooldownMinutes)} ${suppressionSummary(state.suppression)}`,
    why: state.learnedRuleSummary || outcomeSummary(state.lastOutcome),
    safety: "This console is only reading and explaining saved state. It is not writing memory, sending notifications, or starting voice input.",
    source: sourceSummary(state.stateSource),
    suppression: suppressionSummary(state.suppression),
    successRate: successRateSummary(state.successRate),
    deliveredCount: deliveredCountSummary(state.deliveredCount),
  };
}

function readOnlyMetadata(message: string, stateSource: string, intent = "clarification"): ConversationTurnResponse {
  return {
    session_id: "local-explainability",
    user_id: OS_CONSOLE_USER_ID,
    input_mode: "typed",
    message,
    response: "",
    intent,
    read_only: true,
    memory_writes: false,
    notification: false,
    tts: false,
    side_effect_status: "none",
    state_source: stateSource,
    metadata: {
      input_mode: "typed",
      memory_writes: false,
      notification: false,
      tts_enabled: false,
    },
    context_summary: {
      state_source: stateSource,
    },
  };
}

function localClarificationResponse(message: string, state: ConsoleBehavioralState, latestIntent: string): ConversationTurnResponse | null {
  const normalized = normalizeForMatch(message);
  const source = state.stateSource === "Supabase persisted state" ? "persisted" : state.stateSource === "fallback demo fixture" ? "fallback" : "unavailable";
  const base = readOnlyMetadata(message, source);
  const ending = "No write, notification, TTS, mic capture, or memory mutation happened.";
  const asksMeaning = normalized.includes("what does")
    || normalized.includes("what is")
    || normalized.includes("what do")
    || normalized.includes("mean")
    || normalized.includes("meaning")
    || normalized.includes("explain");
  const asksWhyState = normalized.includes("why is") || normalized.includes("why does");

  if ((normalized.includes("good_call") || normalized.includes("good call")) && asksMeaning) {
    return {
      ...base,
      response: `good_call means the previous late-caffeine guidance was judged useful or appropriate. In the current state, the latest outcome is good_call, so Delta kept the guidance concise and is using a ${state.cooldownMinutes}-minute cooldown. ${ending}`,
    };
  }
  if (normalized.includes("cooldown") && asksMeaning) {
    return {
      ...base,
      response: `Cooldown is the waiting period before Delta would give another similar nudge. Here it means Delta would wait ${state.cooldownMinutes} minutes before another late-caffeine reminder. ${ending}`,
    };
  }
  if ((normalized.includes("suppression") || normalized.includes("suppress")) && (asksMeaning || asksWhyState)) {
    return {
      ...base,
      response: `${suppressionSummary(state.suppression)} Suppression is stronger than cooldown: it means Delta should avoid this pattern for a period instead of merely waiting between nudges. ${ending}`,
    };
  }
  if ((normalized.includes("persisted state") || normalized.includes("persisted") || normalized.includes("saved state")) && asksMeaning) {
    return {
      ...base,
      response: `${sourceSummary(state.stateSource)} In this console, persisted state is read-only; showing it does not create or update Supabase rows. ${ending}`,
    };
  }
  if (normalized.includes("intent") && (asksMeaning || asksWhyState)) {
    return {
      ...base,
      response: `${intentSummary(latestIntent)} Intent is Delta’s rough route for a message, such as state question, capability question, hypothetical policy question, or clarification. ${ending}`,
    };
  }
  if ((normalized.includes("delivered count") || normalized.includes("delivered")) && asksMeaning) {
    return {
      ...base,
      response: `${deliveredCountSummary(state.deliveredCount)} It is a count of recorded interventions for this pattern, not a command to deliver anything now. ${ending}`,
    };
  }
  if (normalized.includes("success rate") && asksMeaning) {
    return {
      ...base,
      response: `${successRateSummary(state.successRate)} It is based on recorded feedback for this pattern and is shown here read-only. ${ending}`,
    };
  }
  return null;
}

function mapBackendToConsole(payload: BackendStatusPayload): OSConsoleFixture {
  const runtime = record(payload.runtime_status);
  const state = record(payload.late_caffeine_state ?? runtime.late_caffeine_state);
  const adaptation = record(state.adaptation);
  const metrics = record(state.metrics);
  const stateProvenance = record(payload.state_provenance);
  const persistedStatus = record(payload.persisted_state_status);
  const recentInterventions = Array.isArray(payload.recent_interventions) ? payload.recent_interventions : [];
  const latestIntervention = recentInterventions[0] ?? record(runtime.last_intervention_decision);
  const hasPersistedState = Object.keys(state).length > 0;

  const behavioralState: ConsoleBehavioralState = {
    stateSource: hasPersistedState ? "Supabase persisted state" : "unavailable",
    stateIsSimulated: Boolean(state.state_is_simulated ?? stateProvenance.is_simulated),
    lastOutcome: text(state.last_outcome ?? metrics.last_outcome, OS_CONSOLE_FALLBACK.behavioralState.lastOutcome),
    tone: text(adaptation.tone, OS_CONSOLE_FALLBACK.behavioralState.tone),
    cooldownMinutes: text(adaptation.cooldown_minutes, OS_CONSOLE_FALLBACK.behavioralState.cooldownMinutes),
    successRate: text(state.success_rate ?? metrics.success_rate, OS_CONSOLE_FALLBACK.behavioralState.successRate),
    deliveredCount: text(metrics.interventions_delivered, OS_CONSOLE_FALLBACK.behavioralState.deliveredCount),
    currentCooldown: text(state.current_cooldown_until ?? metrics.current_cooldown_until, "none reported"),
    suppression: adaptation.suppress_until ? `active until ${text(adaptation.suppress_until)}` : "not active",
    learnedRuleSummary:
      text(record(adaptation.last_feedback_summary).summary, "") ||
      OS_CONSOLE_FALLBACK.behavioralState.learnedRuleSummary,
  };

  const latestProof: RecentInterventionProof | null = Object.keys(latestIntervention).length
    ? {
        title: "Latest backend intervention",
        method: text(latestIntervention.delivery_method ?? latestIntervention.channel, "none"),
        deliveryStatus: text(latestIntervention.delivery_status, "unknown"),
        feedback: text(latestIntervention.feedback_outcome ?? runtime.feedback, "none"),
        learnedChange: text(
          Array.isArray(latestIntervention.adaptation_summary)
            ? latestIntervention.adaptation_summary.join(" ")
            : latestIntervention.reasoning,
          "Latest backend status did not include an adaptation summary.",
        ),
        provenance: "real proof data",
      }
    : null;

  const environment: ConsoleEnvironment = {
    environment: "connected",
    backend: "connected",
    supabase: persistedStatus.status === "reachable" || hasPersistedState ? "ready" : "unknown",
    voiceReadiness: "partial",
    sideEffects: "disabled by default",
    lastUpdated: timeLabel(runtime.updated_at ?? runtime.completed_at),
    dataSource: "backend",
  };

  return {
    ...OS_CONSOLE_FALLBACK,
    environment,
    behavioralState,
    recentInterventions: latestProof
      ? [latestProof, ...OS_CONSOLE_FALLBACK.recentInterventions]
      : OS_CONSOLE_FALLBACK.recentInterventions,
  };
}

function StatusChip({ status }: { status: ProofStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function ReadinessChip({ status, label }: { status: ReadinessStatus; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${readinessStyles[status]}`}>
      {label || status.replace("_", " ")}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border py-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-border/80 bg-card/80 p-5 shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow && <p className="text-xs font-medium uppercase tracking-wide text-primary">{eyebrow}</p>}
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="rounded-lg border border-border/80 bg-card/70 p-4 shadow-sm" open={defaultOpen}>
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            expand
          </span>
        </div>
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function SafetyStrip({ browserTtsStatus }: { browserTtsStatus: BrowserSpeechStatus }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/70 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-green-600 dark:text-green-400">
          Read-only
        </span>
        <span className="rounded-full border border-border px-3 py-1">No memory writes</span>
        <span className="rounded-full border border-border px-3 py-1">No notifications</span>
        <span className="rounded-full border border-border px-3 py-1">Voice input disabled</span>
        <span className="rounded-full border border-border px-3 py-1">Browser TTS: {browserTtsStatus}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">
        Browser mic, wake word, and always-on mode are not built. Speak response is a user-triggered browser preview only.
      </p>
    </div>
  );
}

function CommandCard({ title, detail, command }: { title: string; detail: string; command: string }) {
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-background/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{detail}</p>
        </div>
        <button
          type="button"
          onClick={copyCommand}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-primary/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-4 max-h-40 overflow-x-auto rounded-md border border-border bg-card p-3 text-xs leading-5 text-muted">
        <code>{command}</code>
      </pre>
    </div>
  );
}

function CommandPalette({
  open,
  actions,
  onClose,
}: {
  open: boolean;
  actions: CommandPaletteAction[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 px-4 py-8 backdrop-blur">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delta command palette"
        className="mx-auto max-w-2xl rounded-lg border border-border bg-card shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Command Palette</p>
            <h2 className="mt-1 text-xl font-semibold">Run local read-only console actions</h2>
            <p className="mt-1 text-sm text-muted">No palette action starts mic, TTS, notification, or memory writes.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
          >
            Close
          </button>
        </div>
        <div className="max-h-[32rem] overflow-y-auto p-3">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={async () => {
                await action.run();
                onClose();
              }}
              className="block w-full rounded-md px-3 py-3 text-left transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-sm font-semibold">{action.title}</span>
              <span className="mt-1 block text-sm leading-6 text-muted">{action.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FollowUpSuggestions({
  items,
  onRun,
}: {
  items: FollowUpAction[];
  onRun: (action: FollowUpAction) => void | Promise<void>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 rounded-md border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested follow-ups</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={`${item.kind}-${item.label}`}
            type="button"
            onClick={() => void onRun(item)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-card"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SessionSummaryCard({
  summary,
  clipboardMessage,
  onCopySummary,
  onCopyProofReport,
}: {
  summary: LocalSessionSummary;
  clipboardMessage: string;
  onCopySummary: () => void;
  onCopyProofReport: () => void;
}) {
  return (
    <SectionCard
      eyebrow="Session Intelligence"
      title="Local session summary"
      description="This summarizes browser-local chat state only. It is not written to memory or Supabase."
    >
      <div className="mt-4 grid gap-x-5 sm:grid-cols-2">
        <Metric label="User turns" value={String(summary.userTurns)} />
        <Metric label="Assistant turns" value={String(summary.assistantTurns)} />
        <Metric label="Latest intent" value={summary.latestIntent} />
        <Metric label="Latest state source" value={summary.latestStateSource} />
        <Metric label="Read-only turns" value={summary.allTurnsReadOnly ? "yes" : "no"} />
        <Metric label="Errors" value={String(summary.errorTurns)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopySummary}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
        >
          Copy current session summary
        </button>
        <button
          type="button"
          onClick={onCopyProofReport}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Copy Proof Report
        </button>
      </div>
      {clipboardMessage && <p className="mt-3 text-sm text-muted">{clipboardMessage}</p>}
    </SectionCard>
  );
}

function RecommendedNextStepCard({ command }: { command: ConsoleCommand }) {
  return (
    <SectionCard eyebrow="Recommended Next Step" title={command.title} description={command.detail}>
      <pre className="mt-4 max-h-44 overflow-x-auto rounded-md border border-border bg-background/70 p-3 text-xs leading-5 text-muted">
        <code>{command.command}</code>
      </pre>
    </SectionCard>
  );
}

function ConversationShell({
  turns,
  prompt,
  setPrompt,
  onAsk,
  onClear,
  onSuggestedPrompt,
  followUps,
  onFollowUp,
  onSpeakLatest,
  onStopSpeaking,
  browserTtsAvailable,
  browserTtsStatus,
  isAsking,
  lastResponse,
}: {
  turns: ConversationDisplayTurn[];
  prompt: string;
  setPrompt: (value: string) => void;
  onAsk: () => void | Promise<void>;
  onClear: () => void;
  onSuggestedPrompt: (value: string) => void;
  followUps: FollowUpAction[];
  onFollowUp: (action: FollowUpAction) => void | Promise<void>;
  onSpeakLatest: () => void;
  onStopSpeaking: () => void;
  browserTtsAvailable: boolean;
  browserTtsStatus: BrowserSpeechStatus;
  isAsking: boolean;
  lastResponse: ConversationTurnResponse | null;
}) {
  const canAsk = prompt.trim().length > 0 && !isAsking;
  const canSpeak = Boolean(lastResponse?.response) && browserTtsAvailable && browserTtsStatus !== "speaking";
  const speakButtonLabel = browserTtsStatus === "checking" || browserTtsAvailable
    ? "Speak response"
    : "Browser TTS unavailable";

  return (
    <section className="rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Conversation</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Ask Delta</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Ask Delta about what it has learned, what it would do next, or what parts of the system are ready.
          </p>
        </div>
        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
          read-only API
        </span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestedPrompt(suggestion)}
            className="rounded-full border border-border/80 bg-background/50 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div className="mt-5 max-h-[34rem] space-y-3 overflow-y-auto rounded-lg border border-border/70 bg-background/45 p-3">
        {turns.map((turn, index) => (
          <div
            key={turn.id}
            className={
              turn.role === "user"
                ? "max-w-[86%] rounded-lg border border-border/70 bg-card px-4 py-3 text-sm leading-6 text-muted"
                : turn.role === "system"
                  ? "max-w-[88%] rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-700 dark:text-amber-300"
                  : "ml-auto max-w-[88%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-white shadow-sm"
            }
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide opacity-80">
              <span>{turn.role === "delta" ? "Delta" : turn.role}</span>
              <span>{turn.orderLabel || `Turn ${index + 1}`}</span>
            </div>
            <p>{turn.content}</p>
            {turn.metadata && (
              <details className="mt-3 rounded-md border border-white/20 bg-white/10 p-2 text-xs text-white/85">
                <summary className="cursor-pointer font-medium">Read-only response</summary>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  <span>No memory writes</span>
                  <span>No TTS</span>
                  <span>No notification</span>
                  <span>{sourceSummary(turn.metadata.state_source)}</span>
                  <span>{intentSummary(turn.metadata.intent)}</span>
                </div>
              </details>
            )}
          </div>
        ))}
        {isAsking && (
          <div className="ml-auto max-w-[86%] rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-muted">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Delta</div>
            Reading Behavioral OS state...
          </div>
        )}
      </div>
      <FollowUpSuggestions items={followUps} onRun={onFollowUp} />
      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (canAsk) void onAsk();
        }}
      >
        <div className="rounded-lg border border-border/80 bg-background/45 p-3">
          <label htmlFor="delta-os-input" className="text-xs uppercase tracking-wide text-muted">
            Ask Delta prompt
          </label>
          <textarea
            id="delta-os-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canAsk) void onAsk();
              }
            }}
            className="mt-2 min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!canAsk}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/40"
          >
            {isAsking ? "Asking Delta" : "Ask Delta"}
          </button>
          <button disabled className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted">
            Voice input coming soon
          </button>
          {browserTtsStatus === "speaking" ? (
            <button
              type="button"
              onClick={onStopSpeaking}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-background"
            >
              Stop speaking
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSpeak}
              onClick={onSpeakLatest}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            >
              {speakButtonLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="ml-auto rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-border hover:bg-background"
          >
            Clear session
          </button>
        </div>
      </form>
      <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-4">
        <span>read-only API</span>
        <span>no automatic memory writes</span>
        <span>memory writes: {lastResponse ? String(lastResponse.memory_writes) : "false"}</span>
        <span>TTS: {lastResponse?.tts ? "enabled" : "false"}</span>
        <span>browser TTS: {browserTtsStatus}</span>
        <span>local browser playback only</span>
        <span>no backend TTS</span>
        <span>notification: {lastResponse?.notification ? "enabled" : "false"}</span>
        <span>state source: {lastResponse?.state_source || "pending"}</span>
        <span>no always-on listening</span>
      </div>
    </section>
  );
}

function BehavioralStateCard({
  state,
  onRefresh,
  isRefreshing,
  lastRefreshedAt,
}: {
  state: ConsoleBehavioralState;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefreshedAt: string;
}) {
  const interpretation = stateInterpretation(state);

  return (
    <SectionCard
      eyebrow="Behavioral State"
      title={interpretation.pattern}
      description={interpretation.summary}
      action={
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing" : "Refresh OS State"}
        </button>
      }
    >
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current rule</p>
          <p className="mt-1 text-sm leading-6 text-foreground">{interpretation.currentRule}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Why this rule</p>
          <p className="mt-1 text-sm leading-6 text-muted">{interpretation.why}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Safety status</p>
          <p className="mt-1 text-sm leading-6 text-muted">{interpretation.safety}</p>
        </div>
        <p className="rounded-md border border-border/80 bg-background/50 p-3 text-sm leading-6 text-muted">
          {interpretation.source} Last refreshed: {lastRefreshedAt}.
        </p>
      </div>
      <details className="mt-4 rounded-md border border-border/80 bg-background/40 p-3">
        <summary className="cursor-pointer text-sm font-semibold">View raw state details</summary>
        <div className="mt-3 grid gap-x-5 sm:grid-cols-2 xl:grid-cols-1">
          <Metric label="Last outcome" value={state.lastOutcome} />
          <Metric label="Tone" value={state.tone} />
          <Metric label="Cooldown" value={`${state.cooldownMinutes} minutes`} />
          <Metric label="Success rate" value={state.successRate} />
          <Metric label="Delivered count" value={state.deliveredCount} />
          <Metric label="Current cooldown" value={state.currentCooldown} />
          <Metric label="Suppression" value={state.suppression} />
          <Metric label="Simulated" value={state.stateIsSimulated ? "yes" : "no"} />
        </div>
      </details>
    </SectionCard>
  );
}

function readinessState(condition: boolean | undefined, fallback: ReadinessStatus = "unavailable"): ReadinessStatus {
  if (condition === true) return "ready";
  if (condition === false) return fallback;
  return "not_checked";
}

function ReadinessRow({
  label,
  detail,
  status,
}: {
  label: string;
  detail: string;
  status: ReadinessStatus;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/80 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{detail}</p>
      </div>
      <ReadinessChip status={status} />
    </div>
  );
}

function LiveSystemReadiness({
  readiness,
  loadState,
  error,
  lastCheckedAt,
  onRefresh,
}: {
  readiness: SystemReadinessResponse | null;
  loadState: "checking" | "ready" | "fallback";
  error: string;
  lastCheckedAt: string;
  onRefresh: () => void;
}) {
  const backendStatus = readiness ? readinessState(readiness.backend.reachable) : loadState === "fallback" ? "fallback" : "not_checked";
  const supabaseStatus = readiness ? readinessState(readiness.supabase.reachable) : loadState === "fallback" ? "fallback" : "not_checked";
  const schemaStatus = readiness
    ? readiness.supabase.schema_status === "behavioral_os_ready"
      ? "ready"
      : "unavailable"
    : loadState === "fallback"
      ? "fallback"
      : "not_checked";
  const conversationStatus = readiness ? readinessState(readiness.conversation.api_available && readiness.conversation.read_only) : "not_checked";
  const proofUserStatus = readiness ? readinessState(readiness.proof_user.state_readable) : "not_checked";
  const statusJsonStatus = readiness
    ? readiness.status_json.available
      ? readiness.status_json.freshness === "fresh"
        ? "ready"
        : "not_checked"
      : "unavailable"
    : "not_checked";
  const proofUserDetail =
    readiness && readiness.proof_user.state_readable
      ? `Readable for ${readiness.proof_user.user_id}: ${readiness.proof_user.last_outcome || "unknown"}, ${readiness.proof_user.tone || "unknown"} tone, cooldown ${readiness.proof_user.cooldown_minutes ?? "unknown"}, success ${readiness.proof_user.success_rate ?? "unknown"}.`
      : readiness
        ? readiness.proof_user.reason || "Proof user state is unavailable."
        : "Proof user has not been checked yet.";

  return (
    <SectionCard
      eyebrow="Live System Readiness"
      title="Can Delta run safely right now?"
      description="Read-only checks only. This panel does not record audio, run TTS, send notifications, or write memory."
      action={
        <button
          type="button"
          onClick={onRefresh}
          disabled={loadState === "checking"}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadState === "checking" ? "Checking" : "Refresh readiness"}
        </button>
      }
    >

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <ReadinessChip status={backendStatus} label={`backend ${backendStatus.replace("_", " ")}`} />
        <ReadinessChip status={supabaseStatus} label={`supabase ${supabaseStatus.replace("_", " ")}`} />
        <ReadinessChip status={schemaStatus} label={`schema ${schemaStatus.replace("_", " ")}`} />
        <ReadinessChip status={conversationStatus} label={`conversation ${conversationStatus.replace("_", " ")}`} />
      </div>

      <p className="mt-3 text-xs text-muted">Last checked: {lastCheckedAt}</p>
      {error && (
        <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm leading-6 text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="mt-4 rounded-md border border-border/80 bg-background/50 p-3 text-sm leading-6 text-muted">
        {proofUserDetail}
      </p>

      <details className="mt-4 rounded-md border border-border/80 bg-background/40 p-3">
        <summary className="cursor-pointer text-sm font-semibold">View readiness details</summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Connected services</p>
            <ReadinessRow
              label="Backend"
              detail={readiness ? `Status: ${readiness.backend.status}.` : "Backend readiness has not been checked yet."}
              status={backendStatus}
            />
            <ReadinessRow
              label="Supabase"
              detail={
                readiness
                  ? `Configured: ${readiness.supabase.configured ? "yes" : "no"}. Reachable: ${readiness.supabase.reachable ? "yes" : "no"}.`
                  : "Supabase readiness has not been checked yet."
              }
              status={supabaseStatus}
            />
            <ReadinessRow
              label="Behavioral OS schema"
              detail={readiness ? `Schema status: ${readiness.supabase.schema_status}.` : "Schema readiness has not been checked yet."}
              status={schemaStatus}
            />
            <ReadinessRow
              label="Conversation API"
              detail={
                readiness
                  ? `Typed API: ${readiness.conversation.api_available ? "available" : "unavailable"}. Read-only: ${readiness.conversation.read_only ? "yes" : "no"}.`
                  : "Conversation API readiness has not been checked yet."
              }
              status={conversationStatus}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Proof user and local runtime</p>
            <ReadinessRow label="Proof user state" detail={proofUserDetail} status={proofUserStatus} />
            <ReadinessRow
              label="Status JSON"
              detail={
                readiness
                  ? `${readiness.status_json.freshness}; ${readiness.status_json.path || "no path reported"}.`
                  : "Local status JSON has not been checked yet."
              }
              status={statusJsonStatus}
            />
            <ReadinessRow
              label="Mic/TTS/notification checks"
              detail="Available from local terminal commands only; the web endpoint does not record, speak, or notify."
              status="terminal_only"
            />
            <ReadinessRow
              label="Browser voice input"
              detail="Browser mic, wake word, and always-on mode are not built. Browser TTS preview is user-triggered playback only."
              status="not_built"
            />
          </div>
        </div>
      </details>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReadinessRow
          label="Side effects default"
          detail={readiness ? readiness.safety.side_effects_default : "disabled"}
          status="ready"
        />
        <ReadinessRow
          label="Memory writes default"
          detail={readiness ? readiness.safety.memory_writes_default : "disabled"}
          status="ready"
        />
        <ReadinessRow
          label="Explicit confirmation"
          detail={readiness?.safety.requires_explicit_confirmation ? "Required for real side effects." : "Not checked."}
          status={readiness?.safety.requires_explicit_confirmation ? "ready" : "not_checked"}
        />
        <ReadinessRow
          label="Low-quality audio"
          detail={readiness?.safety.low_quality_audio_gated ? "Gated before persistence." : "Not checked."}
          status={readiness?.safety.low_quality_audio_gated ? "ready" : "not_checked"}
        />
      </div>
    </SectionCard>
  );
}

function VoiceRuntimeCard({ items }: { items: OSConsoleFixture["voiceRuntime"] }) {
  return (
    <SectionCard eyebrow="Voice Runtime" title="Input and output readiness">
      <div className="mt-4 divide-y divide-border/80">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
            </div>
            <StatusChip status={item.status} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function RecentInterventions({ items }: { items: RecentInterventionProof[] }) {
  return (
    <SectionCard
      eyebrow="Recent Interventions"
      title="Proof rows and fallback cards"
      description="Backend data appears first when available. Fallback cards remain labeled and should not be mistaken for a live stream."
    >
      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <article key={`${item.title}-${item.feedback}`} className="rounded-lg border border-border/80 bg-background/50 p-4">
            <p className="text-sm font-semibold">{item.title}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Method</dt>
                <dd className="mt-1 font-medium">{item.method}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Delivery</dt>
                <dd className="mt-1 font-medium">{item.deliveryStatus}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Feedback</dt>
                <dd className="mt-1 font-medium">{item.feedback}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm leading-6 text-muted">{item.learnedChange}</p>
            <p className="mt-3 inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted">{item.provenance}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function SafetyGates({ items }: { items: OSConsoleFixture["safetyGates"] }) {
  return (
    <SectionCard eyebrow="Safety Gates" title="Designed to avoid annoying behavior">
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-lg border border-border/80 bg-background/50 p-4">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

function ProofLadder({ items }: { items: OSConsoleFixture["proofLadder"] }) {
  const groups = [
    {
      label: "Behavioral OS",
      items: items.filter((item) => ["Scripted loop", "Persistence", "Negative feedback"].includes(item.label)),
    },
    {
      label: "Voice and input",
      items: items.filter((item) => ["Notification", "TTS", "Live mic persistence", "Live mic notification"].includes(item.label)),
    },
    {
      label: "Conversation",
      items: items.filter((item) => ["Typed conversation", "Typed conversation TTS", "Live conversation", "Live conversation TTS"].includes(item.label)),
    },
    {
      label: "Not Built Yet",
      items: items.filter((item) => ["Always-on"].includes(item.label)),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <SectionCard eyebrow="Proof Ladder" title="What is proven versus still gated">
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.label} className="rounded-lg border border-border/80 bg-background/50 p-4">
            <p className="text-sm font-semibold">{group.label}</p>
            <div className="mt-3 space-y-3">
              {group.items.map((item) => (
                <div key={item.label} className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold">{item.label}</h3>
                    <StatusChip status={item.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function HeroStatus({
  environment,
  readiness,
  readinessLoadState,
  onOpenPalette,
  onRefreshReadiness,
}: {
  environment: ConsoleEnvironment;
  readiness: SystemReadinessResponse | null;
  readinessLoadState: "checking" | "ready" | "fallback";
  onOpenPalette: () => void;
  onRefreshReadiness: () => void;
}) {
  const backendStatus = readiness ? readinessState(readiness.backend.reachable) : readinessLoadState === "fallback" ? "fallback" : "not_checked";
  const supabaseStatus = readiness ? readinessState(readiness.supabase.reachable) : readinessLoadState === "fallback" ? "fallback" : "not_checked";
  const schemaStatus = readiness
    ? readiness.supabase.schema_status === "behavioral_os_ready"
      ? "ready"
      : "unavailable"
    : readinessLoadState === "fallback"
      ? "fallback"
      : "not_checked";
  const conversationStatus = readiness ? readinessState(readiness.conversation.api_available && readiness.conversation.read_only) : "not_checked";

  return (
    <section className="border-b border-border/80 bg-card/90">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Delta OS</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Delta OS Console</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted md:text-base">
              Local Behavioral OS and conversation runtime cockpit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefreshReadiness}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background"
            >
              Refresh readiness
            </button>
            <button
              type="button"
              onClick={onOpenPalette}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Command Palette
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <ReadinessChip status={backendStatus} label={`backend ${backendStatus.replace("_", " ")}`} />
          <ReadinessChip status={supabaseStatus} label={`supabase ${supabaseStatus.replace("_", " ")}`} />
          <ReadinessChip status={schemaStatus} label={`schema ${schemaStatus.replace("_", " ")}`} />
          <ReadinessChip status={conversationStatus} label={`conversation ${conversationStatus.replace("_", " ")}`} />
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            Data source: {environment.dataSource}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            Side effects: {environment.sideEffects}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            Updated: {environment.lastUpdated}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function OSConsole({
  userId = OS_CONSOLE_USER_ID,
  clipboardWriter,
  speechControls,
}: {
  userId?: string;
  clipboardWriter?: (value: string) => Promise<void>;
  speechControls?: BrowserSpeechControls;
}) {
  const [consoleData, setConsoleData] = useState<OSConsoleFixture>(OS_CONSOLE_FALLBACK);
  const [loadState, setLoadState] = useState<"checking" | "backend" | "fallback">("checking");
  const [prompt, setPrompt] = useState("what did you learn about late caffeine?");
  const [conversationTurns, setConversationTurns] = useState<ConversationDisplayTurn[]>(initialConversationTurns);
  const [isAskingDelta, setIsAskingDelta] = useState(false);
  const [lastConversationResponse, setLastConversationResponse] = useState<ConversationTurnResponse | null>(null);
  const [conversationSessionId, setConversationSessionId] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState("not refreshed");
  const [readiness, setReadiness] = useState<SystemReadinessResponse | null>(null);
  const [readinessLoadState, setReadinessLoadState] = useState<"checking" | "ready" | "fallback">("checking");
  const [readinessError, setReadinessError] = useState("");
  const [readinessCheckedAt, setReadinessCheckedAt] = useState("not checked");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [clipboardMessage, setClipboardMessage] = useState("");
  const [resolvedSpeechControls, setResolvedSpeechControls] = useState<BrowserSpeechControls | null>(null);
  const [browserTtsStatus, setBrowserTtsStatus] = useState<BrowserSpeechStatus>("checking");
  const [activeView, setActiveView] = useState<ConsoleView>("chat");

  const loadStatus = useCallback(async (signal?: AbortSignal) => {
    setLoadState("checking");
    try {
      const response = await fetch(`${DELTA_API_URL}/bedroom-copilot/${userId}/status`, {
        signal,
      });
      if (!response.ok) throw new Error("backend status unavailable");
      const payload = await response.json() as BackendStatusPayload;
      setConsoleData(mapBackendToConsole(payload));
      setLoadState("backend");
    } catch {
      setConsoleData({
        ...OS_CONSOLE_FALLBACK,
        environment: {
          ...OS_CONSOLE_FALLBACK.environment,
          backend: "unavailable",
          environment: "local",
          lastUpdated: "fallback fixture",
          dataSource: "fallback",
        },
      });
      setLoadState("fallback");
    } finally {
      setLastRefreshedAt(new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    }
  }, [userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const controls = speechControls ?? createBrowserSpeechControls();
      setResolvedSpeechControls(controls);
      setBrowserTtsStatus(controls.available ? "idle" : "unavailable");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [speechControls]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2200);

    void loadStatus(controller.signal).finally(() => window.clearTimeout(timeoutId));
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadStatus]);

  const loadReadiness = useCallback(async () => {
    setReadinessLoadState("checking");
    setReadinessError("");
    try {
      const result = await getSystemReadiness();
      setReadiness(result);
      setReadinessLoadState("ready");
    } catch (err) {
      setReadiness(null);
      setReadinessLoadState("fallback");
      setReadinessError(err instanceof Error ? err.message : "System readiness unavailable.");
    } finally {
      setReadinessCheckedAt(new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    }
  }, []);

  useEffect(() => {
    void loadReadiness();
  }, [loadReadiness]);

  useEffect(() => {
    const openPalette = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", openPalette);
    return () => window.removeEventListener("keydown", openPalette);
  }, []);

  const copyText = useCallback(async (value: string, label: string) => {
    if (clipboardWriter) {
      await clipboardWriter(value);
      setClipboardMessage(`${label} copied.`);
      return;
    }
    const clipboard = typeof window !== "undefined" ? window.navigator.clipboard : undefined;
    if (!clipboard) {
      setClipboardMessage("Clipboard unavailable in this browser.");
      return;
    }
    await clipboard.writeText(value);
    setClipboardMessage(`${label} copied.`);
  }, [clipboardWriter]);

  const speakLatestResponse = useCallback(() => {
    if (!lastConversationResponse?.response || !resolvedSpeechControls?.available) {
      setBrowserTtsStatus("unavailable");
      return;
    }
    const status = resolvedSpeechControls.speak(lastConversationResponse.response, {
      onStart: () => setBrowserTtsStatus("speaking"),
      onEnd: () => setBrowserTtsStatus("finished"),
      onError: () => setBrowserTtsStatus("failed"),
    });
    setBrowserTtsStatus(status);
  }, [lastConversationResponse, resolvedSpeechControls]);

  const stopSpeaking = useCallback(() => {
    if (!resolvedSpeechControls) {
      setBrowserTtsStatus("unavailable");
      return;
    }
    const status = resolvedSpeechControls.cancel();
    setBrowserTtsStatus(status);
  }, [resolvedSpeechControls]);

  const dataSourceLabel = useMemo(() => {
    if (loadState === "checking") return "Checking local backend. Fallback data is ready if unavailable.";
    if (loadState === "backend") return "Showing read-only backend status for the demo user.";
    return "Showing labeled fallback fixture because the backend is unavailable.";
  }, [loadState]);

  const askDelta = async (messageOverride?: string) => {
    const message = (messageOverride ?? prompt).trim();
    if (!message) return;
    setIsAskingDelta(true);
    setPrompt("");
    setConversationTurns((current) => [
      ...current,
      makeTurn("user", message, current.filter((turn) => turn.role === "user").length + 1),
    ]);
    try {
      const localResponse = localClarificationResponse(message, consoleData.behavioralState, lastConversationResponse?.intent || "none yet");
      if (localResponse) {
        const result = {
          ...localResponse,
          user_id: userId,
          session_id: conversationSessionId || "local-explainability",
        };
        setConversationSessionId(result.session_id);
        setLastConversationResponse(result);
        setConversationTurns((current) => [
          ...current,
          makeTurn("delta", result.response, current.filter((turn) => turn.role === "delta").length + 1, result),
        ]);
        return;
      }
      const result = await askDeltaConversation({
        userId,
        message,
        ...(conversationSessionId ? { sessionId: conversationSessionId } : {}),
      });
      setConversationSessionId(result.session_id);
      setLastConversationResponse(result);
      setConversationTurns((current) => [
        ...current,
        makeTurn("delta", result.response, current.filter((turn) => turn.role === "delta").length + 1, result),
      ]);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `Backend conversation unavailable: ${err.message}`
          : "Backend conversation unavailable.";
      setConversationTurns((current) => [
        ...current,
        makeTurn("system", errorMessage, current.filter((turn) => turn.role === "system").length + 1),
      ]);
    } finally {
      setIsAskingDelta(false);
    }
  };

  const clearConversation = () => {
    setConversationTurns(initialConversationTurns());
    setConversationSessionId(null);
    setLastConversationResponse(null);
    setPrompt("what did you learn about late caffeine?");
  };

  const chooseSuggestedPrompt = (value: string) => {
    setPrompt(value);
  };

  const sessionSummary = useMemo(
    () => summarizeSession(conversationTurns, lastConversationResponse),
    [conversationTurns, lastConversationResponse],
  );

  const latestTurn = conversationTurns[conversationTurns.length - 1];
  const latestSystemError = latestTurn?.role === "system" ? latestTurn.content : null;
  const followUps = useMemo(
    () => followUpsForResponse(lastConversationResponse, latestSystemError),
    [lastConversationResponse, latestSystemError],
  );

  const proofReport = useMemo(
    () => buildProofReportMarkdown({
      readiness,
      readinessLoadState,
      consoleData,
      sessionSummary,
    }),
    [readiness, readinessLoadState, consoleData, sessionSummary],
  );

  const sessionSummaryMarkdown = useMemo(
    () => buildSessionSummaryMarkdown(sessionSummary),
    [sessionSummary],
  );

  const commandCards = useMemo(() => {
    if (readiness?.backend.reachable) {
      return [
        COMMAND_CENTER_COMMANDS[2],
        COMMAND_CENTER_COMMANDS[1],
        COMMAND_CENTER_COMMANDS[0],
        COMMAND_CENTER_COMMANDS[3],
      ];
    }
    return COMMAND_CENTER_COMMANDS;
  }, [readiness]);

  const recommendedCommand = useMemo<ConsoleCommand>(() => {
    if (!readiness || readinessLoadState === "fallback" || !readiness.backend.reachable) {
      return COMMAND_CENTER_COMMANDS[0];
    }
    if (readiness.status_json.freshness !== "fresh") {
      return {
        title: "Refresh readiness before the next validation",
        detail: "Status JSON is not fresh. Use the read-only readiness refresh before trusting local cockpit state.",
        command: "curl -s http://127.0.0.1:8000/system/readiness",
      };
    }
    if (lastConversationResponse) {
      return {
        title: "Ask one more typed read-only question",
        detail: "The backend conversation API is reachable and the latest answer stayed read-only.",
        command: "Use /os Ask Delta or Command Palette to ask: What is still not built?",
      };
    }
    return {
      title: "Try a typed read-only OS Console question",
      detail: "Backend readiness is available. Validate the command center without mic, TTS, notification, or writes.",
      command: COMMAND_CENTER_COMMANDS[2].command,
    };
  }, [lastConversationResponse, readiness, readinessLoadState]);

  const runFollowUp = async (action: FollowUpAction) => {
    if (action.kind === "ask") {
      await askDelta(action.label);
    } else if (action.kind === "refresh_readiness") {
      await loadReadiness();
    } else if (action.kind === "copy_backend") {
      await copyText(COMMAND_CENTER_COMMANDS[0].command, "Backend start command");
    }
  };

  const commandPaletteActions: CommandPaletteAction[] = [
    {
      id: "ask-late-caffeine",
      title: "Ask: What did you learn about late caffeine?",
      detail: "Sends a typed read-only state inquiry to the backend conversation API.",
      run: () => askDelta("What did you learn about late caffeine?"),
      disabled: isAskingDelta,
    },
    {
      id: "ask-jarvis",
      title: "Ask: Can you talk like Jarvis yet?",
      detail: "Sends a capability inquiry without enabling voice output.",
      run: () => askDelta("Can you talk like Jarvis yet?"),
      disabled: isAskingDelta,
    },
    {
      id: "ask-monster",
      title: "Ask: Monster at 10 PM",
      detail: "Asks a hypothetical late-caffeine policy question.",
      run: () => askDelta("What would you do if I drank a Monster at 10 PM?"),
      disabled: isAskingDelta,
    },
    {
      id: "refresh-readiness",
      title: "Refresh readiness",
      detail: "Re-runs the read-only /system/readiness check.",
      run: loadReadiness,
    },
    {
      id: "refresh-os-state",
      title: "Refresh OS state",
      detail: "Re-fetches the read-only Behavioral OS status used by the state panel.",
      run: () => loadStatus(),
    },
    {
      id: "copy-backend",
      title: "Copy backend start command",
      detail: "Copies the local backend start command.",
      run: () => copyText(COMMAND_CENTER_COMMANDS[0].command, "Backend start command"),
    },
    {
      id: "copy-site",
      title: "Copy site start command",
      detail: "Copies the local site start command.",
      run: () => copyText(COMMAND_CENTER_COMMANDS[1].command, "Site start command"),
    },
    {
      id: "copy-api",
      title: "Copy conversation API curl command",
      detail: "Copies the read-only typed conversation API validation command.",
      run: () => copyText(COMMAND_CENTER_COMMANDS[2].command, "Conversation API command"),
    },
    {
      id: "copy-live-tts",
      title: "Copy live + TTS validation command",
      detail: "Copies the terminal-only command. It does not run from the web UI.",
      run: () => copyText(COMMAND_CENTER_COMMANDS[3].command, "Live + TTS validation command"),
    },
    {
      id: "speak-latest-response",
      title: "Speak latest Delta response",
      detail: "Uses browser speechSynthesis only. No backend TTS, notification, or writes.",
      run: speakLatestResponse,
      disabled: !lastConversationResponse || !resolvedSpeechControls?.available,
    },
    {
      id: "stop-speaking",
      title: "Stop speaking",
      detail: "Cancels current browser speech playback.",
      run: stopSpeaking,
      disabled: !resolvedSpeechControls?.available || browserTtsStatus !== "speaking",
    },
    {
      id: "clear-session",
      title: "Clear chat session",
      detail: "Clears browser-local chat state only.",
      run: clearConversation,
    },
    {
      id: "copy-proof-report",
      title: "Copy proof report",
      detail: "Copies a local markdown report from current readiness and proof state.",
      run: () => copyText(proofReport, "Proof report"),
    },
    {
      id: "copy-session-summary",
      title: "Copy current session summary",
      detail: "Copies a local summary of the browser-only transcript.",
      run: () => copyText(sessionSummaryMarkdown, "Session summary"),
    },
  ];

  const visibleViews = (
    <div className="mx-auto max-w-7xl px-6 pt-5">
      <div className="flex flex-wrap gap-2 rounded-lg border border-border/80 bg-card/70 p-2">
        {CONSOLE_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id)}
            className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
              activeView === view.id
                ? "bg-primary text-white"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
            aria-pressed={activeView === view.id}
          >
            <span className="block font-semibold">{view.label}</span>
            <span className="hidden text-xs opacity-80 sm:block">{view.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <CommandPalette
        open={commandPaletteOpen}
        actions={commandPaletteActions}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <HeroStatus
        environment={consoleData.environment}
        readiness={readiness}
        readinessLoadState={readinessLoadState}
        onOpenPalette={() => setCommandPaletteOpen(true)}
        onRefreshReadiness={() => void loadReadiness()}
      />
      {visibleViews}
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <SafetyStrip browserTtsStatus={browserTtsStatus} />
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
          {dataSourceLabel} Typed Ask Delta is wired to the read-only backend conversation runtime; voice input stays disabled and browser speech preview is user-triggered only.
        </div>

        {activeView === "chat" && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ConversationShell
              turns={conversationTurns}
              prompt={prompt}
              setPrompt={setPrompt}
              onAsk={askDelta}
              onClear={clearConversation}
              onSuggestedPrompt={chooseSuggestedPrompt}
              followUps={followUps}
              onFollowUp={runFollowUp}
              onSpeakLatest={speakLatestResponse}
              onStopSpeaking={stopSpeaking}
              browserTtsAvailable={resolvedSpeechControls?.available ?? false}
              browserTtsStatus={browserTtsStatus}
              isAsking={isAskingDelta}
              lastResponse={lastConversationResponse}
            />

            <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
              <BehavioralStateCard
                state={consoleData.behavioralState}
                onRefresh={() => void loadStatus()}
                isRefreshing={loadState === "checking"}
                lastRefreshedAt={lastRefreshedAt}
              />
              <LiveSystemReadiness
                readiness={readiness}
                loadState={readinessLoadState}
                error={readinessError}
                lastCheckedAt={readinessCheckedAt}
                onRefresh={() => void loadReadiness()}
              />
            </aside>
          </div>
        )}

        {activeView === "state" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <BehavioralStateCard
              state={consoleData.behavioralState}
              onRefresh={() => void loadStatus()}
              isRefreshing={loadState === "checking"}
              lastRefreshedAt={lastRefreshedAt}
            />
            <SectionCard
              eyebrow="Plain-English Glossary"
              title="What the labels mean"
              description="These terms are displayed read-only. They do not trigger memory writes or delivery."
            >
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
                <p><span className="font-semibold text-foreground">good_call:</span> previous guidance was judged useful or appropriate.</p>
                <p><span className="font-semibold text-foreground">Cooldown:</span> how long Delta would wait before another similar nudge.</p>
                <p><span className="font-semibold text-foreground">Suppression:</span> whether Delta should avoid this pattern entirely for a period.</p>
                <p><span className="font-semibold text-foreground">Success rate:</span> how often recorded feedback has been positive for this pattern.</p>
                <p><span className="font-semibold text-foreground">Persisted state:</span> saved system data loaded read-only into the console.</p>
              </div>
            </SectionCard>
          </div>
        )}

        {activeView === "readiness" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <LiveSystemReadiness
              readiness={readiness}
              loadState={readinessLoadState}
              error={readinessError}
              lastCheckedAt={readinessCheckedAt}
              onRefresh={() => void loadReadiness()}
            />
            <SafetyGates items={consoleData.safetyGates} />
          </div>
        )}

        {activeView === "proof" && (
          <div className="space-y-6">
            <ProofLadder items={consoleData.proofLadder} />
            <RecentInterventions items={consoleData.recentInterventions} />
            <VoiceRuntimeCard items={consoleData.voiceRuntime} />
          </div>
        )}

        {activeView === "developer" && (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <CollapsibleSection
                title="Developer Commands"
                description="Terminal commands stay available, but they are separate from the normal chat flow."
                defaultOpen
              >
                <div className="grid gap-4">
                  {commandCards.map((command) => (
                    <CommandCard key={command.title} {...command} />
                  ))}
                </div>
              </CollapsibleSection>
              <RecommendedNextStepCard command={recommendedCommand} />
            </div>
            <div className="space-y-6">
              <SectionCard
                eyebrow="Response Metadata"
                title="Latest details"
                description="Raw route details stay here for audit instead of under every message."
              >
                <div className="mt-4 grid gap-3 text-sm leading-6 text-muted sm:grid-cols-2">
                  <p><span className="font-semibold text-foreground">Intent:</span> {intentSummary(lastConversationResponse?.intent || "none yet")}</p>
                  <p><span className="font-semibold text-foreground">State source:</span> {sourceSummary(lastConversationResponse?.state_source || "pending")}</p>
                  <p><span className="font-semibold text-foreground">Writes:</span> {lastConversationResponse?.memory_writes ? "would write" : "none"}</p>
                  <p><span className="font-semibold text-foreground">Notification:</span> {lastConversationResponse?.notification ? "enabled" : "disabled"}</p>
                  <p><span className="font-semibold text-foreground">TTS:</span> {lastConversationResponse?.tts ? "enabled" : "disabled"}</p>
                  <p><span className="font-semibold text-foreground">Side effects:</span> {lastConversationResponse?.side_effect_status || "none"}</p>
                </div>
              </SectionCard>
            <SessionSummaryCard
              summary={sessionSummary}
              clipboardMessage={clipboardMessage}
              onCopySummary={() => void copyText(sessionSummaryMarkdown, "Session summary")}
              onCopyProofReport={() => void copyText(proofReport, "Proof report")}
            />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
