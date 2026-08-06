import type {
  DeltaHqObservabilityMetric,
  DeltaHqObservabilityProjection,
  DeltaHqObservabilityTimeSeriesPoint,
  DeltaHqObservabilityTrustState,
} from "./deltaHqViewModel";

export const OBSERVABILITY_PROMOTION_SCOPE = "trust-labeled read-only display";

export const OBSERVABILITY_AUTHORITY_LIMITATIONS = [
  "Not an executive health authority.",
  "Not a Mission Control reasoning input.",
  "Not an anomaly-triggered Event Bus input.",
];

export const OBSERVABILITY_TRUST_STATES: DeltaHqObservabilityTrustState[] = [
  "trusted",
  "partial",
  "stale",
  "untrusted",
  "conflicted",
  "missing",
  "unpriced",
  "fixture",
];

export function metricShortName(metricId: string): string {
  return metricId
    .split(".")
    .slice(1)
    .join(" ")
    .replaceAll("_", " ");
}

export function metricDisplayTitle(metric: Pick<DeltaHqObservabilityMetric, "metric_id" | "title">): string {
  return metric.title || metricShortName(metric.metric_id);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  }).format(value);
}

export function formatMetricUnit(unit: string): string {
  if (unit === "milliseconds") return "ms";
  if (unit === "usd") return "USD";
  if (unit === "count_per_workflow") return "per workflow";
  return unit;
}

export function formatObservabilityMetricValue(
  metric: Pick<DeltaHqObservabilityMetric, "value" | "unit" | "trust_state" | "data_quality_state">,
): string {
  if (metric.trust_state === "unpriced" || metric.data_quality_state === "unpriced") return "Unpriced";
  if (metric.value === null || metric.value === undefined) return "Unavailable";
  return `${formatNumber(metric.value)} ${formatMetricUnit(metric.unit)}`.trim();
}

export function currentApplicabilityLabel(metric: Pick<DeltaHqObservabilityMetric, "current_state_applicability">): string {
  if (metric.current_state_applicability === "current_only") return "Current measurement";
  if (metric.current_state_applicability === "historical") return "Historical trend";
  if (metric.current_state_applicability === "qualification_epoch") return "Qualification epoch";
  if (!metric.current_state_applicability || metric.current_state_applicability === "unavailable") return "Unavailable";
  return metric.current_state_applicability.replaceAll("_", " ");
}

export function canRenderAsCurrentOperationalMeasurement(
  metric: Pick<
    DeltaHqObservabilityMetric,
    "value" | "trust_state" | "data_quality_state" | "source_freshness" | "current_state_applicability"
  >,
): boolean {
  return metric.trust_state === "trusted"
    && metric.data_quality_state === "complete"
    && metric.current_state_applicability === "current_only"
    && metric.source_freshness?.state !== "stale"
    && metric.source_freshness?.state !== "missing"
    && metric.value !== null
    && metric.value !== undefined;
}

export function metricOperationalStateLabel(
  metric: Pick<
    DeltaHqObservabilityMetric,
    "value" | "trust_state" | "data_quality_state" | "source_freshness" | "current_state_applicability" | "missing_reason"
  >,
): string {
  if (metric.trust_state === "fixture") return "Fixture evidence";
  if (metric.trust_state === "unpriced" || metric.data_quality_state === "unpriced") return "Unpriced";
  if (metric.trust_state === "missing") return "Unavailable";
  if (metric.trust_state === "stale" || metric.source_freshness?.state === "stale") return "Stale";
  if (metric.trust_state === "conflicted") return "Conflicted";
  if (metric.trust_state === "untrusted") return "Untrusted";
  if (metric.trust_state === "partial") return "Partial evidence";
  if (canRenderAsCurrentOperationalMeasurement(metric)) return "Measured";
  if (metric.current_state_applicability !== "current_only") return currentApplicabilityLabel(metric);
  if (metric.value === null || metric.value === undefined) return "Unavailable";
  return metric.trust_state;
}

export function metricUnavailableReason(
  metric: Pick<DeltaHqObservabilityMetric, "missing_reason" | "trust_state" | "data_quality_state">,
): string | null {
  if (metric.trust_state === "unpriced" || metric.data_quality_state === "unpriced") return "cost_not_priced";
  return metric.missing_reason || null;
}

export function metricsForScope(
  projection: Pick<DeltaHqObservabilityProjection, "metricsByScope" | "metrics">,
  scope: string,
): DeltaHqObservabilityMetric[] {
  return projection.metricsByScope[scope] || projection.metrics.filter((metric) => metric.scope === scope);
}

export function selectExecutiveBriefMetrics(projection: DeltaHqObservabilityProjection): DeltaHqObservabilityMetric[] {
  const preferredIds = [
    "event_bus.events_received",
    "event_bus.wake_success_rate",
    "event_bus.queue_depth",
    "mission_control.event_task_success_rate",
    "mission_control.cost_per_successful_event",
    "organization.autonomy_ratio",
  ];
  const byId = new Map(projection.metrics.map((metric) => [metric.metric_id, metric]));
  return preferredIds.map((id) => byId.get(id)).filter(Boolean) as DeltaHqObservabilityMetric[];
}

export function degradedObservabilityMetrics(projection: DeltaHqObservabilityProjection): DeltaHqObservabilityMetric[] {
  return projection.metrics.filter((metric) =>
    ["missing", "stale", "untrusted", "conflicted", "unpriced", "fixture", "partial"].includes(metric.trust_state),
  );
}

export function currentTrustedObservabilityMetrics(projection: DeltaHqObservabilityProjection): DeltaHqObservabilityMetric[] {
  return projection.metrics.filter(canRenderAsCurrentOperationalMeasurement);
}

export function scopeLabel(scope: string): string {
  if (scope === "event_bus") return "Event Bus";
  if (scope === "mission_control") return "Mission Control";
  if (scope === "organization") return "Organization";
  return scope.replaceAll("_", " ");
}

export function scopedTimeSeriesPoints(
  points: DeltaHqObservabilityTimeSeriesPoint[],
  metricId: string,
): DeltaHqObservabilityTimeSeriesPoint[] {
  return points.filter((point) => point.metric_id === metricId);
}
