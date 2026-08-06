"use client";

import { FormEvent, type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import {
  DELTA_HQ_OWNER_ID,
  type DeltaHqActivityEvent,
  type DeltaHqAgent,
  type DeltaHqDepartment,
  type DeltaHqDepartmentPerformancePanel,
  type DeltaHqEvolutionMilestone,
  type DeltaHqInitiative,
  type DeltaHqLineageTrackId,
  type DeltaHqOwnerReview,
  type DeltaHqSeverity,
  type DeltaHqSourceKind,
  type DeltaHqTrendVisualization,
  type DeltaHqViewModel,
} from "@/lib/deltaHqViewModel";
import { askDeltaConversation } from "@/lib/conversationApi";

type DeltaDesktopServiceStatus = {
  name: string;
  label: string;
  status: string;
  owner: string;
  pid: number | null;
  stoppable: boolean;
  healthUrl: string;
  error: string | null;
  logLines?: Array<{ timestamp: string; service: string; stream: string; line: string }>;
};

type DeltaDesktopStatus = {
  hqUrl?: string;
  consoleUrl?: string;
  generatedAt?: string;
  services?: {
    backend?: DeltaDesktopServiceStatus;
    site?: DeltaDesktopServiceStatus;
  };
  desktop?: {
    mode?: string;
    productionPathStatus?: string;
    serviceManagerEnabled?: boolean;
    serviceManagerDisabledReason?: string | null;
  };
  safety?: Record<string, boolean>;
};

type DeltaDesktopBridge = {
  copyText?: (value: string) => Promise<boolean>;
  openHqInBrowser?: () => Promise<boolean>;
  openExternal?: (url: string) => Promise<boolean>;
  reloadHq?: () => Promise<boolean>;
  showServiceManager?: () => Promise<boolean>;
  getServiceStatus?: () => Promise<DeltaDesktopStatus>;
  startAll?: () => Promise<DeltaDesktopStatus>;
  stopAll?: () => Promise<DeltaDesktopStatus>;
  getServiceLogs?: () => Promise<Record<string, DeltaDesktopServiceStatus["logLines"]>>;
  getConfig?: () => Promise<Record<string, unknown>>;
};

declare global {
  interface Window {
    deltaDesktop?: DeltaDesktopBridge;
  }
}

type HqView = "brief" | "organization" | "initiatives" | "evolution" | "analytics" | "activity" | "reviews" | "operator";
type EvolutionTrackFilter = DeltaHqLineageTrackId | "all";

type AskDeltaMessage = {
  id: string;
  role: "owner" | "delta" | "system";
  body: string;
  meta?: string;
};

const views: Array<{ id: HqView; label: string }> = [
  { id: "brief", label: "Brief" },
  { id: "organization", label: "Organization" },
  { id: "initiatives", label: "Initiatives" },
  { id: "evolution", label: "Evolution" },
  { id: "analytics", label: "Analytics" },
  { id: "activity", label: "Activity" },
  { id: "reviews", label: "Reviews" },
  { id: "operator", label: "Operator" },
];

function isHqView(value: string): value is HqView {
  return views.some((view) => view.id === value);
}

const severityStyles: Record<DeltaHqSeverity, string> = {
  good: "border-emerald-300 bg-emerald-50 text-emerald-950",
  notice: "border-sky-300 bg-sky-50 text-sky-950",
  blocked: "border-rose-300 bg-rose-50 text-rose-950",
  attention: "border-amber-300 bg-amber-50 text-amber-950",
};

const severityDots: Record<DeltaHqSeverity, string> = {
  good: "bg-emerald-500",
  notice: "bg-sky-500",
  blocked: "bg-rose-500",
  attention: "bg-amber-500",
};

const lifecycleStyles: Record<string, string> = {
  building: "border-sky-300 bg-sky-50 text-sky-950",
  incubation: "border-violet-300 bg-violet-50 text-violet-950",
  qualified: "border-emerald-300 bg-emerald-50 text-emerald-950",
  active: "border-teal-300 bg-teal-50 text-teal-950",
  governed: "border-indigo-300 bg-indigo-50 text-indigo-950",
  maintenance: "border-zinc-300 bg-zinc-50 text-zinc-950",
  blocked: "border-rose-300 bg-rose-50 text-rose-950",
  sleeping: "border-stone-300 bg-stone-50 text-stone-950",
};

const sourceStyles: Record<DeltaHqSourceKind, string> = {
  real: "border-emerald-300 bg-emerald-50 text-emerald-950",
  fixture: "border-amber-300 bg-amber-50 text-amber-950",
  awaiting_core: "border-rose-300 bg-rose-50 text-rose-950",
};

const lineageStyles: Record<DeltaHqLineageTrackId, string> = {
  product_intelligence: "border-teal-300 bg-teal-50 text-teal-950",
  engineering_agentic: "border-indigo-300 bg-indigo-50 text-indigo-950",
  converged_platform: "border-zinc-400 bg-zinc-100 text-zinc-950",
};

const lineageRailStyles: Record<DeltaHqLineageTrackId, string> = {
  product_intelligence: "border-teal-300",
  engineering_agentic: "border-indigo-300",
  converged_platform: "border-zinc-400",
};

const significanceStyles: Record<string, string> = {
  transformational: "border-zinc-900 bg-zinc-950 text-white",
  major: "border-sky-300 bg-sky-50 text-sky-950",
  minor: "border-zinc-300 bg-zinc-50 text-zinc-800",
};

const confidenceStyles: Record<string, string> = {
  high: "border-emerald-300 bg-emerald-50 text-emerald-950",
  medium: "border-amber-300 bg-amber-50 text-amber-950",
  mixed: "border-amber-300 bg-amber-50 text-amber-950",
  low: "border-rose-300 bg-rose-50 text-rose-950",
};

const dragRegionStyle = {
  WebkitAppRegion: "drag",
} as CSSProperties & { WebkitAppRegion: "drag" };

const noDragRegionStyle = {
  WebkitAppRegion: "no-drag",
} as CSSProperties & { WebkitAppRegion: "no-drag" };

function messageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sourceLabel(kind: DeltaHqSourceKind) {
  if (kind === "awaiting_core") return "Awaiting Core";
  if (kind === "fixture") return "Fixture";
  return "Real source";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function milestoneById(entries: DeltaHqEvolutionMilestone[]) {
  return new Map(entries.map((entry) => [entry.milestone_id, entry]));
}

function runtimeStatusLabel(status: DeltaDesktopStatus | null) {
  const backend = status?.services?.backend?.status;
  const site = status?.services?.site?.status;
  if (!status) return "Web HQ initializing";
  if (status.desktop?.mode === "browser-preview" && site === "running") return "Web HQ connected";
  if (backend === "running" && site === "running") return "Runtime connected";
  if (backend === "running") return "Backend connected";
  if (site === "running") return "HQ renderer connected";
  return "Runtime unavailable";
}

function runtimeSeverity(status: DeltaDesktopStatus | null): DeltaHqSeverity {
  const backend = status?.services?.backend?.status;
  const site = status?.services?.site?.status;
  if (backend === "running" && site === "running") return "good";
  if (backend === "running" || site === "running") return "notice";
  return "attention";
}

function runtimeSurfaceLabel(status: DeltaDesktopStatus | null) {
  if (status?.desktop?.mode === "browser-preview") return "Browser HQ";
  if (status?.desktop?.mode) return "Delta.app";
  return "Web HQ";
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function SectionTitle({
  kicker,
  title,
  detail,
}: {
  kicker?: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="max-w-3xl">
      {kicker && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{kicker}</p>}
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">{title}</h2>
      {detail && <p className="mt-3 text-sm leading-6 text-zinc-600">{detail}</p>}
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-200 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-zinc-900">{value}</dd>
    </div>
  );
}

function TrendVisualizationCard({
  trend,
  compact = false,
}: {
  trend: DeltaHqTrendVisualization | DeltaHqDepartmentPerformancePanel;
  compact?: boolean;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={compact ? "text-sm font-semibold text-zinc-950" : "text-base font-semibold text-zinc-950"}>
            {trend.title}
          </h3>
          {"scope" in trend && <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{trend.scope}</p>}
        </div>
        <Badge className={sourceStyles[trend.sourceKind]}>{sourceLabel(trend.sourceKind)}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(86px,1fr))] gap-2">
        {trend.points.map((point) => (
          <div key={`${trend.id}-${point.label}-${point.occurredAt}`} className="min-h-24 rounded-md border border-zinc-200 bg-zinc-50 p-2">
            <div className={`h-2 rounded-full ${severityDots[point.severity]}`} />
            <p className="mt-3 text-xs font-semibold text-zinc-950">{point.label}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">{point.valueLabel}</p>
            <p className="mt-2 text-[11px] text-zinc-500">{formatTime(point.occurredAt)}</p>
          </div>
        ))}
      </div>

      <dl className="mt-4 border-t border-zinc-200 pt-3">
        <KeyValue label="Canonical metric" value={trend.canonicalMetricRef || "Awaiting contract"} />
        <KeyValue label="Definition status" value={trend.definitionStatus} />
        {"adapterNote" in trend && <KeyValue label="Adapter note" value={trend.adapterNote} />}
        {"summary" in trend && <KeyValue label="Summary" value={trend.summary} />}
      </dl>
    </article>
  );
}

function ExecutiveBrief({
  model,
  runtimeStatus,
  onOpenView,
}: {
  model: DeltaHqViewModel;
  runtimeStatus: DeltaDesktopStatus | null;
  onOpenView: (view: HqView) => void;
}) {
  const runtimeSignal = {
    label: runtimeSurfaceLabel(runtimeStatus),
    value: runtimeStatusLabel(runtimeStatus),
    severity: runtimeSeverity(runtimeStatus),
    source: runtimeStatus?.generatedAt ? `HQ runtime check ${formatTime(runtimeStatus.generatedAt)}` : "HQ runtime check",
  };
  const signals = [...model.executiveBrief.signals, runtimeSignal];

  return (
    <div className="grid gap-6">
      <section className="border-b border-zinc-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Executive brief</p>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold leading-tight tracking-normal text-zinc-950">
          {model.executiveBrief.headline}
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-600">{model.executiveBrief.summary}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Critical path</p>
          <p className="mt-3 text-xl font-semibold leading-7 text-zinc-950">{model.executiveBrief.criticalPath}</p>
          <div className="mt-5 border-t border-zinc-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Recommended decision</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{model.executiveBrief.recommendation}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenView("reviews")}
              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white"
            >
              Review decision
            </button>
            <button
              type="button"
              onClick={() => onOpenView("operator")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
            >
              Operator details
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {signals.map((signal) => (
            <div key={`${signal.label}-${signal.value}`} className={`rounded-lg border p-4 ${severityStyles[signal.severity]}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${severityDots[signal.severity]}`} />
                <p className="text-xs font-semibold uppercase tracking-wide">{signal.label}</p>
              </div>
              <p className="mt-3 text-base font-semibold leading-6">{signal.value}</p>
              <p className="mt-2 text-xs leading-5 opacity-80">{signal.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Organization</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">{model.observability.departments.length}</p>
          <p className="mt-2 text-sm text-zinc-600">department pages prepared</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Blocked initiatives</p>
          <p className="mt-2 text-3xl font-semibold text-rose-700">
            {model.initiatives.filter((initiative) => initiative.lifecycle === "blocked").length}
          </p>
          <p className="mt-2 text-sm text-zinc-600">need owner or integration clarity</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Awaiting Core</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">
            {model.mockedOrAwaitingCoreFields.filter((source) => source.kind === "awaiting_core").length}
          </p>
          <p className="mt-2 text-sm text-zinc-600">fields intentionally not invented</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <SectionTitle
            kicker="Executive trends"
            title="Small signal set for the Brief"
            detail={model.observability.status}
          />
          <button
            type="button"
            onClick={() => onOpenView("analytics")}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
          >
            Analytics
          </button>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {model.observability.briefTrends.map((trend) => (
            <TrendVisualizationCard key={trend.id} trend={trend} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function OrganizationView({
  agents,
  departments,
  selectedAgentId,
  selectedDepartmentId,
  onSelectAgent,
  onSelectDepartment,
  onOpenAnalytics,
}: {
  agents: DeltaHqAgent[];
  departments: DeltaHqDepartment[];
  selectedAgentId: string;
  selectedDepartmentId: string;
  onSelectAgent: (agentId: string) => void;
  onSelectDepartment: (departmentId: string) => void;
  onOpenAnalytics: () => void;
}) {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) || agents[0];
  const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId) || departments[0];
  const departmentAgents = selectedDepartment
    ? agents.filter((agent) => selectedDepartment.agentIds.includes(agent.id))
    : agents;

  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Organization"
        title="Departments, agents, and historical context"
        detail="HQ presents organizational responsibilities through shared adapters. Department dashboard panels remain fixture-backed until Observability publishes canonical metrics."
      />

      {selectedDepartment && (
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <nav className="grid content-start gap-2" aria-label="Departments">
            {departments.map((department) => (
              <button
                key={department.id}
                type="button"
                onClick={() => onSelectDepartment(department.id)}
                className={`rounded-lg border bg-white p-4 text-left ${
                  selectedDepartment.id === department.id ? "border-zinc-950 shadow-sm" : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-950">{department.name}</p>
                  <Badge className={sourceStyles[department.sourceKind]}>{sourceLabel(department.sourceKind)}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-600">{department.owner}</p>
              </button>
            ))}
          </nav>

          <DepartmentDetail
            department={selectedDepartment}
            agents={departmentAgents}
            onSelectAgent={onSelectAgent}
            onOpenAnalytics={onOpenAnalytics}
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-3 md:grid-cols-2">
          {departmentAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelectAgent(agent.id)}
              className={`rounded-lg border bg-white p-4 text-left transition ${
                selectedAgent.id === agent.id ? "border-zinc-950 shadow-sm" : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{agent.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{agent.department}</p>
                </div>
                <Badge className={sourceStyles[agent.sourceKind]}>{sourceLabel(agent.sourceKind)}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {agent.lifecycle.map((state) => (
                  <Badge key={state} className={lifecycleStyles[state]}>{state}</Badge>
                ))}
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">{agent.mission}</p>
            </button>
          ))}
        </div>

        <AgentDetail agent={selectedAgent} />
      </div>
    </div>
  );
}

function DepartmentDetail({
  department,
  agents,
  onSelectAgent,
  onOpenAnalytics,
}: {
  department: DeltaHqDepartment;
  agents: DeltaHqAgent[];
  onSelectAgent: (agentId: string) => void;
  onOpenAnalytics: () => void;
}) {
  return (
    <section id={`department-${department.id}`} className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Department</p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-950">{department.name}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{department.mission}</p>
        </div>
        <Badge className={sourceStyles[department.sourceKind]}>{sourceLabel(department.sourceKind)}</Badge>
      </div>

      <dl className="mt-5 grid gap-x-6 md:grid-cols-2">
        <KeyValue label="Owner" value={department.owner} />
        <KeyValue
          label="Agents"
          value={
            agents.length === 0 ? "No mapped agents" : (
              <span className="flex flex-wrap gap-2">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => onSelectAgent(agent.id)}
                    className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-800"
                  >
                    {agent.name}
                  </button>
                ))}
              </span>
            )
          }
        />
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5">
        <h4 className="text-sm font-semibold text-zinc-950">Historical performance dashboards</h4>
        <button
          type="button"
          onClick={onOpenAnalytics}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
        >
          Analytics
        </button>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {department.performancePanels.map((panel) => (
          <TrendVisualizationCard key={panel.id} trend={panel} compact />
        ))}
      </div>
    </section>
  );
}

function AgentDetail({ agent }: { agent: DeltaHqAgent }) {
  return (
    <aside id={`agent-${agent.id}`} className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Agent detail</p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-950">{agent.name}</h3>
        </div>
        <Badge className={sourceStyles[agent.sourceKind]}>{sourceLabel(agent.sourceKind)}</Badge>
      </div>

      <dl className="mt-5">
        <KeyValue label="Mission" value={agent.mission} />
        <KeyValue label="Lifecycle" value={agent.lifecycle.join(", ")} />
        <KeyValue label="Authority" value={agent.authority} />
        <KeyValue label="Qualification" value={agent.qualification} />
        <KeyValue label="Last activity" value={agent.lastActivity} />
        <KeyValue label="Evaluation health" value={agent.evaluationHealth} />
        <KeyValue label="Cost" value={agent.cost} />
        <KeyValue
          label="Blockers"
          value={agent.blockers.length === 0 ? "None visible" : agent.blockers.join("; ")}
        />
        <KeyValue label="Context sources" value={agent.contextSources.join(", ")} />
        <KeyValue label="Recent decisions" value={agent.recentDecisions.join(" ")} />
        <KeyValue label="Wake conditions" value={agent.wakeConditions.join(", ")} />
      </dl>
    </aside>
  );
}

function InitiativesView({
  initiatives,
  onOpenReview,
}: {
  initiatives: DeltaHqInitiative[];
  onOpenReview: (reviewId: string) => void;
}) {
  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Initiatives"
        title="Mission Control portfolio"
        detail="This portfolio is a view-model projection from current artifacts and explicit fixtures until Core publishes canonical initiative state."
      />

      <div className="grid gap-3">
        {initiatives.map((initiative) => (
          <article key={initiative.id} id={`initiative-${initiative.id}`} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={lifecycleStyles[initiative.lifecycle]}>{initiative.lifecycle}</Badge>
                  <Badge className={sourceStyles[initiative.sourceKind]}>{sourceLabel(initiative.sourceKind)}</Badge>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-zinc-950">{initiative.objective}</h3>
                <p className="mt-2 text-sm text-zinc-600">{initiative.recentMovement}</p>
              </div>
              {initiative.id === "source-parity-release-readiness" && (
                <button
                  type="button"
                  onClick={() => onOpenReview("review-source-parity-block")}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
                >
                  Open review
                </button>
              )}
            </div>

            <dl className="mt-5 grid gap-x-6 md:grid-cols-2">
              <KeyValue label="Owner" value={initiative.owner} />
              <KeyValue label="Qualification" value={initiative.qualification} />
              <KeyValue label="Integration readiness" value={initiative.integrationReadiness} />
              <KeyValue
                label="Dependencies"
                value={initiative.dependencies.length === 0 ? "None visible" : initiative.dependencies.join(", ")}
              />
              <KeyValue
                label="Blockers"
                value={initiative.blockers.length === 0 ? "None visible" : initiative.blockers.join("; ")}
              />
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function ActivityView({
  events,
  agents,
  onOpenAgent,
  onOpenReview,
}: {
  events: DeltaHqActivityEvent[];
  agents: DeltaHqAgent[];
  onOpenAgent: (agentId: string) => void;
  onOpenReview: (reviewId: string) => void;
}) {
  const agentByName = new Map(agents.map((agent) => [agent.name, agent.id]));

  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Activity"
        title="Meaningful engineering events"
        detail="HQ shows durable engineering meaning here. Runtime logs, Git output, and tool traces stay in Operator Mode."
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        {events.map((event, index) => (
          <article
            key={event.id}
            id={`event-${event.id}`}
            className={`grid gap-4 p-5 md:grid-cols-[160px_1fr] ${index > 0 ? "border-t border-zinc-200" : ""}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${severityDots[event.severity]}`} />
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{formatTime(event.occurredAt)}</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-700">{event.actor}</p>
            </div>
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-zinc-950">{event.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{event.summary}</p>
                </div>
                <Badge className={sourceStyles[event.sourceKind]}>{sourceLabel(event.sourceKind)}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {event.affected.map((name) => {
                  const agentId = agentByName.get(name);
                  return agentId ? (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onOpenAgent(agentId)}
                      className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-800"
                    >
                      {name}
                    </button>
                  ) : (
                    <Badge key={name} className="border-zinc-300 bg-zinc-50 text-zinc-800">{name}</Badge>
                  );
                })}
                {event.reviewId && (
                  <button
                    type="button"
                    onClick={() => onOpenReview(event.reviewId as string)}
                    className="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ReviewsView({
  reviews,
  selectedReviewId,
  onSelectReview,
}: {
  reviews: DeltaHqOwnerReview[];
  selectedReviewId: string;
  onSelectReview: (reviewId: string) => void;
}) {
  const selectedReview = reviews.find((review) => review.id === selectedReviewId) || reviews[0];

  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Owner review"
        title="Advisory Mission Control results"
        detail="These reviews follow the existing contract: owner disposition never routes, notifies, starts a handoff, approves an action, or executes work."
      />

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="grid content-start gap-3">
          {reviews.map((review) => (
            <button
              key={review.id}
              type="button"
              onClick={() => onSelectReview(review.id)}
              className={`rounded-lg border bg-white p-4 text-left ${
                selectedReview.id === review.id ? "border-zinc-950 shadow-sm" : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <Badge className={sourceStyles[review.sourceKind]}>{sourceLabel(review.sourceKind)}</Badge>
              <p className="mt-3 text-sm font-semibold leading-6 text-zinc-950">{review.event}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{review.status}</p>
            </button>
          ))}
        </div>

        <ReviewDetail review={selectedReview} />
      </div>
    </div>
  );
}

function ReviewDetail({ review }: { review: DeltaHqOwnerReview }) {
  const [localDisposition, setLocalDisposition] = useState<string | null>(null);

  return (
    <article id={`review-${review.id}`} className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Engineering event received</p>
          <h3 className="mt-2 text-2xl font-semibold leading-8 text-zinc-950">{review.event}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-zinc-300 bg-zinc-50 text-zinc-900">{review.status}</Badge>
          <Badge className={sourceStyles[review.sourceKind]}>{sourceLabel(review.sourceKind)}</Badge>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Advisory only. Accepting this review will not notify an owner, start a handoff, approve an action, or execute work.
      </div>

      <dl className="mt-5 grid gap-x-6 md:grid-cols-2">
        <KeyValue label="Primary owner" value={review.primaryOwner} />
        <KeyValue label="Route or handoff" value={review.routeOrHandoff} />
        <KeyValue label="Escalation" value={review.escalation} />
        <KeyValue label="Stopping reason" value={review.stoppingReason} />
        <KeyValue label="Cost" value={review.cost} />
        <KeyValue label="Recommendation" value={review.recommendation} />
      </dl>

      <section className="mt-6">
        <h4 className="text-sm font-semibold text-zinc-950">Material uncertainty</h4>
        <div className="mt-3 grid gap-2">
          {review.uncertainty.map((item) => (
            <p key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h4 className="text-sm font-semibold text-zinc-950">Evidence</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {review.evidence.map((evidence) => (
            <div key={evidence.label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-zinc-950">{evidence.label}</p>
                <Badge className={sourceStyles[evidence.sourceKind]}>{sourceLabel(evidence.sourceKind)}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{evidence.contribution}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{evidence.trust}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {review.supportedControls.map((control) => (
          <button
            key={control}
            type="button"
            onClick={() => setLocalDisposition(`${control} selected locally for preview. No runtime mutation was performed.`)}
            className={control === "Accept review" ? "rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white" : "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"}
          >
            {control}
          </button>
        ))}
      </div>

      {localDisposition && (
        <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700" role="status">
          {localDisposition}
        </p>
      )}

      <details className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-950">Provenance and usage</summary>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
          {review.provenance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function AnalyticsView({
  model,
  onOpenDepartment,
}: {
  model: DeltaHqViewModel;
  onOpenDepartment: (departmentId: string) => void;
}) {
  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Analytics"
        title="Organizational Observability surface"
        detail={model.observability.status}
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Contract owner</p>
          <p className="mt-2 text-lg font-semibold text-zinc-950">{model.observability.contractOwner}</p>
          <div className="mt-5 border-t border-zinc-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Guardrails</p>
            <div className="mt-3 grid gap-2">
              {model.observability.guardedSemantics.map((item) => (
                <p key={item} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Dedicated surfaces</p>
          <div className="mt-4 grid gap-3">
            {model.observability.dedicatedSurfaces.map((surface) => (
              <div key={surface.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-950">{surface.label}</p>
                  <Badge className={sourceStyles[surface.sourceKind]}>{sourceLabel(surface.sourceKind)}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{surface.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="Brief trends"
          title="Executive trend visualizations"
          detail="These panels use adapter-projected status points and wait for canonical metric references before becoming true observability metrics."
        />
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {model.observability.briefTrends.map((trend) => (
            <TrendVisualizationCard key={trend.id} trend={trend} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="Departments"
          title="Historical performance dashboard slots"
          detail="Department dashboards are addressable now; the metric definitions remain owned by the upcoming Observability contract."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {model.observability.departments.map((department) => (
            <article key={department.id} className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{department.owner}</p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-950">{department.name}</h3>
                </div>
                <Badge className={sourceStyles[department.sourceKind]}>{sourceLabel(department.sourceKind)}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{department.mission}</p>
              <div className="mt-4 grid gap-3">
                {department.performancePanels.map((panel) => (
                  <TrendVisualizationCard key={panel.id} trend={panel} compact />
                ))}
              </div>
              <button
                type="button"
                onClick={() => onOpenDepartment(department.id)}
                className="mt-4 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
              >
                Open department
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-semibold text-zinc-950">Contract integration points</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {model.observability.contractIntegrationPoints.map((point) => (
            <p key={point} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
              {point}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

function OperatorView({
  model,
  runtimeStatus,
  serviceLogs,
  onStartRuntime,
  onStopRuntime,
  onShowServiceManager,
}: {
  model: DeltaHqViewModel;
  runtimeStatus: DeltaDesktopStatus | null;
  serviceLogs: Record<string, DeltaDesktopServiceStatus["logLines"]> | null;
  onStartRuntime: () => void;
  onStopRuntime: () => void;
  onShowServiceManager: () => void;
}) {
  const backend = runtimeStatus?.services?.backend;
  const site = runtimeStatus?.services?.site;
  const serviceManagerEnabled = runtimeStatus?.desktop?.serviceManagerEnabled !== false;
  const logRows = [
    ...(serviceLogs?.backend || []),
    ...(serviceLogs?.site || []),
  ].slice(-40);

  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Operator Mode"
        title="Diagnostics behind the HQ boundary"
        detail="This view is explicit because raw service health, command previews, and contract gaps are operator evidence, not the owner briefing."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {[backend, site].map((service) => (
          <div key={service?.name || "unknown"} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{service?.label || "Service"}</p>
                <p className="mt-2 text-xl font-semibold text-zinc-950">{service?.status || "unknown"}</p>
              </div>
              <Badge className={service?.status === "running" ? severityStyles.good : severityStyles.attention}>
                {service?.owner || "none"}
              </Badge>
            </div>
            <dl className="mt-4">
              <KeyValue label="PID" value={service?.pid || "none"} />
              <KeyValue label="Health URL" value={service?.healthUrl || "unavailable"} />
              <KeyValue label="Error" value={service?.error || "none"} />
            </dl>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-950">Local runtime controls</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Start and stop are limited to app-launched backend/site development processes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStartRuntime}
              disabled={!serviceManagerEnabled}
              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-45"
            >
              Start local runtime
            </button>
            <button
              type="button"
              onClick={onStopRuntime}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
            >
              Stop app-launched runtime
            </button>
            <button
              type="button"
              onClick={onShowServiceManager}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
            >
              Service manager
            </button>
          </div>
        </div>
        {runtimeStatus?.desktop?.serviceManagerDisabledReason && (
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            {runtimeStatus.desktop.serviceManagerDisabledReason}
          </p>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="text-base font-semibold text-zinc-950">Current real integrations</h3>
          <div className="mt-4 grid gap-3">
            {model.currentRealDataIntegrations.map((source) => (
              <div key={source.label} className="border-t border-zinc-200 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-950">{source.label}</p>
                  <Badge className={sourceStyles[source.kind]}>{sourceLabel(source.kind)}</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{source.detail}</p>
                {source.path && <p className="mt-1 text-xs text-zinc-500">{source.path}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="text-base font-semibold text-zinc-950">Mocked or awaiting Core</h3>
          <div className="mt-4 grid gap-3">
            {model.mockedOrAwaitingCoreFields.map((source) => (
              <div key={source.label} className="border-t border-zinc-200 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-950">{source.label}</p>
                  <Badge className={sourceStyles[source.kind]}>{sourceLabel(source.kind)}</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{source.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-semibold text-zinc-950">Event Bus integration points</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {model.eventBusIntegrationPoints.map((point) => (
            <p key={point} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
              {point}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-semibold text-zinc-950">Service logs</h3>
        <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
          {logRows.length === 0 ? (
            <p>No service logs visible.</p>
          ) : (
            logRows.map((entry) => (
              <p key={`${entry.timestamp}-${entry.service}-${entry.stream}-${entry.line}`}>
                {entry.timestamp} {entry.service}/{entry.stream}: {entry.line}
              </p>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function AskDeltaPanel({
  runtimeStatus,
  currentView,
}: {
  runtimeStatus: DeltaDesktopStatus | null;
  currentView: HqView;
}) {
  const [messages, setMessages] = useState<AskDeltaMessage[]>([
    {
      id: "initial",
      role: "delta",
      body:
        "Delta HQ is focused on the current engineering organization state. Ask about blockers, owners, evidence, or the next decision.",
      meta: "Read-only HQ context",
    },
  ]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;
    setInput("");
    setMessages((items) => [...items, { id: messageId(), role: "owner", body: message }]);
    setIsSending(true);

    try {
      const response = await askDeltaConversation({
        userId: DELTA_HQ_OWNER_ID,
        message: `[Delta HQ ${currentView}] ${message}`,
        sessionId,
      });
      setSessionId(response.session_id);
      setMessages((items) => [
        ...items,
        {
          id: messageId(),
          role: "delta",
          body: response.response,
          meta: response.read_only && !response.memory_writes ? "Read-only response, no memory writes" : "Runtime response",
        },
      ]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          id: messageId(),
          role: "system",
          body:
            error instanceof Error
              ? `Local Delta runtime did not answer: ${error.message}`
              : "Local Delta runtime did not answer.",
          meta: "No HQ state was changed",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <aside className="border-t border-zinc-200 bg-white xl:border-l xl:border-t-0">
      <div className="sticky top-0 grid h-[min(100vh,900px)] grid-rows-[auto_1fr_auto]">
        <div className="border-b border-zinc-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Ask Delta</p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">{runtimeStatusLabel(runtimeStatus)}</p>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${severityDots[runtimeSeverity(runtimeStatus)]}`} />
          </div>
        </div>

        <div className="overflow-auto p-4">
          <div className="grid gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border p-3 ${
                  message.role === "owner"
                    ? "border-zinc-900 bg-zinc-950 text-white"
                    : message.role === "system"
                      ? "border-amber-300 bg-amber-50 text-amber-950"
                      : "border-zinc-200 bg-zinc-50 text-zinc-900"
                }`}
              >
                <p className="text-sm leading-6">{message.body}</p>
                {message.meta && <p className="mt-2 text-xs opacity-70">{message.meta}</p>}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="border-t border-zinc-200 p-4">
          <label className="sr-only" htmlFor="delta-hq-ask">Ask Delta</label>
          <textarea
            id="delta-hq-ask"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-6 text-zinc-950 outline-none focus:border-zinc-950"
            placeholder="Ask about the current blocker, an agent, initiative, or review."
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="mt-3 w-full rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-45"
          >
            {isSending ? "Asking..." : "Ask Delta"}
          </button>
        </form>
      </div>
    </aside>
  );
}

function DeliveryPlanView({ model }: { model: DeltaHqViewModel }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-base font-semibold text-zinc-950">Shared HQ delivery</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Shell decision</p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">{model.routeDecision.shellDecision}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Web entry</p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">{model.routeDecision.primarySurface}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Shared route</p>
          <p className="mt-2 text-sm leading-6 text-zinc-700">{model.routeDecision.sharedRendererMount}</p>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
        {model.routeDecision.desktopDeliveryPath}
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Web plan</p>
          <div className="mt-3 grid gap-2">
            {model.webIntegrationPlan.map((item) => (
              <p key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Desktop path</p>
          <div className="mt-3 grid gap-2">
        {model.desktopIntegrationPlan.map((item) => (
          <p key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
            {item}
          </p>
        ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DeltaHQ({ model }: { model: DeltaHqViewModel }) {
  const [currentView, setCurrentView] = useState<HqView>("brief");
  const [selectedAgentId, setSelectedAgentId] = useState(model.organization[0]?.id || "");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(model.observability.departments[0]?.id || "");
  const [selectedReviewId, setSelectedReviewId] = useState(model.reviews[0]?.id || "");
  const [runtimeStatus, setRuntimeStatus] = useState<DeltaDesktopStatus | null>(null);
  const [serviceLogs, setServiceLogs] = useState<Record<string, DeltaDesktopServiceStatus["logLines"]> | null>(null);

  const selectedViewLabel = useMemo(
    () => views.find((view) => view.id === currentView)?.label || "Brief",
    [currentView],
  );

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const timer = window.setTimeout(() => {
      if (isHqView(hash)) {
        setCurrentView(hash);
        return;
      }
      if (hash.startsWith("department-")) {
        const departmentId = hash;
        const department = model.observability.departments.find((item) => item.id === departmentId);
        if (department) {
          setSelectedDepartmentId(departmentId);
          if (department.agentIds[0]) setSelectedAgentId(department.agentIds[0]);
          setCurrentView("organization");
        }
        return;
      }
      if (hash.startsWith("agent-")) {
        const agentId = hash.replace(/^agent-/, "");
        if (model.organization.some((agent) => agent.id === agentId)) {
          setSelectedAgentId(agentId);
          setCurrentView("organization");
        }
        return;
      }
      if (hash.startsWith("initiative-")) {
        setCurrentView("initiatives");
        return;
      }
      if (hash.startsWith("event-")) {
        setCurrentView("activity");
        return;
      }
      if (hash.startsWith("review-")) {
        const reviewId = hash.replace(/^review-/, "");
        if (model.reviews.some((review) => review.id === reviewId)) {
          setSelectedReviewId(reviewId);
          setCurrentView("reviews");
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [model.observability.departments, model.organization, model.reviews]);

  const refreshRuntime = useCallback(async () => {
    if (!window.deltaDesktop?.getServiceStatus) {
      setRuntimeStatus({
        generatedAt: new Date().toISOString(),
        services: {
          backend: {
            name: "backend",
            label: "Backend",
            status: "unavailable",
            owner: "none",
            pid: null,
            stoppable: false,
            healthUrl: "http://127.0.0.1:8000/health",
            error: "Electron bridge unavailable in browser preview",
          },
          site: {
            name: "site",
            label: "HQ renderer",
            status: "running",
            owner: "browser",
            pid: null,
            stoppable: false,
            healthUrl: window.location.href,
            error: null,
          },
        },
        desktop: {
          mode: "browser-preview",
          serviceManagerEnabled: false,
          serviceManagerDisabledReason: "Service controls are available only inside Delta.app.",
        },
      });
      return;
    }
    const status = await window.deltaDesktop.getServiceStatus();
    setRuntimeStatus(status);
    if (window.deltaDesktop.getServiceLogs) {
      setServiceLogs(await window.deltaDesktop.getServiceLogs());
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(refreshRuntime, 0);
    const timer = window.setInterval(refreshRuntime, 12000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refreshRuntime]);

  function openView(view: HqView) {
    setCurrentView(view);
    window.history.replaceState(null, "", `#${view}`);
  }

  function openAgent(agentId: string) {
    setSelectedAgentId(agentId);
    const department = model.observability.departments.find((item) => item.agentIds.includes(agentId));
    if (department) setSelectedDepartmentId(department.id);
    setCurrentView("organization");
    window.history.replaceState(null, "", `#agent-${agentId}`);
  }

  function openDepartment(departmentId: string) {
    const department = model.observability.departments.find((item) => item.id === departmentId);
    setSelectedDepartmentId(departmentId);
    if (department?.agentIds[0]) setSelectedAgentId(department.agentIds[0]);
    setCurrentView("organization");
    window.history.replaceState(null, "", `#${departmentId}`);
  }

  function openReview(reviewId: string) {
    setSelectedReviewId(reviewId);
    setCurrentView("reviews");
    window.history.replaceState(null, "", `#review-${reviewId}`);
  }

  async function startRuntime() {
    if (window.deltaDesktop?.startAll) {
      setRuntimeStatus(await window.deltaDesktop.startAll());
      await refreshRuntime();
    }
  }

  async function stopRuntime() {
    if (window.deltaDesktop?.stopAll) {
      setRuntimeStatus(await window.deltaDesktop.stopAll());
      await refreshRuntime();
    }
  }

  function showServiceManager() {
    window.deltaDesktop?.showServiceManager?.();
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-zinc-950">
      <div className="grid min-h-screen xl:grid-cols-[224px_minmax(0,1fr)_376px]">
        <aside className="border-b border-zinc-200 bg-[#e9edf2] xl:border-b-0 xl:border-r">
          <div className="sticky top-0 p-4 pt-8 xl:pt-16">
            <div className="pl-16 xl:pl-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Owner HQ</p>
              <p className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">Delta HQ</p>
            </div>
            <nav className="mt-8 grid gap-1" aria-label="Delta HQ">
              {views.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => openView(view.id)}
                  className={`rounded-md px-3 py-2 text-left text-sm font-semibold ${
                    currentView === view.id ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-white"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </nav>
            <div className="mt-8 rounded-lg border border-zinc-300 bg-white/70 p-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${severityDots[runtimeSeverity(runtimeStatus)]}`} />
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Runtime</p>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">{runtimeStatusLabel(runtimeStatus)}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header
            className="sticky top-0 z-10 border-b border-zinc-200 bg-[#f4f6f8]/95 px-5 py-3 backdrop-blur"
            style={dragRegionStyle}
          >
            <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 pl-16 xl:pl-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{selectedViewLabel}</p>
                <p className="text-sm font-semibold text-zinc-950">Generated from HQ adapter snapshot {formatTime(model.generatedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2" style={noDragRegionStyle}>
                <Badge className="border-zinc-300 bg-white text-zinc-800">{runtimeSurfaceLabel(runtimeStatus)}</Badge>
                <button
                  type="button"
                  onClick={refreshRuntime}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900"
                >
                  Refresh
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-8 p-5 xl:p-8">
            {currentView === "brief" && (
              <>
                <ExecutiveBrief model={model} runtimeStatus={runtimeStatus} onOpenView={openView} />
                <DeliveryPlanView model={model} />
              </>
            )}
            {currentView === "organization" && (
              <OrganizationView
                agents={model.organization}
                departments={model.observability.departments}
                selectedAgentId={selectedAgentId}
                selectedDepartmentId={selectedDepartmentId}
                onSelectAgent={openAgent}
                onSelectDepartment={openDepartment}
                onOpenAnalytics={() => openView("analytics")}
              />
            )}
            {currentView === "initiatives" && (
              <InitiativesView initiatives={model.initiatives} onOpenReview={openReview} />
            )}
            {currentView === "activity" && (
              <ActivityView
                events={model.activity}
                agents={model.organization}
                onOpenAgent={openAgent}
                onOpenReview={openReview}
              />
            )}
            {currentView === "reviews" && (
              <ReviewsView
                reviews={model.reviews}
                selectedReviewId={selectedReviewId}
                onSelectReview={openReview}
              />
            )}
            {currentView === "analytics" && (
              <AnalyticsView
                model={model}
                onOpenDepartment={openDepartment}
              />
            )}
            {currentView === "operator" && (
              <OperatorView
                model={model}
                runtimeStatus={runtimeStatus}
                serviceLogs={serviceLogs}
                onStartRuntime={startRuntime}
                onStopRuntime={stopRuntime}
                onShowServiceManager={showServiceManager}
              />
            )}

            <section className="rounded-lg border border-zinc-200 bg-white p-5">
              <h3 className="text-base font-semibold text-zinc-950">Mac capabilities deferred</h3>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {model.deferredMacCapabilities.map((capability) => (
                  <p key={capability} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                    {capability}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </main>

        <AskDeltaPanel runtimeStatus={runtimeStatus} currentView={currentView} />
      </div>
    </div>
  );
}
