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
  type DeltaHqObservabilityMetric,
  type DeltaHqOwnerReview,
  type DeltaHqSeverity,
  type DeltaHqSourceKind,
  type DeltaHqTrendVisualization,
  type DeltaHqViewModel,
} from "@/lib/deltaHqViewModel";
import { askDeltaConversation } from "@/lib/conversationApi";
import {
  canRenderAsCurrentOperationalMeasurement,
  currentApplicabilityLabel,
  currentTrustedObservabilityMetrics,
  degradedObservabilityMetrics,
  formatObservabilityMetricValue,
  metricDisplayTitle,
  metricOperationalStateLabel,
  metricUnavailableReason,
  metricsForScope,
  scopeLabel,
  selectExecutiveBriefMetrics,
} from "@/lib/deltaHqObservability";

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

const trustStateStyles: Record<string, string> = {
  trusted: "border-emerald-300 bg-emerald-50 text-emerald-950",
  partial: "border-sky-300 bg-sky-50 text-sky-950",
  stale: "border-amber-300 bg-amber-50 text-amber-950",
  untrusted: "border-rose-300 bg-rose-50 text-rose-950",
  conflicted: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950",
  missing: "border-zinc-300 bg-zinc-50 text-zinc-800",
  unpriced: "border-orange-300 bg-orange-50 text-orange-950",
  fixture: "border-amber-300 bg-amber-50 text-amber-950",
  complete: "border-emerald-300 bg-emerald-50 text-emerald-950",
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

function trustStateClassName(state: string) {
  return trustStateStyles[state] || "border-zinc-300 bg-zinc-50 text-zinc-800";
}

function titleCaseState(state: string) {
  return state.replaceAll("_", " ");
}

function observabilitySummaryLabel(summary: Record<string, number>) {
  const entries = Object.entries(summary);
  if (entries.length === 0) return "No metrics";
  return entries.map(([state, count]) => `${count} ${titleCaseState(state)}`).join(", ");
}

function uniqueMetricIds(metrics: DeltaHqObservabilityMetric[]) {
  return new Set(metrics.map((metric) => metric.metric_id));
}

const departmentMetricIds: Record<string, string[]> = {
  "department-core": [
    "event_bus.events_received",
    "event_bus.dispatches",
    "event_bus.wake_success_rate",
    "event_bus.queue_depth",
    "event_bus.dispatch_latency_ms",
    "event_bus.blocked_dispatches",
    "event_bus.backpressure",
    "event_bus.delivery_failures",
  ],
  "department-coordination": [
    "mission_control.event_task_success_rate",
    "mission_control.provider_turns",
    "mission_control.tokens",
    "mission_control.cost_per_successful_event",
    "mission_control.latency_ms",
    "mission_control.escalation_rate",
    "mission_control.human_required_rate",
    "mission_control.terminal_completeness_rate",
  ],
  "department-governance": [
    "mission_control.safety_violations",
  ],
  "department-experience-product": [
    "organization.autonomy_ratio",
    "organization.owner_interventions_per_workflow",
  ],
  "department-delivery": [
    "mission_control.cost_per_successful_event",
    "mission_control.latency_ms",
    "mission_control.terminal_completeness_rate",
  ],
};

function metricsForDepartment(
  projection: DeltaHqViewModel["observability"]["projection"],
  departmentId: string,
) {
  const ids = new Set(departmentMetricIds[departmentId] || []);
  return projection.metrics.filter((metric) => ids.has(metric.metric_id));
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

function formatOptionalTime(value: string | null) {
  return value ? formatTime(value) : "Unavailable";
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

function TrustStateBadge({ state }: { state: string }) {
  return <Badge className={trustStateClassName(state)}>{titleCaseState(state)}</Badge>;
}

function ObservabilityMetricCard({
  metric,
  compact = false,
  showScope = false,
}: {
  metric: DeltaHqObservabilityMetric;
  compact?: boolean;
  showScope?: boolean;
}) {
  const canRenderCurrent = canRenderAsCurrentOperationalMeasurement(metric);
  const stateLabel = metricOperationalStateLabel(metric);
  const unavailableReason = metricUnavailableReason(metric);

  return (
    <article
      id={`metric-${metric.metric_id.replaceAll(".", "-")}`}
      className={`rounded-lg border bg-white ${canRenderCurrent ? "border-emerald-200" : "border-zinc-200"} ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {showScope && <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{scopeLabel(metric.scope)}</p>}
          <h3 className={compact ? "text-sm font-semibold leading-6 text-zinc-950" : "text-base font-semibold leading-6 text-zinc-950"}>
            {metricDisplayTitle(metric)}
          </h3>
          <p className="mt-1 break-words text-[11px] font-semibold text-zinc-500">{metric.metric_id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrustStateBadge state={metric.trust_state} />
          <TrustStateBadge state={metric.data_quality_state} />
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <p className={compact ? "text-xl font-semibold text-zinc-950" : "text-2xl font-semibold text-zinc-950"}>
          {formatObservabilityMetricValue(metric)}
        </p>
        <p className="text-sm font-semibold leading-6 text-zinc-700">{stateLabel}</p>
        <p className="text-xs leading-5 text-zinc-500">{currentApplicabilityLabel(metric)}</p>
        {unavailableReason && (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs leading-5 text-zinc-600">
            {titleCaseState(unavailableReason)}
          </p>
        )}
      </div>

      <details className="mt-4 border-t border-zinc-200 pt-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Provenance
        </summary>
        <dl className="mt-3 grid gap-x-4 md:grid-cols-2">
          <KeyValue label="Freshness" value={titleCaseState(metric.source_freshness.state)} />
          <KeyValue label="Latest accepted source" value={formatOptionalTime(metric.latest_accepted_source_time)} />
          <KeyValue label="Source events" value={metric.source_event_count} />
          <KeyValue
            label="Producers"
            value={metric.producer_identities.length === 0 ? "No accepted producers" : metric.producer_identities.join(", ")}
          />
          <KeyValue label="Qualification epoch" value={metric.qualification_epochs.length === 0 ? "None" : metric.qualification_epochs.join(", ")} />
          <KeyValue label="Current epoch" value={metric.current_qualification_epoch || "None"} />
          <KeyValue label="Metric version" value={`v${metric.metric_version}`} />
          <KeyValue label="Registry" value={metric.registry_version} />
          <KeyValue label="Aggregation" value={metric.aggregation_version} />
        </dl>
      </details>
    </article>
  );
}

function ObservabilityMetricGrid({
  metrics,
  emptyLabel,
  compact = false,
  showScope = false,
}: {
  metrics: DeltaHqObservabilityMetric[];
  emptyLabel: string;
  compact?: boolean;
  showScope?: boolean;
}) {
  if (metrics.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={`grid gap-4 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-2 xl:grid-cols-3"}`}>
      {metrics.map((metric) => (
        <ObservabilityMetricCard
          key={`${metric.current_state_applicability}-${metric.metric_id}`}
          metric={metric}
          compact={compact}
          showScope={showScope}
        />
      ))}
    </div>
  );
}

function ObservabilityProjectionSummary({ model }: { model: DeltaHqViewModel }) {
  const projection = model.observability.projection;

  return (
    <section className="grid gap-4 lg:grid-cols-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Projection</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">
          {projection.status === "available" ? "Available" : "Unavailable"}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">{projection.promotionScope}</p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Trust states</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">
          {observabilitySummaryLabel(projection.trust_summary)}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Accepted sources</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">
          {projection.event_acceptance_summary.accepted_source_event_count}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {projection.event_acceptance_summary.rejected_source_event_count} rejected, {projection.event_acceptance_summary.invalid_raw_event_count} invalid
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Latest source</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">
          {formatOptionalTime(projection.latest_accepted_source_time)}
        </p>
      </div>
    </section>
  );
}

function ObservabilitySurfaceSection({
  title,
  detail,
  metrics,
}: {
  title: string;
  detail: string;
  metrics: DeltaHqObservabilityMetric[];
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
        </div>
        <Badge className="border-zinc-300 bg-zinc-50 text-zinc-800">{metrics.length} metrics</Badge>
      </div>
      <div className="mt-4">
        <ObservabilityMetricGrid
          metrics={metrics}
          compact
          emptyLabel={`No ${title} metrics are available in the projection.`}
        />
      </div>
    </section>
  );
}

function FixturePanelSummary({
  panels,
  title = "Fixture-only future panels",
}: {
  panels: DeltaHqDepartmentPerformancePanel[];
  title?: string;
}) {
  if (panels.length === 0) return null;

  return (
    <details className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-amber-950">{title}</summary>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {panels.map((panel) => (
          <TrendVisualizationCard key={panel.id} trend={panel} compact />
        ))}
      </div>
    </details>
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
  const projection = model.observability.projection;
  const briefMetrics = selectExecutiveBriefMetrics(projection);
  const briefMetricIds = uniqueMetricIds(briefMetrics);
  const trustedCurrentMetrics = currentTrustedObservabilityMetrics(projection);
  const notableBriefGaps = degradedObservabilityMetrics(projection)
    .filter((metric) => briefMetricIds.has(metric.metric_id))
    .slice(0, 4);

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
              onClick={() => onOpenView("evolution")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
            >
              Evolution
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

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Organization</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">{model.observability.departments.length}</p>
          <p className="mt-2 text-sm text-zinc-600">department pages prepared</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Evolution</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">{model.evolution.entries.length}</p>
          <p className="mt-2 text-sm text-zinc-600">Historian milestones</p>
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
            kicker="Observability facts"
            title="Current read-only measurements"
            detail="Phase 1 telemetry is rendered as supplied trust-labeled evidence. HQ does not produce a composite executive health score."
          />
          <div className="flex flex-wrap gap-2">
            <Badge className="border-emerald-300 bg-emerald-50 text-emerald-950">
              {trustedCurrentMetrics.length} trusted current
            </Badge>
            <Badge className="border-zinc-300 bg-zinc-50 text-zinc-800">
              {notableBriefGaps.length} notable unavailable or degraded
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onOpenView("analytics")}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
          >
            Analytics
          </button>
        </div>
        {briefMetrics.length > 0 ? (
          <ObservabilityMetricGrid
            metrics={briefMetrics}
            compact
            showScope
            emptyLabel="No read-only Observability metrics are available for the Brief."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {model.observability.briefTrends.map((trend) => (
              <TrendVisualizationCard key={trend.id} trend={trend} compact />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrganizationView({
  agents,
  departments,
  projection,
  selectedAgentId,
  selectedDepartmentId,
  onSelectAgent,
  onSelectDepartment,
  onOpenAnalytics,
}: {
  agents: DeltaHqAgent[];
  departments: DeltaHqDepartment[];
  projection: DeltaHqViewModel["observability"]["projection"];
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
        detail="Department pages show canonical Observability metrics where accepted evidence exists. Future-only panels remain labeled as fixtures."
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
            metrics={metricsForDepartment(projection, selectedDepartment.id)}
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
  metrics,
  onSelectAgent,
  onOpenAnalytics,
}: {
  department: DeltaHqDepartment;
  agents: DeltaHqAgent[];
  metrics: DeltaHqObservabilityMetric[];
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
        <h4 className="text-sm font-semibold text-zinc-950">Department measurements</h4>
        <button
          type="button"
          onClick={onOpenAnalytics}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
        >
          Analytics
        </button>
      </div>
      <div className="mt-4 grid gap-4">
        <ObservabilityMetricGrid
          metrics={metrics}
          compact
          emptyLabel="No canonical Observability metric is mapped to this department yet."
        />
        <FixturePanelSummary panels={department.performancePanels} />
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

function EvolutionStory({
  entries,
  selectedTrack,
  onSelectMilestone,
}: {
  entries: DeltaHqEvolutionMilestone[];
  selectedTrack: DeltaHqLineageTrackId;
  onSelectMilestone: (milestoneId: string) => void;
}) {
  const trackEntries = entries.filter((entry) => entry.lineage_tracks.includes(selectedTrack));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={lineageStyles[selectedTrack]}>
          {selectedTrack === "product_intelligence" ? "Product / Intelligence" : selectedTrack === "engineering_agentic" ? "Engineering / Agentic" : "Converged"}
        </Badge>
        <Badge className="border-zinc-300 bg-zinc-50 text-zinc-800">{trackEntries.length} milestones</Badge>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {trackEntries.map((entry, index) => (
          <span key={entry.milestone_id} className="inline-flex items-center gap-2">
            {index > 0 && <span className="text-zinc-400">-&gt;</span>}
            <button
              type="button"
              onClick={() => onSelectMilestone(entry.milestone_id)}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-900 hover:border-zinc-950"
            >
              {entry.milestone}
            </button>
          </span>
        ))}
        {trackEntries.length === 0 && (
          <p className="text-sm leading-6 text-zinc-600">No Historian milestone currently occupies this lineage.</p>
        )}
      </div>
    </div>
  );
}

function MilestoneRelationshipList({
  title,
  ids,
  entriesById,
  onSelectMilestone,
}: {
  title: string;
  ids: string[];
  entriesById: Map<string, DeltaHqEvolutionMilestone>;
  onSelectMilestone: (milestoneId: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ids.length === 0 ? (
          <span className="text-sm text-zinc-600">None</span>
        ) : (
          ids.map((id) => {
            const entry = entriesById.get(id);
            return entry ? (
              <button
                key={id}
                type="button"
                onClick={() => onSelectMilestone(id)}
                className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-800"
              >
                {entry.milestone}
              </button>
            ) : (
              <Badge key={id} className="border-amber-300 bg-amber-50 text-amber-950">{id}</Badge>
            );
          })
        )}
      </div>
    </div>
  );
}

function MilestoneDetail({
  milestone,
  entriesById,
  onSelectMilestone,
}: {
  milestone: DeltaHqEvolutionMilestone | undefined;
  entriesById: Map<string, DeltaHqEvolutionMilestone>;
  onSelectMilestone: (milestoneId: string) => void;
}) {
  if (!milestone) {
    return (
      <aside className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-semibold text-zinc-950">Milestone detail</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Select a milestone to inspect its Historian evidence.</p>
      </aside>
    );
  }

  return (
    <aside id={`milestone-${milestone.milestone_id}`} className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{formatDate(milestone.date)}</p>
          <h3 className="mt-2 text-2xl font-semibold leading-8 text-zinc-950">{milestone.milestone}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={significanceStyles[milestone.significance] || significanceStyles.major}>{milestone.significance}</Badge>
          <Badge className={confidenceStyles[milestone.evidence_confidence] || confidenceStyles.medium}>
            {milestone.evidence_confidence} confidence
          </Badge>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 md:grid-cols-2">
        <KeyValue label="What changed" value={milestone.concise_description} />
        <KeyValue label="Why it mattered" value={milestone.major_capability_gained} />
        <KeyValue label="Evidence status" value={milestone.evidence_mode} />
        <KeyValue
          label="Lineage"
          value={
            <span className="flex flex-wrap gap-2">
              {milestone.lineage_tracks.map((track) => (
                <Badge key={track} className={lineageStyles[track]}>{track.replaceAll("_", " ")}</Badge>
              ))}
            </span>
          }
        />
      </dl>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <MilestoneRelationshipList
          title="Predecessors"
          ids={milestone.predecessor_milestones}
          entriesById={entriesById}
          onSelectMilestone={onSelectMilestone}
        />
        <MilestoneRelationshipList
          title="Successors"
          ids={milestone.successor_milestones}
          entriesById={entriesById}
          onSelectMilestone={onSelectMilestone}
        />
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <h4 className="text-sm font-semibold text-zinc-950">Claim classification</h4>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Directly evidenced</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              {milestone.claim_summary.directly_evidenced.length || 0} claims
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Inferred</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              {milestone.claim_summary.strongly_inferred.length || 0} claims
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Unresolved</p>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              {milestone.claim_summary.unresolved.length || 0} claims
            </p>
          </div>
        </div>
      </section>

      <details className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-950">Supporting evidence refs</summary>
        <div className="mt-3 grid gap-3">
          {milestone.evidence_references.map((reference) => (
            <div key={`${reference.ref}-${reference.claim_classification}`} className="rounded-md border border-zinc-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={confidenceStyles[reference.confidence] || confidenceStyles.medium}>
                  {reference.confidence}
                </Badge>
                <Badge className="border-zinc-300 bg-zinc-50 text-zinc-800">{reference.claim_classification}</Badge>
                {reference.kind && <Badge className="border-zinc-300 bg-white text-zinc-700">{reference.kind}</Badge>}
              </div>
              <p className="mt-2 break-words text-xs font-semibold text-zinc-700">{reference.ref}</p>
              {reference.summary && <p className="mt-2 text-sm leading-6 text-zinc-600">{reference.summary}</p>}
            </div>
          ))}
        </div>
      </details>

      {milestone.record_ref && (
        <p className="mt-4 break-words text-xs text-zinc-500">Historian record: {milestone.record_ref}</p>
      )}
    </aside>
  );
}

function EvolutionView({
  model,
  selectedMilestoneId,
  selectedTrack,
  onSelectMilestone,
  onSelectTrack,
  onOpenAnalytics,
}: {
  model: DeltaHqViewModel;
  selectedMilestoneId: string;
  selectedTrack: EvolutionTrackFilter;
  onSelectMilestone: (milestoneId: string) => void;
  onSelectTrack: (track: EvolutionTrackFilter) => void;
  onOpenAnalytics: () => void;
}) {
  const evolution = model.evolution;
  const entriesById = milestoneById(evolution.entries);
  const selectedMilestone = entriesById.get(selectedMilestoneId) || evolution.entries[0];
  const filteredEntries = selectedTrack === "all"
    ? evolution.entries
    : evolution.entries.filter((entry) => entry.lineage_tracks.includes(selectedTrack));

  if (evolution.fixtureFallback && evolution.entries.length === 0) {
    return (
      <div className="grid gap-6">
        <SectionTitle
          kicker="Evolution"
          title="Historian milestone timeline unavailable"
          detail="HQ is ready to render Historian projections, but no milestone timeline is available to this web runtime."
        />
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          {evolution.unavailableReason || "Historian runtime unavailable."}
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Evolution"
        title="From health intelligence to Intelligence OS"
        detail="This timeline is rendered from read-only Historian projections. HQ preserves confidence, unresolved evidence, and lineage without rewriting milestone truth."
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Window</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">
            {formatDate(evolution.timeline_window.from)} to {formatDate(evolution.timeline_window.to)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Milestones</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">{evolution.entries.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Source</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">{evolution.source_of_truth}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Boundary</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">Read-only Historian projection</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <EvolutionStory
          entries={evolution.entries}
          selectedTrack="product_intelligence"
          onSelectMilestone={onSelectMilestone}
        />
        <EvolutionStory
          entries={evolution.entries}
          selectedTrack="engineering_agentic"
          onSelectMilestone={onSelectMilestone}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Timeline</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">Filter by Historian lineage track.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "product_intelligence", "engineering_agentic", "converged_platform"] as EvolutionTrackFilter[]).map((track) => (
                  <button
                    key={track}
                    type="button"
                    onClick={() => onSelectTrack(track)}
                    className={`rounded-md px-3 py-2 text-xs font-semibold ${
                      selectedTrack === track ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white text-zinc-900"
                    }`}
                  >
                    {track === "all" ? "All" : track === "product_intelligence" ? "Product" : track === "engineering_agentic" ? "Engineering" : "Converged"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {evolution.lineage_tracks.map((track) => {
            const trackEntries = filteredEntries.filter((entry) => entry.lineage_tracks.includes(track.id));
            if (selectedTrack !== "all" && selectedTrack !== track.id) return null;

            return (
              <article key={track.id} className="rounded-lg border border-zinc-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={lineageStyles[track.id]}>{track.label}</Badge>
                      <Badge className="border-zinc-300 bg-zinc-50 text-zinc-800">{trackEntries.length} visible</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">{track.description}</p>
                  </div>
                </div>

                {trackEntries.length === 0 ? (
                  <p className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
                    {track.id === "converged_platform" ? evolution.convergence.explanation : "No milestones in this filtered track."}
                  </p>
                ) : (
                  <div className={`mt-5 grid gap-3 border-l-2 pl-4 ${lineageRailStyles[track.id]}`}>
                    {trackEntries.map((entry) => (
                      <button
                        key={`${track.id}-${entry.milestone_id}`}
                        type="button"
                        onClick={() => onSelectMilestone(entry.milestone_id)}
                        className={`rounded-lg border bg-white p-4 text-left transition ${
                          selectedMilestone?.milestone_id === entry.milestone_id ? "border-zinc-950 shadow-sm" : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{formatDate(entry.date)}</span>
                          <Badge className={significanceStyles[entry.significance] || significanceStyles.major}>{entry.significance}</Badge>
                          <Badge className={confidenceStyles[entry.evidence_confidence] || confidenceStyles.medium}>
                            {entry.evidence_confidence} confidence
                          </Badge>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-zinc-950">{entry.milestone}</h3>
                        <p className="mt-2 text-sm leading-6 text-zinc-600">{entry.concise_description}</p>
                        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-900">{entry.major_capability_gained}</p>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <MilestoneDetail
          milestone={selectedMilestone}
          entriesById={entriesById}
          onSelectMilestone={onSelectMilestone}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="text-base font-semibold text-zinc-950">Analytics annotation seam</h3>
          <div className="mt-4 grid gap-2">
            {evolution.analyticsAnnotationSeams.map((item) => (
              <p key={item} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                {item}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="mt-4 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
          >
            Open Analytics
          </button>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="text-base font-semibold text-zinc-950">Ask Delta prompts</h3>
          <div className="mt-4 grid gap-2">
            {evolution.askDeltaSuggestedQuestions.map((question) => (
              <p key={question} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                {question}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalyticsView({
  model,
  onOpenDepartment,
}: {
  model: DeltaHqViewModel;
  onOpenDepartment: (departmentId: string) => void;
}) {
  const projection = model.observability.projection;
  const eventBusMetrics = metricsForScope(projection, "event_bus");
  const missionControlMetrics = metricsForScope(projection, "mission_control");
  const organizationMetrics = metricsForScope(projection, "organization");
  const historicalEvidenceMetrics = projection.historicalMetrics
    .filter((metric) => metric.source_event_count > 0 || metric.value !== null || metric.trust_state !== "missing")
    .slice(0, 8);

  return (
    <div className="grid gap-6">
      <SectionTitle
        kicker="Analytics"
        title="Organizational Observability surface"
        detail={model.observability.status}
      />

      <ObservabilityProjectionSummary model={model} />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Contract owner</p>
          <p className="mt-2 text-lg font-semibold text-zinc-950">{model.observability.contractOwner}</p>
          <dl className="mt-5 border-t border-zinc-200 pt-4">
            <KeyValue label="Registry" value={projection.registry_version || "Unavailable"} />
            <KeyValue label="Aggregation" value={projection.aggregation_version || "Unavailable"} />
            <KeyValue label="Current applicability" value={titleCaseState(projection.current_state_applicability)} />
            <KeyValue label="Current qualification epoch" value={projection.current_qualification_epoch || "None"} />
          </dl>
          <div className="mt-5 border-t border-zinc-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Guardrails</p>
            <div className="mt-3 grid gap-2">
              {[...projection.authorityLimitations, ...model.observability.guardedSemantics].map((item) => (
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

      <section className="grid gap-4">
        <SectionTitle
          kicker="Current"
          title="Read-only operational measurements"
          detail="Current cards render only the supplied projection states. Missing, stale, untrusted, conflicted, unpriced, partial, and fixture states remain visible."
        />
        <ObservabilitySurfaceSection
          title="Event Bus"
          detail="Events received, dispatches, wake success, queue depth, dispatch latency, blocked dispatch, backpressure, and failure measures where supplied."
          metrics={eventBusMetrics}
        />
        <ObservabilitySurfaceSection
          title="Mission Control"
          detail="Current Mission Control metrics render only when current trusted evidence exists. Qualification evidence is separated below."
          metrics={missionControlMetrics}
        />
        <ObservabilitySurfaceSection
          title="Organization"
          detail="Organization-level metrics are limited to accepted evidence from the projection; HQ does not fabricate autonomy or health."
          metrics={organizationMetrics}
        />
      </section>

      <section className="grid gap-4">
        <SectionTitle
          kicker="Historical"
          title="Historical and qualification evidence"
          detail="Historical projection points and prior qualification epochs stay separate from current operational measurement."
        />
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-950">Historical projection</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Historical values may be fixture or prior evidence. They are not rendered as current health.
              </p>
            </div>
            <Badge className="border-zinc-300 bg-zinc-50 text-zinc-800">
              {projection.historicalMetrics.length} registered
            </Badge>
          </div>
          <div className="mt-4">
            <ObservabilityMetricGrid
              metrics={historicalEvidenceMetrics}
              compact
              showScope
              emptyLabel="No historical metrics with accepted evidence are available."
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-950">Qualification epochs</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Epoch projections are inspectable as prior qualification evidence and never promoted into current state.
              </p>
            </div>
            <Badge className="border-zinc-300 bg-zinc-50 text-zinc-800">
              {projection.available_qualification_epochs.length} available
            </Badge>
          </div>
          <div className="mt-4 grid gap-4">
            {projection.qualificationEpochs.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
                No accepted qualification epoch projection is available.
              </p>
            ) : (
              projection.qualificationEpochs.map((epoch) => (
                <details key={epoch.epoch_id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-950">
                    {epoch.epoch_id} - {observabilitySummaryLabel(epoch.trust_summary)}
                  </summary>
                  <div className="mt-4">
                    <ObservabilityMetricGrid
                      metrics={epoch.metrics}
                      compact
                      showScope
                      emptyLabel="No metrics are present for this qualification epoch."
                    />
                  </div>
                </details>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-semibold text-zinc-950">Milestone annotations</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Historian milestones can annotate future Organizational Observability trends when a canonical projection links the milestone to the metric and time window.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {model.evolution.analyticsAnnotationSeams.map((item) => (
            <p key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
              {item}
            </p>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="Departments"
          title="Department measurement surfaces"
          detail="Department dashboards combine projection-backed metrics with visibly labeled fixture-only future panels."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {model.observability.departments.map((department) => (
            <article key={department.id} className="rounded-lg border border-zinc-200 bg-white p-5">
              {(() => {
                const departmentMetrics = metricsForDepartment(projection, department.id);
                return (
                  <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{department.owner}</p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-950">{department.name}</h3>
                </div>
                <Badge className={sourceStyles[department.sourceKind]}>{sourceLabel(department.sourceKind)}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{department.mission}</p>
              <div className="mt-4 grid gap-4">
                <ObservabilityMetricGrid
                  metrics={departmentMetrics}
                  compact
                  emptyLabel="No canonical metric is mapped to this department yet."
                />
                <FixturePanelSummary panels={department.performancePanels} />
              </div>
              <button
                type="button"
                onClick={() => onOpenDepartment(department.id)}
                className="mt-4 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
              >
                Open department
              </button>
                  </>
                );
              })()}
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
  askContext,
}: {
  runtimeStatus: DeltaDesktopStatus | null;
  currentView: HqView;
  askContext: string;
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
        message: `[Delta HQ ${currentView}${askContext ? ` | ${askContext}` : ""}] ${message}`,
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
              {askContext && <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{askContext}</p>}
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
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(model.evolution.entries[0]?.milestone_id || "");
  const [selectedEvolutionTrack, setSelectedEvolutionTrack] = useState<EvolutionTrackFilter>("all");
  const [runtimeStatus, setRuntimeStatus] = useState<DeltaDesktopStatus | null>(null);
  const [serviceLogs, setServiceLogs] = useState<Record<string, DeltaDesktopServiceStatus["logLines"]> | null>(null);

  const selectedViewLabel = useMemo(
    () => views.find((view) => view.id === currentView)?.label || "Brief",
    [currentView],
  );

  const selectedMilestone = useMemo(
    () => model.evolution.entries.find((entry) => entry.milestone_id === selectedMilestoneId) || model.evolution.entries[0],
    [model.evolution.entries, selectedMilestoneId],
  );

  const askDeltaContext = useMemo(() => {
    const projection = model.observability.projection;
    if (currentView === "evolution" && selectedMilestone) {
      return [
        `Evolution selected milestone: ${selectedMilestone.milestone}`,
        `date: ${formatDate(selectedMilestone.date)}`,
        `tracks: ${selectedMilestone.lineage_tracks.join(", ")}`,
        `confidence: ${selectedMilestone.evidence_confidence}`,
        `evidence: ${selectedMilestone.evidence_mode}`,
        `timeline: ${formatDate(model.evolution.timeline_window.from)} to ${formatDate(model.evolution.timeline_window.to)}`,
      ].join("; ");
    }
    if (currentView === "analytics") {
      return [
        `Observability projection: ${projection.status}`,
        `promotion: ${projection.promotionScope}`,
        `current applicability: ${projection.current_state_applicability}`,
        `trust summary: ${observabilitySummaryLabel(projection.trust_summary)}`,
        `accepted sources: ${projection.event_acceptance_summary.accepted_source_event_count}`,
        "no composite executive health authority",
      ].join("; ");
    }
    if (currentView === "organization") {
      const department = model.observability.departments.find((item) => item.id === selectedDepartmentId);
      const departmentMetrics = metricsForDepartment(projection, selectedDepartmentId);
      return [
        department ? `Selected department: ${department.name}` : "Selected department unavailable",
        `projection metrics: ${departmentMetrics.map((metric) => `${metric.metric_id}:${metric.trust_state}`).join(", ") || "none"}`,
        "department fixtures are not production measurements",
      ].join("; ");
    }
    return "";
  }, [
    currentView,
    model.evolution.timeline_window.from,
    model.evolution.timeline_window.to,
    model.observability.departments,
    model.observability.projection,
    selectedDepartmentId,
    selectedMilestone,
  ]);

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
      if (hash.startsWith("milestone-")) {
        const milestoneId = hash.replace(/^milestone-/, "");
        const milestone = model.evolution.entries.find((entry) => entry.milestone_id === milestoneId);
        if (milestone) {
          setSelectedMilestoneId(milestoneId);
          setSelectedEvolutionTrack(milestone.lineage_tracks[0] || "all");
          setCurrentView("evolution");
        }
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
  }, [model.evolution.entries, model.observability.departments, model.organization, model.reviews]);

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

  function openMilestone(milestoneId: string) {
    const milestone = model.evolution.entries.find((entry) => entry.milestone_id === milestoneId);
    setSelectedMilestoneId(milestoneId);
    if (milestone?.lineage_tracks[0]) setSelectedEvolutionTrack(milestone.lineage_tracks[0]);
    setCurrentView("evolution");
    window.history.replaceState(null, "", `#milestone-${milestoneId}`);
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
                projection={model.observability.projection}
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
            {currentView === "evolution" && (
              <EvolutionView
                model={model}
                selectedMilestoneId={selectedMilestoneId}
                selectedTrack={selectedEvolutionTrack}
                onSelectMilestone={openMilestone}
                onSelectTrack={setSelectedEvolutionTrack}
                onOpenAnalytics={() => openView("analytics")}
              />
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

        <AskDeltaPanel runtimeStatus={runtimeStatus} currentView={currentView} askContext={askDeltaContext} />
      </div>
    </div>
  );
}
