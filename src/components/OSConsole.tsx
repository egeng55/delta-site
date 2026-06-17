"use client";

import { useEffect, useMemo, useState } from "react";
import { DELTA_API_URL } from "@/lib/api";
import {
  OS_CONSOLE_FALLBACK,
  OS_CONSOLE_USER_ID,
  type ConsoleBehavioralState,
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

const statusStyles: Record<ProofStatus, string> = {
  proven: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
  implemented: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "pending validation": "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "not built": "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
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

function ConversationShell() {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Conversation</p>
          <h2 className="mt-2 text-2xl font-semibold">Ask Delta without writing memory</h2>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          wireframe controls
        </span>
      </div>
      <div className="mt-5 space-y-3">
        <div className="max-w-[80%] rounded-lg bg-background px-4 py-3 text-sm leading-6 text-muted">
          What did you learn about late caffeine?
        </div>
        <div className="ml-auto max-w-[86%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-white">
          Your latest feedback was good_call. Delta is using a concise tone with a 105-minute cooldown.
        </div>
      </div>
      <div className="mt-5 rounded-md border border-border p-3">
        <label htmlFor="delta-os-input" className="text-xs uppercase tracking-wide text-muted">
          Local prompt
        </label>
        <textarea
          id="delta-os-input"
          disabled
          value="Conversation UI is not wired yet. Use the CLI command below for validated local runtime checks."
          readOnly
          className="mt-2 min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-muted outline-none"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled className="rounded-md bg-primary/50 px-4 py-2 text-sm font-medium text-white">
          Ask Delta
        </button>
        <button disabled className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted">
          Voice input
        </button>
        <button disabled className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted">
          Speak response
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <span className="rounded-full border border-border px-3 py-1">read-only by default</span>
        <span className="rounded-full border border-border px-3 py-1">no automatic memory writes</span>
        <span className="rounded-full border border-border px-3 py-1">no always-on listening</span>
      </div>
    </section>
  );
}

function BehavioralStateCard({ state }: { state: ConsoleBehavioralState }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">Behavioral State</p>
      <h2 className="mt-2 text-2xl font-semibold">Late-caffeine loop</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Source: {state.stateSource}. Simulated: {state.stateIsSimulated ? "yes" : "no"}.
      </p>
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

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2200);

    async function loadStatus() {
      try {
        const response = await fetch(`${DELTA_API_URL}/bedroom-copilot/${userId}/status`, {
          signal: controller.signal,
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
        window.clearTimeout(timeoutId);
      }
    }

    void loadStatus();
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [userId]);

  const dataSourceLabel = useMemo(() => {
    if (loadState === "checking") return "Checking local backend. Fallback data is ready if unavailable.";
    if (loadState === "backend") return "Showing read-only backend status for the demo user.";
    return "Showing labeled fallback fixture because the backend is unavailable.";
  }, [loadState]);

  return (
    <main className="min-h-screen bg-background">
      <HeroStatus environment={consoleData.environment} />
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-700 dark:text-amber-300">
          {dataSourceLabel} This console is a product shell: buttons are intentionally inert unless a validated CLI command is shown.
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <ConversationShell />
          <BehavioralStateCard state={consoleData.behavioralState} />
        </div>

        <VoiceRuntimeCard items={consoleData.voiceRuntime} />
        <RecentInterventions items={consoleData.recentInterventions} />
        <SafetyGates items={consoleData.safetyGates} />
        <ProofLadder items={consoleData.proofLadder} />

        <section>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Next Safe Action</p>
          <h2 className="mt-2 text-2xl font-semibold">Run the next validation from the CLI</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <CommandCard {...consoleData.nextSafeAction} />
            <CommandCard {...consoleData.followUpAction} />
          </div>
        </section>
      </div>
    </main>
  );
}
