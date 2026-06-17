"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DELTA_API_URL } from "@/lib/api";
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

const SUGGESTED_PROMPTS = [
  "What did you learn about late caffeine?",
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

function SystemBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-border pl-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
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

function CommandCard({ title, detail, command }: { title: string; detail: string; command: string }) {
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
        </div>
        <button
          type="button"
          onClick={copyCommand}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-primary/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-background p-4 text-xs leading-5 text-muted">
        <code>{command}</code>
      </pre>
    </div>
  );
}

function ConversationShell({
  turns,
  prompt,
  setPrompt,
  onAsk,
  onClear,
  onSuggestedPrompt,
  isAsking,
  lastResponse,
}: {
  turns: ConversationDisplayTurn[];
  prompt: string;
  setPrompt: (value: string) => void;
  onAsk: () => void | Promise<void>;
  onClear: () => void;
  onSuggestedPrompt: (value: string) => void;
  isAsking: boolean;
  lastResponse: ConversationTurnResponse | null;
}) {
  const canAsk = prompt.trim().length > 0 && !isAsking;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Conversation</p>
          <h2 className="mt-2 text-2xl font-semibold">Ask Delta without writing memory</h2>
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
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-background"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
        {turns.map((turn, index) => (
          <div
            key={turn.id}
            className={
              turn.role === "user"
                ? "max-w-[82%] rounded-lg bg-background px-4 py-3 text-sm leading-6 text-muted"
                : turn.role === "system"
                  ? "max-w-[88%] rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-700 dark:text-amber-300"
                  : "ml-auto max-w-[86%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-white"
            }
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide opacity-80">
              <span>{turn.role === "delta" ? "Delta" : turn.role}</span>
              <span>{turn.orderLabel || `Turn ${index + 1}`}</span>
            </div>
            <p>{turn.content}</p>
            {turn.metadata && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/30 px-2 py-1">read-only</span>
                <span className="rounded-full border border-white/30 px-2 py-1">
                  no writes: {String(!turn.metadata.memory_writes)}
                </span>
                <span className="rounded-full border border-white/30 px-2 py-1">
                  no TTS: {String(!turn.metadata.tts)}
                </span>
                <span className="rounded-full border border-white/30 px-2 py-1">
                  no notification: {String(!turn.metadata.notification)}
                </span>
                <span className="rounded-full border border-white/30 px-2 py-1">
                  state: {turn.metadata.state_source}
                </span>
                <span className="rounded-full border border-white/30 px-2 py-1">
                  intent: {turn.metadata.intent}
                </span>
              </div>
            )}
          </div>
        ))}
        {isAsking && (
          <div className="ml-auto max-w-[86%] rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 text-muted">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Delta</div>
            Reading Behavioral OS state...
          </div>
        )}
      </div>
      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (canAsk) void onAsk();
        }}
      >
        <div className="rounded-md border border-border p-3">
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
            className="mt-2 min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-muted outline-none"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!canAsk}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/40"
          >
            {isAsking ? "Asking Delta" : "Ask Delta"}
          </button>
          <button disabled className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted">
            Voice input coming soon
          </button>
          <button disabled className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted">
            Speak response pending validation
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-background"
          >
            Clear session
          </button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full border border-border px-3 py-1">read-only API</span>
        <span className="rounded-full border border-border px-3 py-1">no automatic memory writes</span>
        <span className="rounded-full border border-border px-3 py-1">
          memory writes: {lastResponse ? String(lastResponse.memory_writes) : "false"}
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          TTS: {lastResponse?.tts ? "enabled" : "false"}
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          notification: {lastResponse?.notification ? "enabled" : "false"}
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          state source: {lastResponse?.state_source || "pending"}
        </span>
        <span className="rounded-full border border-border px-3 py-1">no always-on listening</span>
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
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Behavioral State</p>
          <h2 className="mt-2 text-2xl font-semibold">Late-caffeine loop</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing" : "Refresh OS State"}
        </button>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">
        Source: {state.stateSource}. Simulated: {state.stateIsSimulated ? "yes" : "no"}.
      </p>
      <p className="mt-1 text-xs text-muted">Last refreshed: {lastRefreshedAt}</p>
      <div className="mt-5 grid gap-x-6 sm:grid-cols-2">
        <Metric label="Last outcome" value={state.lastOutcome} />
        <Metric label="Tone" value={state.tone} />
        <Metric label="Cooldown" value={`${state.cooldownMinutes} minutes`} />
        <Metric label="Success rate" value={state.successRate} />
        <Metric label="Delivered count" value={state.deliveredCount} />
        <Metric label="Current cooldown" value={state.currentCooldown} />
        <Metric label="Suppression" value={state.suppression} />
      </div>
      <p className="mt-4 rounded-md border border-border p-3 text-sm leading-6 text-muted">
        {state.learnedRuleSummary}
      </p>
    </section>
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
    <div className="flex flex-col gap-2 border-t border-border py-3 sm:flex-row sm:items-start sm:justify-between">
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

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Live System Readiness</p>
          <h2 className="mt-2 text-2xl font-semibold">Can Delta run safely right now?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Read-only checks only. This panel does not record audio, run TTS, send notifications, or write memory.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loadState === "checking"}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadState === "checking" ? "Checking" : "Refresh readiness"}
        </button>
      </div>

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

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
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
          <ReadinessRow
            label="Proof user state"
            detail={
              readiness && readiness.proof_user.state_readable
                ? `Readable for ${readiness.proof_user.user_id}: ${readiness.proof_user.last_outcome || "unknown"}, ${readiness.proof_user.tone || "unknown"} tone, cooldown ${readiness.proof_user.cooldown_minutes ?? "unknown"}, success ${readiness.proof_user.success_rate ?? "unknown"}.`
                : readiness
                  ? readiness.proof_user.reason || "Proof user state is unavailable."
                  : "Proof user has not been checked yet."
            }
            status={proofUserStatus}
          />
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
            label="Browser voice controls"
            detail="Browser mic, browser TTS, wake word, and always-on mode are not built."
            status="not_built"
          />
        </div>
      </div>

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
    </section>
  );
}

function VoiceRuntimeCard({ items }: { items: OSConsoleFixture["voiceRuntime"] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">Voice Runtime</p>
      <h2 className="mt-2 text-2xl font-semibold">Input and output readiness</h2>
      <div className="mt-5 divide-y divide-border">
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
    </section>
  );
}

function RecentInterventions({ items }: { items: RecentInterventionProof[] }) {
  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Recent Interventions</p>
          <h2 className="mt-2 text-2xl font-semibold">Proof rows and fallback cards</h2>
        </div>
        <p className="max-w-lg text-sm leading-6 text-muted">
          Backend data appears first when available. Fallback cards remain labeled and should not be mistaken for a live stream.
        </p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <article key={`${item.title}-${item.feedback}`} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold">{item.title}</p>
            <dl className="mt-4 space-y-3 text-sm">
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
            <p className="mt-4 text-sm leading-6 text-muted">{item.learnedChange}</p>
            <p className="mt-4 rounded-full border border-border px-3 py-1 text-xs text-muted">{item.provenance}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SafetyGates({ items }: { items: OSConsoleFixture["safetyGates"] }) {
  return (
    <section>
      <p className="text-sm font-medium uppercase tracking-wide text-primary">Safety Gates</p>
      <h2 className="mt-2 text-2xl font-semibold">Designed to avoid annoying behavior</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProofLadder({ items }: { items: OSConsoleFixture["proofLadder"] }) {
  return (
    <section>
      <p className="text-sm font-medium uppercase tracking-wide text-primary">Proof Ladder</p>
      <h2 className="mt-2 text-2xl font-semibold">What is proven versus still gated</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <article key={item.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-sm font-semibold">{item.label}</h3>
              </div>
              <StatusChip status={item.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeroStatus({ environment }: { environment: ConsoleEnvironment }) {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Delta OS Console</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">Delta OS Console</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted md:text-lg">
              Local Behavioral OS and conversation runtime cockpit.
            </p>
          </div>
          <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted">
            Data source: <span className="font-semibold text-foreground">{environment.dataSource}</span>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <SystemBadge label="Environment" value={environment.environment} />
          <SystemBadge label="Backend" value={environment.backend} />
          <SystemBadge label="Supabase" value={environment.supabase} />
          <SystemBadge label="Voice readiness" value={environment.voiceReadiness} />
          <SystemBadge label="Side effects" value={environment.sideEffects} />
          <SystemBadge label="Last updated" value={environment.lastUpdated} />
        </div>
      </div>
    </section>
  );
}

export default function OSConsole({ userId = OS_CONSOLE_USER_ID }: { userId?: string }) {
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

  return (
    <main className="min-h-screen bg-background">
      <HeroStatus environment={consoleData.environment} />
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
          {dataSourceLabel} Typed Ask Delta is wired to the read-only backend conversation runtime; voice and speech controls stay disabled until separately validated for the web UI.
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <ConversationShell
            turns={conversationTurns}
            prompt={prompt}
            setPrompt={setPrompt}
            onAsk={askDelta}
            onClear={clearConversation}
            onSuggestedPrompt={chooseSuggestedPrompt}
            isAsking={isAskingDelta}
            lastResponse={lastConversationResponse}
          />
          <BehavioralStateCard
            state={consoleData.behavioralState}
            onRefresh={() => void loadStatus()}
            isRefreshing={loadState === "checking"}
            lastRefreshedAt={lastRefreshedAt}
          />
        </div>

        <LiveSystemReadiness
          readiness={readiness}
          loadState={readinessLoadState}
          error={readinessError}
          lastCheckedAt={readinessCheckedAt}
          onRefresh={() => void loadReadiness()}
        />
        <VoiceRuntimeCard items={consoleData.voiceRuntime} />
        <RecentInterventions items={consoleData.recentInterventions} />
        <SafetyGates items={consoleData.safetyGates} />
        <ProofLadder items={consoleData.proofLadder} />

        <section>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Next Safe Action</p>
          <h2 className="mt-2 text-2xl font-semibold">Run and validate the command center locally</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {commandCards.map((command) => (
              <CommandCard key={command.title} {...command} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
