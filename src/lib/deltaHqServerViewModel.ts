import path from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  DELTA_HQ_VIEW_MODEL,
  type DeltaHqEvolutionMilestone,
  type DeltaHqEvolutionProjection,
  type DeltaHqIssue,
  type DeltaHqIssuePriority,
  type DeltaHqIssueProjection,
  type DeltaHqIssueSeverity,
  type DeltaHqIssueSourceGap,
  type DeltaHqIssueSourceSystem,
  type DeltaHqIssueState,
  type DeltaHqLineageTrackId,
  type DeltaHqMilestoneClaims,
  type DeltaHqMilestoneEvidenceReference,
  type DeltaHqObservabilityDimensionValues,
  type DeltaHqObservabilityEpochProjection,
  type DeltaHqObservabilityFreshness,
  type DeltaHqObservabilityMetric,
  type DeltaHqObservabilityProjection,
  type DeltaHqObservabilityProjectionDiagnostics,
  type DeltaHqObservabilityTimeSeriesPoint,
  type DeltaHqViewModel,
} from "./deltaHqViewModel";
import {
  OBSERVABILITY_AUTHORITY_LIMITATIONS,
  OBSERVABILITY_PROMOTION_SCOPE,
} from "./deltaHqObservability";

type HistorianMilestoneDetail = {
  milestone_id: string;
  recorded_at?: string;
  title?: string;
  summary?: string;
  significance?: string | {
    level?: string;
    reasons?: string[];
  };
  lineage_tracks?: string[];
  affected_initiatives?: string[];
  affected_capabilities?: string[];
  major_capability_gained?: string;
  predecessor_milestones?: string[];
  successor_milestones?: string[];
  evidence_confidence?: string;
  evidence_references?: Array<string | Partial<DeltaHqMilestoneEvidenceReference>>;
  claim_summary?: Partial<DeltaHqMilestoneClaims>;
  record_ref?: string;
  milestone_ref?: string;
};

type HistorianTimelineEntry = {
  milestone_id: string;
  recorded_at?: string;
  date?: string;
  title?: string;
  milestone?: string;
  significance: string;
};

type HistorianInspection = {
  inspected_at: string;
  status: string;
  availability?: {
    reason?: string;
  };
  milestones: HistorianMilestoneDetail[];
  read_only_boundary: DeltaHqEvolutionProjection["read_only_boundary"];
};

type HistorianTimeline = {
  generated_at: string;
  status: string;
  report_type?: string;
  timeline_window?: DeltaHqEvolutionProjection["timeline_window"];
  entries?: HistorianTimelineEntry[];
  timeline?: HistorianTimelineEntry[];
  read_only_boundary: DeltaHqEvolutionProjection["read_only_boundary"];
  source_boundary?: {
    source_of_truth?: string;
    milestones_primary?: boolean;
    packet_event_supporting_only?: boolean;
    unsupported_claims_present?: boolean;
  };
};

type HistorianMilestoneModule = {
  inspectHistorianMilestones: (args: { repoRoot: string; track?: string; significance?: string; limit?: number }) => HistorianInspection;
  buildEvolutionTimeline?: (args: { repoRoot: string; track?: string; limit?: number }) => HistorianTimeline;
  generateExecutiveMilestoneReport?: (args: { repoRoot: string; reportType: string; since?: string; limit?: number }) => HistorianTimeline;
};

type JsonRecord = Record<string, unknown>;

type OrganizationalObservabilityModule = {
  aggregateFromStore: (args: {
    repoRoot: string;
    storeRoot?: string | null;
    producerKeys?: Record<string, string> | null;
    mode?: "current" | "historical" | "qualification_epoch";
    qualificationEpoch?: string | null;
  }) => JsonRecord;
};

type AgentRepoRootInfo = {
  repoRoot: string;
  source: string;
  warning: string | null;
};

type RawStoreInspection = {
  raw_event_count: number;
  invalid_raw_event_count: number;
  newest_raw_event_time: string | null;
};

type StoredProjectionRead = {
  projection: JsonRecord;
  path: string;
};

const TRACKS: Array<{
  id: DeltaHqLineageTrackId;
  label: string;
  description: string;
}> = [
  {
    id: "product_intelligence",
    label: "Product / Intelligence evolution",
    description: "The product lineage from health intelligence toward Intelligence OS.",
  },
  {
    id: "engineering_agentic",
    label: "Engineering / Agentic evolution",
    description: "The engineering lineage from bounded supervision toward Mission Control and Historian dependency.",
  },
  {
    id: "converged_platform",
    label: "Converged platform",
    description: "Rendered only when Historian explicitly assigns a converged platform lineage.",
  },
];

function cloneBaseViewModel(): DeltaHqViewModel {
  return JSON.parse(JSON.stringify(DELTA_HQ_VIEW_MODEL)) as DeltaHqViewModel;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function ancestorDirs(start: string): string[] {
  const dirs: string[] = [];
  let current = path.resolve(start);
  while (current !== path.dirname(current)) {
    dirs.push(current);
    current = path.dirname(current);
  }
  dirs.push(current);
  return dirs;
}

function deltaWorkspaceRootCandidates(): string[] {
  return uniqueStrings([
    process.env.DELTA_WORKSPACE_ROOT,
    ...ancestorDirs(process.cwd())
      .flatMap((dir) => {
        const roots = [dir];
        if (path.basename(dir) === "delta-worktrees") roots.push(path.dirname(dir));
        return roots;
      })
      .filter((dir) =>
        existsSync(path.join(dir, "delta-worktrees")) || existsSync(path.join(dir, "delta-agent")),
      ),
  ]);
}

function agentWorktreeCandidates(workspaceRoot: string): string[] {
  const worktreesRoot = path.join(workspaceRoot, "delta-worktrees");
  if (!existsSync(worktreesRoot)) return [];
  return readdirSync(worktreesRoot)
    .filter((name) =>
      name.startsWith("agent-main-promotion-")
      || name.startsWith("agent-canonical-")
      || name.startsWith("agent-convergence-"),
    )
    .sort()
    .reverse()
    .map((name) => path.join(worktreesRoot, name));
}

function validateAgentRepoRoot(candidate: string): boolean {
  return existsSync(path.join(candidate, "src", "historian", "milestones.mjs"))
    && existsSync(path.join(candidate, "src", "observability", "aggregate.mjs"))
    && existsSync(path.join(candidate, "config", "organizational-metrics.json"));
}

function resolveAgentRepoRootInfo(): AgentRepoRootInfo {
  if (process.env.DELTA_AGENT_REPO_ROOT) {
    const repoRoot = process.env.DELTA_AGENT_REPO_ROOT;
    return {
      repoRoot,
      source: "DELTA_AGENT_REPO_ROOT",
      warning: validateAgentRepoRoot(repoRoot)
        ? null
        : "Configured DELTA_AGENT_REPO_ROOT does not expose required Historian and Observability contracts.",
    };
  }

  const candidates = uniqueStrings([
    process.env.DELTA_HQ_AGENT_REPO_ROOT,
    ...deltaWorkspaceRootCandidates().flatMap((workspaceRoot) => [
      path.join(workspaceRoot, "delta-worktrees", "agent-main-promotion-2026-08-06"),
      ...agentWorktreeCandidates(workspaceRoot),
      path.join(workspaceRoot, "delta-agent"),
    ]),
    path.resolve(process.cwd(), "..", "delta-agent"),
    path.resolve(process.cwd(), "delta-agent"),
  ]);

  const resolved = candidates.find(validateAgentRepoRoot);
  if (resolved) {
    return {
      repoRoot: resolved,
      source: "workspace sibling",
      warning: resolved.includes(`${path.sep}delta-worktrees${path.sep}`)
        ? "Resolved repo is inside delta-worktrees; verify this is the intended canonical agent worktree."
        : null,
    };
  }

  return {
    repoRoot: candidates[0],
    source: "workspace sibling fallback",
    warning: "No candidate exposed required Historian and Observability contracts.",
  };
}

function resolveAgentRepoRoot(): string {
  return resolveAgentRepoRootInfo().repoRoot;
}

async function loadHistorianMilestoneModule(repoRoot: string): Promise<HistorianMilestoneModule> {
  const modulePath = path.join(repoRoot, "src", "historian", "milestones.mjs");
  return await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ pathToFileURL(modulePath).href) as HistorianMilestoneModule;
}

async function loadOrganizationalObservabilityModule(repoRoot: string): Promise<OrganizationalObservabilityModule> {
  const modulePath = path.join(repoRoot, "src", "observability", "aggregate.mjs");
  return await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ pathToFileURL(modulePath).href) as OrganizationalObservabilityModule;
}

function defaultObservabilityStoreRoot(repoRoot: string): string {
  return path.join(repoRoot, "agent", "measurements", "organizational-observability");
}

function resolveObservabilityStoreRoot(): string | null {
  return process.env.DELTA_OBSERVABILITY_STORE_ROOT || null;
}

function actualObservabilityStoreRoot(repoRoot: string, storeRoot: string | null): string {
  return storeRoot || defaultObservabilityStoreRoot(repoRoot);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function numberRecord(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record(value))
      .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1])),
  );
}

function booleanRecord(value: unknown): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(record(value))
      .filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
  );
}

function normalizeFreshness(value: unknown): DeltaHqObservabilityFreshness {
  const sourceFreshness = record(value);
  return {
    state: stringValue(sourceFreshness.state, "missing"),
    latest_accepted_source_time: nullableString(sourceFreshness.latest_accepted_source_time),
    max_age_ms: nullableNumber(sourceFreshness.max_age_ms),
    sla_ms: nullableNumber(sourceFreshness.sla_ms),
  };
}

function normalizeAggregationWindow(value: unknown): DeltaHqObservabilityMetric["aggregation_window"] {
  const aggregationWindow = record(value);
  return {
    from: nullableString(aggregationWindow.from),
    to: nullableString(aggregationWindow.to),
    mode: stringValue(aggregationWindow.mode, "unavailable"),
    qualification_epoch: nullableString(aggregationWindow.qualification_epoch),
  };
}

function normalizeMeasurementTimeRange(value: unknown): DeltaHqObservabilityMetric["measurement_time_range"] {
  const measurementTimeRange = record(value);
  return {
    from: nullableString(measurementTimeRange.from),
    to: nullableString(measurementTimeRange.to),
  };
}

function normalizeDimensionValues(value: unknown): DeltaHqObservabilityDimensionValues {
  const dimensions: DeltaHqObservabilityDimensionValues = {};
  for (const [key, dimensionValue] of Object.entries(record(value))) {
    if (
      typeof dimensionValue === "string"
      || typeof dimensionValue === "number"
      || typeof dimensionValue === "boolean"
      || dimensionValue === null
    ) {
      dimensions[key] = dimensionValue;
    }
  }
  return dimensions;
}

function normalizeDimensionedPoints(
  value: unknown,
  projectionRecord: JsonRecord,
): DeltaHqObservabilityTimeSeriesPoint[] {
  return Array.isArray(value)
    ? value.map((point) => normalizeTimeSeriesPoint(point, projectionRecord))
    : [];
}

function normalizeMetric(value: unknown, projectionRecord: JsonRecord): DeltaHqObservabilityMetric {
  const metric = record(value);
  const dataQuality = record(metric.data_quality);
  const metricId = stringValue(metric.metric_id, "unknown.metric");
  const trustState = stringValue(metric.trust_state, "missing");
  const scope = stringValue(metric.scope, metricId.split(".")[0] || "unknown");

  return {
    metric_id: metricId,
    metric_version: finiteNumber(metric.metric_version, 0),
    registry_version: stringValue(metric.registry_version, stringValue(projectionRecord.registry_version, "unknown")),
    aggregation_version: stringValue(metric.aggregation_version, stringValue(projectionRecord.aggregation_version, "unknown")),
    title: stringValue(metric.title, metricId.split(".").slice(1).join(" ").replaceAll("_", " ")),
    owner: stringValue(metric.owner, scope),
    scope,
    value: nullableNumber(metric.value),
    unit: stringValue(metric.unit, "unknown"),
    trust_state: trustState,
    cost_trust_state: nullableString(metric.cost_trust_state),
    data_quality_state: stringValue(metric.data_quality_state, stringValue(dataQuality.state, trustState)),
    missing_reason: nullableString(metric.missing_reason) || nullableString(dataQuality.missing_reason),
    aggregation_window: normalizeAggregationWindow(metric.aggregation_window),
    measurement_time_range: normalizeMeasurementTimeRange(metric.measurement_time_range),
    source_freshness: normalizeFreshness(metric.source_freshness),
    latest_accepted_source_time: nullableString(metric.latest_accepted_source_time),
    current_state_applicability: stringValue(
      metric.current_state_applicability,
      stringValue(projectionRecord.current_state_applicability, "unavailable"),
    ),
    qualification_epochs: strings(metric.qualification_epochs),
    current_qualification_epoch: nullableString(metric.current_qualification_epoch)
      || nullableString(projectionRecord.current_qualification_epoch),
    source_event_count: finiteNumber(metric.source_event_count, 0),
    producer_identities: strings(metric.producer_identities),
    dimensioned_points: normalizeDimensionedPoints(metric.dimensioned_points, projectionRecord),
  };
}

function metricsByScope(metrics: DeltaHqObservabilityMetric[]): Record<string, DeltaHqObservabilityMetric[]> {
  const grouped: Record<string, DeltaHqObservabilityMetric[]> = {};
  for (const metric of metrics) {
    if (!grouped[metric.scope]) grouped[metric.scope] = [];
    grouped[metric.scope].push(metric);
  }
  return grouped;
}

function normalizeTimeSeriesPoint(value: unknown, projectionRecord: JsonRecord): DeltaHqObservabilityTimeSeriesPoint {
  const point = record(value);
  return {
    timestamp: stringValue(point.timestamp, stringValue(projectionRecord.generated_at, "")),
    metric_id: stringValue(point.metric_id, "unknown.metric"),
    metric_version: finiteNumber(point.metric_version, 0),
    registry_version: stringValue(point.registry_version, stringValue(projectionRecord.registry_version, "unknown")),
    aggregation_version: stringValue(point.aggregation_version, stringValue(projectionRecord.aggregation_version, "unknown")),
    value: nullableNumber(point.value),
    unit: stringValue(point.unit, "unknown"),
    trust_state: stringValue(point.trust_state, "missing"),
    cost_trust_state: nullableString(point.cost_trust_state),
    data_quality_state: stringValue(point.data_quality_state, stringValue(point.trust_state, "missing")),
    dimension_values: normalizeDimensionValues(point.dimension_values),
    aggregation_window: normalizeAggregationWindow(point.aggregation_window),
    measurement_time_range: normalizeMeasurementTimeRange(point.measurement_time_range),
    source_freshness_state: stringValue(point.source_freshness_state, "missing"),
    latest_accepted_source_time: nullableString(point.latest_accepted_source_time),
    source_event_count: finiteNumber(point.source_event_count, 0),
    qualification_epochs: strings(point.qualification_epochs),
    current_state_applicability: stringValue(
      point.current_state_applicability,
      stringValue(projectionRecord.current_state_applicability, "unavailable"),
    ),
  };
}

function normalizeDataQualitySummary(value: unknown): DeltaHqObservabilityProjection["data_quality_summary"] {
  const summary = record(value);
  return {
    metric_count: finiteNumber(summary.metric_count, 0),
    by_state: numberRecord(summary.by_state),
    raw_valid_event_count: finiteNumber(summary.raw_valid_event_count, 0),
    accepted_source_event_count: finiteNumber(summary.accepted_source_event_count, 0),
    rejected_source_event_count: finiteNumber(summary.rejected_source_event_count, 0),
    duplicate_source_event_count: finiteNumber(summary.duplicate_source_event_count, 0),
    invalid_raw_event_count: finiteNumber(summary.invalid_raw_event_count, 0),
  };
}

function normalizeEventAcceptanceSummary(value: unknown): DeltaHqObservabilityProjection["event_acceptance_summary"] {
  const summary = record(value);
  return {
    raw_valid_event_count: finiteNumber(summary.raw_valid_event_count, 0),
    accepted_source_event_count: finiteNumber(summary.accepted_source_event_count, 0),
    rejected_source_event_count: finiteNumber(summary.rejected_source_event_count, 0),
    duplicate_source_event_count: finiteNumber(summary.duplicate_source_event_count, 0),
    invalid_raw_event_count: finiteNumber(summary.invalid_raw_event_count, 0),
    rejected_by_reason: numberRecord(summary.rejected_by_reason),
  };
}

function emptyObservabilityReason({
  currentProjection,
  historicalProjection,
  rawStore,
}: {
  currentProjection: JsonRecord;
  historicalProjection: JsonRecord | null;
  rawStore: RawStoreInspection;
}): { reason: string | null; nextOwner: string | null; historicalOnly: boolean } {
  const currentAcceptance = normalizeEventAcceptanceSummary(currentProjection.event_acceptance_summary);
  const historicalAcceptance = historicalProjection
    ? normalizeEventAcceptanceSummary(historicalProjection.event_acceptance_summary)
    : null;

  if (currentAcceptance.accepted_source_event_count > 0) {
    return { reason: null, nextOwner: null, historicalOnly: false };
  }

  if (rawStore.raw_event_count === 0) {
    return {
      reason: "No raw Organizational Observability telemetry files exist in the configured measurement store.",
      nextOwner: "Canonical telemetry producers must emit signed events, or an approved Observability import must generate the projection.",
      historicalOnly: Boolean(historicalAcceptance && historicalAcceptance.accepted_source_event_count > 0),
    };
  }

  if (historicalAcceptance && historicalAcceptance.accepted_source_event_count > 0) {
    return {
      reason: "Canonical telemetry exists only as historical or qualification evidence; no accepted current-state events are available.",
      nextOwner: "Current-state eligible runtime, Event Bus, Governance, Provider Usage, or Evaluation producer.",
      historicalOnly: true,
    };
  }

  return {
    reason: "Raw telemetry exists, but no events were accepted for current display. Check producer signatures, current-state applicability, and qualification epoch state.",
    nextOwner: "Organizational Observability producer authentication and current-state eligibility.",
    historicalOnly: false,
  };
}

function buildProjectionDiagnostics({
  repoInfo,
  storeRoot,
  projectionPath,
  projectionSource,
  aggregationRanDynamically,
  storedProjectionUsed,
  storedProjectionStale,
  currentProjection,
  historicalProjection,
  rawStore,
  producerKeysConfigured,
}: {
  repoInfo: AgentRepoRootInfo;
  storeRoot: string;
  projectionPath: string | null;
  projectionSource: DeltaHqObservabilityProjectionDiagnostics["projection_source"];
  aggregationRanDynamically: boolean;
  storedProjectionUsed: boolean;
  storedProjectionStale: boolean;
  currentProjection: JsonRecord;
  historicalProjection: JsonRecord | null;
  rawStore: RawStoreInspection;
  producerKeysConfigured: boolean;
}): DeltaHqObservabilityProjectionDiagnostics {
  const currentAcceptance = normalizeEventAcceptanceSummary(currentProjection.event_acceptance_summary);
  const empty = emptyObservabilityReason({ currentProjection, historicalProjection, rawStore });
  return {
    repo_root: repoInfo.repoRoot,
    repo_root_source: repoInfo.source,
    repo_root_warning: repoInfo.warning,
    store_root: storeRoot,
    projection_path: projectionPath,
    projection_source: projectionSource,
    aggregation_ran_dynamically: aggregationRanDynamically,
    stored_projection_used: storedProjectionUsed,
    stored_projection_stale: storedProjectionStale,
    raw_event_count: rawStore.raw_event_count,
    accepted_source_event_count: currentAcceptance.accepted_source_event_count,
    rejected_source_event_count: currentAcceptance.rejected_source_event_count,
    invalid_raw_event_count: Math.max(currentAcceptance.invalid_raw_event_count, rawStore.invalid_raw_event_count),
    duplicate_source_event_count: currentAcceptance.duplicate_source_event_count,
    newest_raw_event_time: rawStore.newest_raw_event_time,
    newest_accepted_event_time: nullableString(currentProjection.latest_accepted_source_time),
    projection_generated_at: nullableString(currentProjection.generated_at),
    producer_keys_configured: producerKeysConfigured,
    empty_state_reason: empty.reason,
    next_event_owner: empty.nextOwner,
    historical_only: empty.historicalOnly,
  };
}

function inspectRawTelemetryStore(storeRoot: string): RawStoreInspection {
  const rawRoot = path.join(storeRoot, "raw");
  if (!existsSync(rawRoot)) {
    return { raw_event_count: 0, invalid_raw_event_count: 0, newest_raw_event_time: null };
  }

  let rawEventCount = 0;
  let invalidRawEventCount = 0;
  let newestRawEventTime: string | null = null;
  for (const name of readdirSync(rawRoot).filter((entry) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(entry)).sort()) {
    const file = path.join(rawRoot, name);
    for (const line of readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)) {
      try {
        const event = record(JSON.parse(line) as unknown);
        rawEventCount += 1;
        const occurredAt = nullableString(event.occurred_at);
        if (occurredAt && (!newestRawEventTime || Date.parse(occurredAt) > Date.parse(newestRawEventTime))) {
          newestRawEventTime = occurredAt;
        }
      } catch {
        invalidRawEventCount += 1;
      }
    }
  }

  return {
    raw_event_count: rawEventCount,
    invalid_raw_event_count: invalidRawEventCount,
    newest_raw_event_time: newestRawEventTime,
  };
}

function projectionIsOlderThanRaw(projection: JsonRecord, rawStore: RawStoreInspection): boolean {
  const generatedAt = nullableString(projection.generated_at);
  if (!generatedAt || !rawStore.newest_raw_event_time) return false;
  const generatedMs = Date.parse(generatedAt);
  const newestRawMs = Date.parse(rawStore.newest_raw_event_time);
  return Number.isFinite(generatedMs) && Number.isFinite(newestRawMs) && newestRawMs > generatedMs;
}

function observabilityProjectionPath(repoRoot: string, storeRoot: string | null): string {
  return path.join(
    actualObservabilityStoreRoot(repoRoot, storeRoot),
    "projections",
    "organizational-observability.json",
  );
}

function readStoredObservabilityProjection(repoRoot: string, storeRoot: string | null): StoredProjectionRead | null {
  const configuredPath = process.env.DELTA_OBSERVABILITY_PROJECTION_PATH;
  const defaultPath = observabilityProjectionPath(repoRoot, storeRoot);
  const candidates = [configuredPath, defaultPath].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const parsed = JSON.parse(readFileSync(candidate, "utf8")) as unknown;
    const projection = record(parsed);
    if (projection.projection_type === "organizational_observability") return { projection, path: candidate };
  }

  return null;
}

function loadObservabilityProducerKeys(): Record<string, string> | null {
  const raw = process.env.DELTA_OBSERVABILITY_PRODUCER_KEYS_JSON;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as unknown;
  const keys = Object.fromEntries(
    Object.entries(record(parsed))
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0),
  );
  return Object.keys(keys).length > 0 ? keys : null;
}

function normalizeEpochProjection(epochId: string, projection: JsonRecord): DeltaHqObservabilityEpochProjection {
  const metrics = Array.isArray(projection.metrics)
    ? projection.metrics.map((metric) => normalizeMetric(metric, projection))
    : [];
  const timeSeriesPoints = Array.isArray(projection.time_series_points)
    ? projection.time_series_points.map((point) => normalizeTimeSeriesPoint(point, projection))
    : [];
  const dimensionedTimeSeriesPoints = Array.isArray(projection.dimensioned_time_series_points)
    ? projection.dimensioned_time_series_points.map((point) => normalizeTimeSeriesPoint(point, projection))
    : [];
  return {
    epoch_id: epochId,
    generated_at: nullableString(projection.generated_at),
    current_state_applicability: stringValue(projection.current_state_applicability, "qualification_epoch"),
    trust_summary: numberRecord(projection.trust_summary),
    metrics,
    time_series_points: timeSeriesPoints,
    dimensioned_time_series_points: dimensionedTimeSeriesPoints,
  };
}

function normalizeOrganizationalObservabilityProjection({
  currentProjection,
  historicalProjection = null,
  qualificationProjections = [],
  diagnostics,
}: {
  currentProjection: JsonRecord;
  historicalProjection?: JsonRecord | null;
  qualificationProjections?: Array<{ epochId: string; projection: JsonRecord }>;
  diagnostics: DeltaHqObservabilityProjectionDiagnostics;
}): DeltaHqObservabilityProjection {
  const metrics = Array.isArray(currentProjection.metrics)
    ? currentProjection.metrics.map((metric) => normalizeMetric(metric, currentProjection))
    : [];
  const historicalMetrics = historicalProjection && Array.isArray(historicalProjection.metrics)
    ? historicalProjection.metrics.map((metric) => normalizeMetric(metric, historicalProjection))
    : [];
  const timeSeriesPoints = Array.isArray(currentProjection.time_series_points)
    ? currentProjection.time_series_points.map((point) => normalizeTimeSeriesPoint(point, currentProjection))
    : [];
  const historicalTimeSeriesPoints = historicalProjection && Array.isArray(historicalProjection.time_series_points)
    ? historicalProjection.time_series_points.map((point) => normalizeTimeSeriesPoint(point, historicalProjection))
    : [];
  const dimensionedTimeSeriesPoints = Array.isArray(currentProjection.dimensioned_time_series_points)
    ? currentProjection.dimensioned_time_series_points.map((point) => normalizeTimeSeriesPoint(point, currentProjection))
    : [];
  const historicalDimensionedTimeSeriesPoints = historicalProjection && Array.isArray(historicalProjection.dimensioned_time_series_points)
    ? historicalProjection.dimensioned_time_series_points.map((point) => normalizeTimeSeriesPoint(point, historicalProjection))
    : [];
  const currentEpochs = strings(currentProjection.available_qualification_epochs);
  const historicalEpochs = strings(historicalProjection?.available_qualification_epochs);

  return {
    status: "available",
    projection_id: nullableString(currentProjection.projection_id),
    projection_type: stringValue(currentProjection.projection_type, "organizational_observability"),
    generated_at: nullableString(currentProjection.generated_at),
    evaluated_at: nullableString(currentProjection.evaluated_at),
    fixtureFallback: false,
    source_of_truth: "delta-agent/src/observability/aggregate.mjs",
    diagnostics,
    promotionScope: OBSERVABILITY_PROMOTION_SCOPE,
    authorityLimitations: OBSERVABILITY_AUTHORITY_LIMITATIONS,
    registry_version: nullableString(currentProjection.registry_version),
    aggregation_version: nullableString(currentProjection.aggregation_version),
    latest_accepted_source_time: nullableString(currentProjection.latest_accepted_source_time),
    current_state_applicability: stringValue(currentProjection.current_state_applicability, "current_only"),
    current_qualification_epoch: nullableString(currentProjection.current_qualification_epoch),
    available_qualification_epochs: [...new Set([...currentEpochs, ...historicalEpochs])],
    guarantees: booleanRecord(currentProjection.guarantees),
    trust_summary: numberRecord(currentProjection.trust_summary),
    data_quality_summary: normalizeDataQualitySummary(currentProjection.data_quality_summary),
    event_acceptance_summary: normalizeEventAcceptanceSummary(currentProjection.event_acceptance_summary),
    metrics,
    metricsByScope: metricsByScope(metrics),
    historicalMetrics,
    qualificationEpochs: qualificationProjections.map(({ epochId, projection }) =>
      normalizeEpochProjection(epochId, projection),
    ),
    time_series_points: timeSeriesPoints,
    historical_time_series_points: historicalTimeSeriesPoints,
    dimensioned_time_series_points: dimensionedTimeSeriesPoints,
    historical_dimensioned_time_series_points: historicalDimensionedTimeSeriesPoints,
  };
}

function unavailableObservabilityProjection(reason: string): DeltaHqObservabilityProjection {
  const repoInfo = resolveAgentRepoRootInfo();
  const configuredStoreRoot = resolveObservabilityStoreRoot();
  const storeRoot = actualObservabilityStoreRoot(repoInfo.repoRoot, configuredStoreRoot);
  return {
    ...DELTA_HQ_VIEW_MODEL.observability.projection,
    unavailableReason: reason,
    fixtureFallback: true,
    diagnostics: {
      ...DELTA_HQ_VIEW_MODEL.observability.projection.diagnostics,
      repo_root: repoInfo.repoRoot,
      repo_root_source: repoInfo.source,
      repo_root_warning: repoInfo.warning,
      store_root: storeRoot,
      projection_path: observabilityProjectionPath(repoInfo.repoRoot, configuredStoreRoot),
      projection_source: "unavailable",
      empty_state_reason: reason,
      producer_keys_configured: Boolean(loadObservabilityProducerKeys()),
    },
  };
}

function normalizeClaims(claims: Partial<DeltaHqMilestoneClaims> | undefined): DeltaHqMilestoneClaims {
  return {
    directly_evidenced: Array.isArray(claims?.directly_evidenced) ? claims.directly_evidenced : [],
    strongly_inferred: Array.isArray(claims?.strongly_inferred) ? claims.strongly_inferred : [],
    unresolved: Array.isArray(claims?.unresolved) ? claims.unresolved : [],
  };
}

function normalizeTracks(values: string[]): DeltaHqLineageTrackId[] {
  return values.filter((value): value is DeltaHqLineageTrackId =>
    value === "product_intelligence" || value === "engineering_agentic" || value === "converged_platform",
  );
}

function normalizeSignificance(value: HistorianMilestoneDetail["significance"], fallback: string): string {
  if (typeof value === "string" && value.length > 0) return value;
  const valueRecord = record(value);
  return stringValue(valueRecord.level, fallback);
}

function milestoneLineageTracks(milestone: HistorianMilestoneDetail): DeltaHqLineageTrackId[] {
  const explicitTracks = normalizeTracks(strings(milestone.lineage_tracks));
  if (explicitTracks.length > 0) return explicitTracks;

  const signals = [
    milestone.milestone_id,
    ...strings(milestone.affected_initiatives),
    ...strings(milestone.affected_capabilities),
  ].join(" ").toLowerCase();
  const inferred: DeltaHqLineageTrackId[] = [];
  if (/(agent|mission|operator|runtime|historian|architecture|event|governance)/.test(signals)) {
    inferred.push("engineering_agentic");
  }
  if (/(product|intelligence|behavior|health|memory|experience)/.test(signals)) {
    inferred.push("product_intelligence");
  }
  return inferred.length > 0 ? inferred : ["engineering_agentic"];
}

function normalizeEvidenceReference(
  value: string | Partial<DeltaHqMilestoneEvidenceReference>,
): DeltaHqMilestoneEvidenceReference {
  if (typeof value === "string") {
    return {
      kind: "artifact",
      ref: value,
      confidence: "bounded",
      claim_classification: "directly_evidenced",
    };
  }
  return {
    kind: typeof value.kind === "string" ? value.kind : "artifact",
    ref: typeof value.ref === "string" ? value.ref : "unknown",
    summary: typeof value.summary === "string" ? value.summary : undefined,
    confidence: typeof value.confidence === "string" ? value.confidence : "bounded",
    claim_classification: typeof value.claim_classification === "string"
      ? value.claim_classification
      : "directly_evidenced",
  };
}

function timelineEntries(timeline: HistorianTimeline): HistorianTimelineEntry[] {
  return Array.isArray(timeline.entries) ? timeline.entries : Array.isArray(timeline.timeline) ? timeline.timeline : [];
}

function evidenceMode(
  evidenceReferences: DeltaHqMilestoneEvidenceReference[],
  claims: DeltaHqMilestoneClaims,
): { evidenceMode: string; directlyEvidenced: boolean } {
  const classifications = new Set(evidenceReferences.map((reference) => reference.claim_classification));
  if (claims.unresolved.length > 0 || classifications.has("unresolved")) {
    return { evidenceMode: "Contains unresolved evidence", directlyEvidenced: false };
  }
  if (claims.strongly_inferred.length > 0 || classifications.has("strongly_inferred")) {
    return { evidenceMode: "Direct evidence with inferred interpretation", directlyEvidenced: false };
  }
  if (claims.directly_evidenced.length > 0 || classifications.has("directly_evidenced")) {
    return { evidenceMode: "Directly evidenced", directlyEvidenced: true };
  }
  return { evidenceMode: "Evidence classified by Historian", directlyEvidenced: false };
}

function buildEvolutionEntries(
  timeline: HistorianTimeline,
  inspection: HistorianInspection,
): DeltaHqEvolutionMilestone[] {
  const inspectionById = new Map(inspection.milestones.map((milestone) => [milestone.milestone_id, milestone]));
  return timelineEntries(timeline).map((entry) => {
    const inspected = inspectionById.get(entry.milestone_id) || { milestone_id: entry.milestone_id };
    const claimSummary = normalizeClaims(inspected?.claim_summary);
    const references = (inspected.evidence_references || []).map(normalizeEvidenceReference);
    const evidence = evidenceMode(references, claimSummary);
    const date = inspected.recorded_at || entry.recorded_at || entry.date || "";
    const milestone = inspected.title || entry.title || entry.milestone || entry.milestone_id;
    const significance = normalizeSignificance(inspected.significance, entry.significance);
    const capabilitySummary = strings(inspected.affected_capabilities).join(", ");

    return {
      date,
      milestone_id: entry.milestone_id,
      milestone,
      significance,
      lineage_tracks: milestoneLineageTracks(inspected),
      concise_description: inspected.summary || milestone,
      major_capability_gained: inspected.major_capability_gained || capabilitySummary || milestone,
      predecessor_milestones: strings(inspected.predecessor_milestones),
      successor_milestones: strings(inspected.successor_milestones),
      evidence_confidence: inspected.evidence_confidence || "bounded",
      evidence_references: references,
      claim_summary: claimSummary,
      record_ref: inspected.record_ref || inspected.milestone_ref,
      evidence_mode: evidence.evidenceMode,
      directly_evidenced: evidence.directlyEvidenced,
    };
  });
}

function buildEvolutionProjection(
  timeline: HistorianTimeline,
  inspection: HistorianInspection,
): DeltaHqEvolutionProjection {
  const entries = buildEvolutionEntries(timeline, inspection);
  const entryDates = entries.map((entry) => entry.date).filter(Boolean).sort();
  const lineageTracks = TRACKS.map((track) => ({
    ...track,
    milestone_ids: entries
      .filter((entry) => entry.lineage_tracks.includes(track.id))
      .map((entry) => entry.milestone_id),
  }));
  const convergenceMilestoneIds = entries
    .filter((entry) => entry.lineage_tracks.includes("converged_platform") || entry.lineage_tracks.length > 1)
    .map((entry) => entry.milestone_id);

  return {
    status: timeline.status === inspection.status ? timeline.status : "incomplete",
    generated_at: timeline.generated_at,
    inspected_at: inspection.inspected_at,
    timeline_window: timeline.timeline_window || {
      from: entryDates[0] || null,
      to: entryDates.at(-1) || null,
    },
    source_of_truth: timeline.source_boundary?.source_of_truth || "agent/historian/milestones",
    source_boundary: "Historian milestones are rendered as read-only projections. HQ does not create, modify, or reinterpret milestone records.",
    fixtureFallback: false,
    entries,
    lineage_tracks: lineageTracks,
    convergence: {
      status: convergenceMilestoneIds.length > 0 ? "evidenced" : "not_evidenced_in_current_projection",
      milestone_ids: convergenceMilestoneIds,
      explanation: convergenceMilestoneIds.length > 0
        ? "Historian explicitly marks these milestones as converged or multi-track."
        : "Current Historian projection keeps product/intelligence and engineering/agentic lineages separate. HQ leaves the convergence lane empty until Historian supplies a converged milestone.",
    },
    analyticsAnnotationSeams: [
      "Analytics can attach a milestone marker by milestone_id and canonical timestamp.",
      "Since milestone comparisons remain disabled until Organizational Observability publishes compatible trend projections.",
      "Milestone annotations show temporal relationship only; causality requires a future approved Observability or Insight projection.",
    ],
    askDeltaSuggestedQuestions: [
      "When did Delta stop being health-only?",
      "Where did persistent memory first appear?",
      "What changed between Behavioral OS and Intelligence OS?",
      "When did the engineering-agent lineage begin?",
      "Which early ideas still exist today?",
    ],
    read_only_boundary: timeline.read_only_boundary || inspection.read_only_boundary,
  };
}

function unavailableEvolutionProjection(reason: string): DeltaHqEvolutionProjection {
  return {
    ...DELTA_HQ_VIEW_MODEL.evolution,
    unavailableReason: reason,
    fixtureFallback: true,
  };
}

const ISSUE_AUTHORITY_LIMITS = [
  "HQ renders existing structured issue/diagnosis evidence only.",
  "HQ does not create a canonical issue registry or cross-source lifecycle owner.",
  "HQ preserves source labels, source states, and evidence refs.",
  "HQ does not assign accepted-risk unless the source explicitly says so.",
  "HQ does not treat automatic grouping or repeated IDs as dedupe truth.",
  "HQ does not expose remediation actions, mutate sources, or change the Event Bus.",
];

const prioritySeverity: Record<DeltaHqIssuePriority, DeltaHqIssueSeverity> = {
  P0: "critical",
  P1: "high",
  P2: "medium",
  P3: "low",
};

const severityRank: Record<DeltaHqIssueSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityRank: Record<DeltaHqIssuePriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

function validateSiteRepoRoot(candidate: string): boolean {
  return existsSync(path.join(candidate, "package.json"))
    && existsSync(path.join(candidate, "src", "components", "DeltaHQ.tsx"))
    && existsSync(path.join(candidate, "agent", "findings"));
}

function resolveSiteRepoRoot(): string {
  if (process.env.DELTA_SITE_REPO_ROOT && validateSiteRepoRoot(process.env.DELTA_SITE_REPO_ROOT)) {
    return process.env.DELTA_SITE_REPO_ROOT;
  }

  const candidates = uniqueStrings([
    process.cwd(),
    ...ancestorDirs(process.cwd()),
    ...deltaWorkspaceRootCandidates().map((workspaceRoot) => path.join(workspaceRoot, "delta-site")),
    path.resolve(process.cwd(), "..", "delta-site"),
  ]).filter((candidate) => !candidate.includes(`${path.sep}delta-worktrees${path.sep}`));

  return candidates.find(validateSiteRepoRoot) || process.cwd();
}

function relativeSourceRef(repoRoot: string, file: string): string {
  const relative = path.relative(repoRoot, file);
  return relative.startsWith("..") ? file : relative;
}

function latestFile(dir: string, pattern: RegExp): string | null {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((name) => pattern.test(name))
    .sort()
    .reverse();
  return files[0] ? path.join(dir, files[0]) : null;
}

function jsonFiles(dir: string, pattern: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => pattern.test(name))
    .sort()
    .map((name) => path.join(dir, name));
}

function readJsonRecord(file: string): JsonRecord | null {
  try {
    return record(JSON.parse(readFileSync(file, "utf8")) as unknown);
  } catch {
    return null;
  }
}

function stripQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function parseFindingFrontmatter(text: string): JsonRecord {
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---", 4);
  if (end === -1) return {};

  const frontmatter: JsonRecord = {};
  let currentArrayKey: string | null = null;
  for (const rawLine of text.slice(4, end).split(/\r?\n/)) {
    const arrayItem = rawLine.match(/^\s*-\s*(.+)$/);
    if (arrayItem && currentArrayKey) {
      const list = Array.isArray(frontmatter[currentArrayKey]) ? frontmatter[currentArrayKey] as string[] : [];
      list.push(stripQuotes(arrayItem[1]));
      frontmatter[currentArrayKey] = list;
      continue;
    }

    const entry = rawLine.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!entry) continue;
    const [, key, rawValue] = entry;
    if (!rawValue.trim()) {
      frontmatter[key] = [];
      currentArrayKey = key;
      continue;
    }

    currentArrayKey = null;
    const value = stripQuotes(rawValue);
    if (value === "true") {
      frontmatter[key] = true;
    } else if (value === "false") {
      frontmatter[key] = false;
    } else {
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function markdownBodyAfterFrontmatter(text: string): string {
  if (!text.startsWith("---\n")) return text;
  const end = text.indexOf("\n---", 4);
  return end === -1 ? text : text.slice(end + 4);
}

function compactText(value: string, fallback: string, maxLength = 420): string {
  const compact = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!compact) return fallback;
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1).trim()}...` : compact;
}

function firstMeaningfulParagraph(markdown: string, fallback: string): string {
  const paragraphs = markdownBodyAfterFrontmatter(markdown)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !paragraph.startsWith("#"));
  return compactText(paragraphs[0] || "", fallback);
}

function normalizePriority(value: unknown, fallback: DeltaHqIssuePriority = "P2"): DeltaHqIssuePriority {
  const priority = typeof value === "string" ? value.toUpperCase() : "";
  return priority === "P0" || priority === "P1" || priority === "P2" || priority === "P3" ? priority : fallback;
}

function normalizeIssueState(value: unknown): DeltaHqIssueState {
  const state = typeof value === "string" ? value.toLowerCase().replaceAll("_", "-") : "";
  if (state === "resolved" || state === "closed" || state === "done") return "resolved";
  if (state === "accepted-risk" || state === "risk-accepted") return "accepted-risk";
  if (state === "pending-human" || state === "blocked" || state === "owner-decision-required") return "blocked";
  if (state === "monitoring" || state === "deferred" || state === "watching") return "monitoring";
  return "open";
}

function statusResolution(value: unknown): string | null {
  const state = typeof value === "string" ? value.toLowerCase().replaceAll("_", "-") : "";
  if (state === "resolved" || state === "closed" || state === "done") return "Source marked resolved.";
  if (state === "accepted-risk" || state === "risk-accepted") return "Source explicitly marked accepted risk.";
  return null;
}

function sourceArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function findingOwner(finding: JsonRecord): string {
  const owner = nullableString(finding.owner);
  if (owner) return owner;
  if (finding.security_related === true) return "Security";
  return stringValue(finding.routine, "Source owner unavailable");
}

function sourceSystemFromFinding(): DeltaHqIssueSourceSystem {
  return "site_finding";
}

function findingToIssue(file: string, siteRoot: string): DeltaHqIssue {
  const text = readFileSync(file, "utf8");
  const finding = parseFindingFrontmatter(text);
  const priority = normalizePriority(finding.priority);
  const state = normalizeIssueState(finding.status);
  const routine = nullableString(finding.routine);
  const repo = nullableString(finding.repo);
  const id = stringValue(finding.id, path.basename(file, ".md"));
  const title = stringValue(finding.title, id);
  const lastReviewed = nullableString(finding.last_reviewed);
  const lastUpdated = lastReviewed || statSync(file).mtime.toISOString();
  const sourceSystem = sourceSystemFromFinding();

  return {
    id: `site-finding-${id}`,
    title,
    severity: prioritySeverity[priority],
    priority,
    state,
    source_state: stringValue(finding.status, "unknown"),
    canonical_owner: findingOwner(finding),
    diagnosed_by: {
      source_system: sourceSystem,
      source_label: routine ? `Canonical site finding / ${routine}` : "Canonical site finding",
      source_ref: relativeSourceRef(siteRoot, file),
    },
    concise_diagnosis: firstMeaningfulParagraph(text, "Structured site finding did not include a body diagnosis."),
    evidence_refs: sourceArray(finding.evidence),
    affected: {
      capabilities: sourceArray(finding.slug).concat(sourceArray(finding.source)).slice(0, 6),
      repos: repo ? [repo] : [],
      domains: routine ? [routine] : [],
    },
    impact: state === "blocked" || priority === "P0" ? "blocker" : "advisory",
    recommended_next_action: stringValue(
      finding.recommended_next_phase,
      "Inspect the canonical finding source for the next approved action.",
    ),
    last_updated: lastUpdated,
    resolution: statusResolution(finding.status),
    sourceKind: "real",
  };
}

function adaptSiteFindings(siteRoot: string): { issues: DeltaHqIssue[]; sourceGaps: DeltaHqIssueSourceGap[] } {
  const findingsRoot = path.join(siteRoot, "agent", "findings");
  if (!existsSync(findingsRoot)) {
    return {
      issues: [],
      sourceGaps: [
        {
          source_system: "site_finding",
          source_label: "Canonical site findings",
          reason: "No canonical site findings directory was found for this HQ checkout.",
          source_ref: relativeSourceRef(siteRoot, findingsRoot),
        },
      ],
    };
  }

  const files = readdirSync(findingsRoot)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => path.join(findingsRoot, name));

  return {
    issues: files.map((file) => findingToIssue(file, siteRoot)),
    sourceGaps: files.length > 0
      ? []
      : [
          {
            source_system: "site_finding",
            source_label: "Canonical site findings",
            reason: "The canonical site findings directory is present but empty.",
            source_ref: relativeSourceRef(siteRoot, findingsRoot),
          },
        ],
  };
}

function qualityIssueTitle(repo: string, blockers: string[]): string {
  return blockers.length > 0 ? `${repo} release readiness blocked` : `${repo} production proof gaps`;
}

function adaptQualityGate(agentRoot: string): { issues: DeltaHqIssue[]; sourceGaps: DeltaHqIssueSourceGap[] } {
  const reportPath = latestFile(path.join(agentRoot, "agent", "runs"), /production-quality\.json$/);
  if (!reportPath) {
    return {
      issues: [],
      sourceGaps: [
        {
          source_system: "quality_gate",
          source_label: "Quality Gate / Production Quality",
          reason: "No structured production-quality JSON report was found in canonical agent runs.",
          source_ref: "agent/runs/*production-quality.json",
        },
      ],
    };
  }

  const report = readJsonRecord(reportPath);
  if (!report) {
    return {
      issues: [],
      sourceGaps: [
        {
          source_system: "quality_gate",
          source_label: "Quality Gate / Production Quality",
          reason: "Latest production-quality JSON report could not be parsed.",
          source_ref: relativeSourceRef(agentRoot, reportPath),
        },
      ],
    };
  }

  const authority = record(report.authority);
  const issues = Array.isArray(report.repositories)
    ? report.repositories.flatMap((repoRecord: unknown): DeltaHqIssue[] => {
        const repo = record(repoRecord);
        const repoName = stringValue(repo.repo, "unknown");
        const releaseBlockers = sourceArray(repo.release_blockers);
        const proofGaps = sourceArray(repo.proof_gaps);
        if (releaseBlockers.length === 0 && proofGaps.length === 0) return [];

        const priority: DeltaHqIssuePriority = releaseBlockers.length > 0 ? "P1" : "P2";
        const state: DeltaHqIssueState = releaseBlockers.length > 0 ? "blocked" : "monitoring";
        return [
          {
            id: `quality-gate-${repoName}-${releaseBlockers.length > 0 ? "release-blocked" : "proof-gaps"}`,
            title: qualityIssueTitle(repoName, releaseBlockers),
            severity: prioritySeverity[priority],
            priority,
            state,
            source_state: releaseBlockers.length > 0 ? "release_blockers_present" : "proof_gaps_present",
            canonical_owner: stringValue(authority.verdict_owner, "verifier"),
            diagnosed_by: {
              source_system: "quality_gate",
              source_label: "Quality Gate / Production Quality",
              source_ref: relativeSourceRef(agentRoot, reportPath),
            },
            concise_diagnosis: compactText(
              [...releaseBlockers, ...proofGaps].join("; "),
              "Production quality report marked this repository as not release-ready.",
            ),
            evidence_refs: [
              relativeSourceRef(agentRoot, reportPath),
              ...sourceArray(repo.path),
              ...releaseBlockers.map((blocker) => `${repoName}: ${blocker}`),
              ...proofGaps.map((gap) => `${repoName}: ${gap}`),
            ],
            affected: {
              capabilities: ["release_readiness", "production_parity"],
              repos: [repoName],
              domains: ["quality_gate"],
            },
            impact: releaseBlockers.length > 0 ? "blocker" : "advisory",
            recommended_next_action: stringValue(
              report.next_safe_command,
              "Use the Quality Gate next-safe-command from the canonical report.",
            ),
            last_updated: stringValue(report.timestamp, statSync(reportPath).mtime.toISOString()),
            resolution: null,
            sourceKind: "real",
          },
        ];
      })
    : [];

  return {
    issues,
    sourceGaps: issues.length > 0
      ? []
      : [
          {
            source_system: "quality_gate",
            source_label: "Quality Gate / Production Quality",
            reason: "The latest production-quality report contains no structured release blockers or proof gaps.",
            source_ref: relativeSourceRef(agentRoot, reportPath),
          },
        ],
  };
}

function evidenceRefsFromRecord(value: JsonRecord): string[] {
  return uniqueStrings([
    ...sourceArray(value.evidence_refs),
    ...sourceArray(record(value.evidence).refs),
    ...sourceArray(record(value.likely_root_cause).evidence_refs),
    ...sourceArray(value.authoritative_contract_refs),
    ...sourceArray(value.source_inputs).map((item) => typeof item === "string" ? item : JSON.stringify(item)),
  ]);
}

function adaptFailureTriage(agentRoot: string): { issues: DeltaHqIssue[]; sourceGaps: DeltaHqIssueSourceGap[] } {
  const files = jsonFiles(path.join(agentRoot, "agent", "runs"), /failure-triage.*\.json$/);
  const issues: DeltaHqIssue[] = [];
  let qualificationEvidenceSeen = false;

  for (const file of files) {
    const triage = readJsonRecord(file);
    if (!triage) continue;
    const reportType = stringValue(triage.report_type, "");
    if (reportType.includes("qualification") || reportType.includes("validation") || Array.isArray(triage.runs)) {
      qualificationEvidenceSeen = true;
      continue;
    }
    const failureId = nullableString(triage.failure_id) || nullableString(triage.issue_id);
    if (!failureId) continue;

    const priority = normalizePriority(triage.priority, "P2");
    const stopReason = stringValue(triage.stop_reason, stringValue(triage.state, "open"));
    const state = normalizeIssueState(stopReason);
    issues.push({
      id: `failure-triage-${failureId}`,
      title: stringValue(triage.title, `Failure triage diagnosis ${failureId}`),
      severity: prioritySeverity[priority],
      priority,
      state,
      source_state: stopReason,
      canonical_owner: stringValue(triage.canonical_owner, stringValue(triage.owner, "Failure Triage")),
      diagnosed_by: {
        source_system: "failure_triage",
        source_label: "Failure Triage",
        source_ref: relativeSourceRef(agentRoot, file),
      },
      concise_diagnosis: compactText(
        stringValue(triage.concise_diagnosis, stringValue(triage.diagnosis, stringValue(record(triage.likely_root_cause).summary, ""))),
        "Failure Triage result did not include a concise diagnosis.",
      ),
      evidence_refs: evidenceRefsFromRecord(triage),
      affected: {
        capabilities: sourceArray(triage.affected_capabilities),
        repos: sourceArray(triage.affected_repos),
        domains: sourceArray(triage.affected_domains),
      },
      impact: state === "blocked" ? "blocker" : "advisory",
      recommended_next_action: stringValue(triage.recommended_next_action, "Inspect Failure Triage source result for next action."),
      last_updated: stringValue(triage.generated_at, statSync(file).mtime.toISOString()),
      resolution: statusResolution(triage.state),
      sourceKind: "real",
    });
  }

  return {
    issues,
    sourceGaps: issues.length > 0
      ? []
      : [
          {
            source_system: "failure_triage",
            source_label: "Failure Triage",
            reason: qualificationEvidenceSeen
              ? "Only qualification/regression evidence was found; HQ did not convert nested evaluation scenarios into current issues."
              : "No current structured Failure Triage issue/result record was found.",
            source_ref: "agent/runs/*failure-triage*.json",
          },
        ],
  };
}

function adaptArchitectureReview(agentRoot: string): { issues: DeltaHqIssue[]; sourceGaps: DeltaHqIssueSourceGap[] } {
  const searchRoots = [
    path.join(agentRoot, "agent", "architecture-reviews"),
    path.join(agentRoot, "agent", "reviews"),
    path.join(agentRoot, "agent", "runs"),
  ];
  const files = searchRoots.flatMap((root) => jsonFiles(root, /architecture-review.*\.json$/));
  const issues: DeltaHqIssue[] = [];

  for (const file of files) {
    if (file.includes(`${path.sep}qualification-evidence${path.sep}`)) continue;
    const review = readJsonRecord(file);
    if (!review || !review.review_id || !review.recommended_review_outcome) continue;
    const outcome = stringValue(review.recommended_review_outcome, "request_evidence");
    const priority: DeltaHqIssuePriority = outcome === "owner_decision_required" ? "P1" : "P2";
    const state = outcome === "accept" || outcome === "reject" ? "resolved" : normalizeIssueState(outcome);
    issues.push({
      id: `architecture-review-${stringValue(review.review_id, path.basename(file, ".json"))}`,
      title: stringValue(review.subject, "Architecture review issue"),
      severity: prioritySeverity[priority],
      priority,
      state,
      source_state: outcome,
      canonical_owner: stringValue(review.canonical_owner, "Architecture Review"),
      diagnosed_by: {
        source_system: "architecture_review",
        source_label: "Architecture Review",
        source_ref: relativeSourceRef(agentRoot, file),
      },
      concise_diagnosis: compactText(stringValue(review.review_summary, ""), "Architecture review did not include a summary."),
      evidence_refs: evidenceRefsFromRecord(review),
      affected: {
        capabilities: sourceArray(review.required_preservation),
        repos: [],
        domains: [stringValue(review.conflict_classification, "architecture_review")],
      },
      impact: outcome === "owner_decision_required" ? "blocker" : "advisory",
      recommended_next_action: stringValue(review.owner_question, "Inspect Architecture Review result for the requested owner decision or evidence."),
      last_updated: statSync(file).mtime.toISOString(),
      resolution: outcome === "accept" || outcome === "reject" ? `Source outcome: ${outcome}.` : null,
      sourceKind: "real",
    });
  }

  return {
    issues,
    sourceGaps: issues.length > 0
      ? []
      : [
          {
            source_system: "architecture_review",
            source_label: "Architecture Review",
            reason: "No current ArchitectureReviewResult records were found outside qualification evidence.",
            source_ref: "agent/architecture-reviews/*.json",
          },
        ],
  };
}

function adaptEvaluation(agentRoot: string): { issues: DeltaHqIssue[]; sourceGaps: DeltaHqIssueSourceGap[] } {
  const searchRoots = [
    path.join(agentRoot, "agent", "evaluation-reviews"),
    path.join(agentRoot, "agent", "reviews"),
    path.join(agentRoot, "agent", "runs"),
  ];
  const files = searchRoots.flatMap((root) => jsonFiles(root, /evaluation-review.*\.json$/));
  const issues: DeltaHqIssue[] = [];

  for (const file of files) {
    if (file.includes(`${path.sep}qualification-evidence${path.sep}`)) continue;
    const evaluation = readJsonRecord(file);
    if (!evaluation || !evaluation.review_id || !evaluation.outcome) continue;
    const priority = normalizePriority(evaluation.priority, "P2");
    const outcome = stringValue(evaluation.outcome, "needs_review");
    const missingScenarios = Array.isArray(evaluation.missing_scenarios) ? evaluation.missing_scenarios : [];
    const state: DeltaHqIssueState = outcome === "fully_evaluated" ? "resolved" : missingScenarios.length > 0 ? "open" : "monitoring";
    const change = record(evaluation.change);
    const scope = record(evaluation.affected_scope);
    issues.push({
      id: `evaluation-${stringValue(evaluation.review_id, path.basename(file, ".json"))}`,
      title: stringValue(change.title, "Evaluation coverage issue"),
      severity: prioritySeverity[priority],
      priority,
      state,
      source_state: outcome,
      canonical_owner: stringValue(evaluation.reviewer, "Evaluation"),
      diagnosed_by: {
        source_system: "evaluation",
        source_label: "Evaluation Review",
        source_ref: relativeSourceRef(agentRoot, file),
      },
      concise_diagnosis: compactText(stringValue(change.summary, ""), "Evaluation review did not include a change summary."),
      evidence_refs: evidenceRefsFromRecord(evaluation),
      affected: {
        capabilities: sourceArray(scope.capabilities),
        repos: sourceArray(scope.contracts),
        domains: sourceArray(scope.agents),
      },
      impact: priority === "P0" || priority === "P1" ? "blocker" : "advisory",
      recommended_next_action: stringValue(evaluation.next_review_trigger, "Inspect Evaluation review for the next review trigger."),
      last_updated: stringValue(evaluation.reviewed_at, statSync(file).mtime.toISOString()),
      resolution: state === "resolved" ? "Source outcome is fully evaluated." : null,
      sourceKind: "real",
    });
  }

  return {
    issues,
    sourceGaps: issues.length > 0
      ? []
      : [
          {
            source_system: "evaluation",
            source_label: "Evaluation Review",
            reason: "No current DeltaEvaluationReview records were found outside schemas and qualification evidence.",
            source_ref: "agent/evaluation-reviews/*.json",
          },
        ],
  };
}

function adaptSecurityGovernance(agentRoot: string): { issues: DeltaHqIssue[]; sourceGaps: DeltaHqIssueSourceGap[] } {
  const roots = [
    { system: "security" as const, label: "Structured Security findings", dir: path.join(agentRoot, "agent", "security-findings") },
    { system: "governance" as const, label: "Structured Governance findings", dir: path.join(agentRoot, "agent", "governance-findings") },
  ];
  const sourceGaps: DeltaHqIssueSourceGap[] = [];

  for (const root of roots) {
    sourceGaps.push({
      source_system: root.system,
      source_label: root.label,
      reason: existsSync(root.dir)
        ? "No current structured issue records were found in this source directory."
        : "No structured source directory exists yet; HQ uses other canonical findings when present and does not scan raw warning walls.",
      source_ref: relativeSourceRef(agentRoot, root.dir),
    });
  }

  return { issues: [], sourceGaps };
}

function adaptObservabilityGaps(
  projection: DeltaHqObservabilityProjection,
): { issues: DeltaHqIssue[]; sourceGaps: DeltaHqIssueSourceGap[] } {
  const sourceRef = projection.diagnostics.projection_path || projection.source_of_truth;
  if (projection.status !== "available") {
    return {
      issues: [
        {
          id: "observability-projection-unavailable",
          title: "Observability projection unavailable",
          severity: "medium",
          priority: "P2",
          state: "monitoring",
          source_state: "unavailable",
          canonical_owner: "Organizational Observability",
          diagnosed_by: {
            source_system: "observability",
            source_label: "Organizational Observability gaps",
            source_ref: sourceRef,
          },
          concise_diagnosis:
            "HQ cannot load the read-only Organizational Observability projection. This is shown as a data availability issue, not as inferred operational health.",
          evidence_refs: [projection.unavailableReason || "Projection unavailable", sourceRef].filter(Boolean) as string[],
          affected: {
            capabilities: ["organizational_observability", "analytics"],
            repos: ["agent"],
            domains: ["observability"],
          },
          impact: "advisory",
          recommended_next_action: projection.diagnostics.next_event_owner || "Restore the canonical read-only Observability projection.",
          last_updated: projection.generated_at || new Date().toISOString(),
          resolution: null,
          sourceKind: "real",
        },
      ],
      sourceGaps: [],
    };
  }

  if (projection.event_acceptance_summary.accepted_source_event_count === 0) {
    return {
      issues: [
        {
          id: "observability-current-telemetry-gap",
          title: "No accepted current Observability telemetry",
          severity: "medium",
          priority: "P2",
          state: "monitoring",
          source_state: "missing_current_measurement",
          canonical_owner: projection.diagnostics.next_event_owner || "Organizational Observability telemetry producers",
          diagnosed_by: {
            source_system: "observability",
            source_label: "Organizational Observability gaps",
            source_ref: sourceRef,
          },
          concise_diagnosis:
            "The projection reports no accepted current-state telemetry. HQ treats this as unavailable measurement evidence and does not infer a healthy or unhealthy operating state.",
          evidence_refs: [
            projection.diagnostics.empty_state_reason || "No accepted current-state telemetry.",
            sourceRef,
          ].filter(Boolean) as string[],
          affected: {
            capabilities: ["organizational_observability", "analytics"],
            repos: ["agent"],
            domains: ["observability"],
          },
          impact: "advisory",
          recommended_next_action: projection.diagnostics.next_event_owner || "Emit accepted current-state Observability events through the canonical producer path.",
          last_updated: projection.generated_at || projection.evaluated_at || new Date().toISOString(),
          resolution: null,
          sourceKind: "real",
        },
      ],
      sourceGaps: [],
    };
  }

  const degradedMetrics = projection.metrics.filter((metric) =>
    ["stale", "untrusted", "conflicted", "missing"].includes(String(metric.trust_state)),
  );
  if (degradedMetrics.length === 0) return { issues: [], sourceGaps: [] };

  const states = uniqueStrings(degradedMetrics.map((metric) => String(metric.trust_state)));
  return {
    issues: [
      {
        id: "observability-degraded-current-metrics",
        title: "Some Observability metrics are degraded or unavailable",
        severity: states.includes("conflicted") || states.includes("untrusted") ? "high" : "medium",
        priority: states.includes("conflicted") || states.includes("untrusted") ? "P1" : "P2",
        state: "monitoring",
        source_state: states.join(", "),
        canonical_owner: "Organizational Observability",
        diagnosed_by: {
          source_system: "observability",
          source_label: "Organizational Observability gaps",
          source_ref: sourceRef,
        },
        concise_diagnosis:
          "The canonical projection marks one or more current metrics as missing, stale, untrusted, or conflicted. HQ preserves those labels and does not calculate replacement health.",
        evidence_refs: degradedMetrics.slice(0, 8).map((metric) =>
          `${metric.metric_id}: ${metric.trust_state}${metric.missing_reason ? ` (${metric.missing_reason})` : ""}`,
        ),
        affected: {
          capabilities: uniqueStrings(degradedMetrics.map((metric) => metric.metric_id).slice(0, 8)),
          repos: ["agent"],
          domains: uniqueStrings(degradedMetrics.map((metric) => metric.scope)),
        },
        impact: "advisory",
        recommended_next_action: "Inspect the canonical Observability projection and producer freshness for the listed metric IDs.",
        last_updated: projection.generated_at || projection.evaluated_at || new Date().toISOString(),
        resolution: null,
        sourceKind: "real",
      },
    ],
    sourceGaps: [],
  };
}

function sortIssues(issues: DeltaHqIssue[]): DeltaHqIssue[] {
  return [...issues].sort((left, right) => {
    const blocker = Number(right.impact === "blocker") - Number(left.impact === "blocker");
    if (blocker !== 0) return blocker;
    const severity = severityRank[left.severity] - severityRank[right.severity];
    if (severity !== 0) return severity;
    const priority = priorityRank[left.priority] - priorityRank[right.priority];
    if (priority !== 0) return priority;
    return Date.parse(right.last_updated) - Date.parse(left.last_updated);
  });
}

function highValueDefaultIssue(issue: DeltaHqIssue): boolean {
  if (issue.state === "resolved" || issue.state === "accepted-risk") return false;
  if (issue.impact === "blocker") return true;
  if (issue.state !== "open" && issue.state !== "blocked" && issue.state !== "monitoring") return false;
  return issue.priority === "P0" || issue.priority === "P1" || issue.priority === "P2";
}

function issueSourceCounts(issues: DeltaHqIssue[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    const source = issue.diagnosed_by.source_system;
    counts[source] = (counts[source] || 0) + 1;
  }
  return counts;
}

export async function getIssuesProjection(
  observabilityProjection?: DeltaHqObservabilityProjection,
): Promise<DeltaHqIssueProjection> {
  const generatedAt = new Date().toISOString();
  const siteRoot = resolveSiteRepoRoot();
  const agentRoot = resolveAgentRepoRoot();
  const projection = observabilityProjection || await getOrganizationalObservabilityProjection();
  const adapterResults = [
    adaptSiteFindings(siteRoot),
    adaptQualityGate(agentRoot),
    adaptFailureTriage(agentRoot),
    adaptArchitectureReview(agentRoot),
    adaptEvaluation(agentRoot),
    adaptSecurityGovernance(agentRoot),
    adaptObservabilityGaps(projection),
  ];
  const issues = sortIssues(adapterResults.flatMap((result) => result.issues));
  const sourceGaps = adapterResults.flatMap((result) => result.sourceGaps);
  const defaultIssues = issues.filter(highValueDefaultIssue);
  const historyIssues = issues.filter((issue) => issue.state === "resolved" || issue.state === "accepted-risk");

  return {
    status: issues.length > 0 && sourceGaps.length === 0 ? "available" : sourceGaps.length > 0 ? "partial" : "available",
    generated_at: generatedAt,
    source_of_truth:
      "Read-only projection over existing structured Delta issue/diagnosis sources. Canonical source records remain authoritative.",
    authority_limits: ISSUE_AUTHORITY_LIMITS,
    issues,
    default_issue_ids: defaultIssues.map((issue) => issue.id),
    history_issue_ids: historyIssues.map((issue) => issue.id),
    source_counts: issueSourceCounts(issues),
    source_gaps: sourceGaps,
    read_only_boundary: {
      canonical_issue_registry_created: false,
      lifecycle_authority_created: false,
      mutation_performed: false,
      remediation_performed: false,
      event_bus_changed: false,
      automatic_dedupe_claimed_as_truth: false,
    },
  };
}

export async function getHistorianEvolutionProjection(): Promise<DeltaHqEvolutionProjection> {
  try {
    const repoRoot = resolveAgentRepoRoot();
    const historian = await loadHistorianMilestoneModule(repoRoot);
    const inspection = historian.inspectHistorianMilestones({ repoRoot, track: "all", significance: "all", limit: 50 });
    const timeline = historian.buildEvolutionTimeline
      ? historian.buildEvolutionTimeline({ repoRoot, track: "all", limit: 50 })
      : historian.generateExecutiveMilestoneReport?.({
          repoRoot,
          reportType: "evolution_timeline",
          since: "",
          limit: 50,
        });
    if (!timeline) throw new Error("Historian evolution report runtime unavailable");
    return buildEvolutionProjection(timeline, inspection);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Historian milestone runtime unavailable";
    return unavailableEvolutionProjection(reason);
  }
}

export async function getOrganizationalObservabilityProjection(): Promise<DeltaHqObservabilityProjection> {
  try {
    const repoInfo = resolveAgentRepoRootInfo();
    const repoRoot = repoInfo.repoRoot;
    const configuredStoreRoot = resolveObservabilityStoreRoot();
    const storeRoot = actualObservabilityStoreRoot(repoRoot, configuredStoreRoot);
    const producerKeys = loadObservabilityProducerKeys();
    const rawStore = inspectRawTelemetryStore(storeRoot);
    const storedCurrentProjection = readStoredObservabilityProjection(repoRoot, configuredStoreRoot);
    const storedProjectionStale = storedCurrentProjection
      ? projectionIsOlderThanRaw(storedCurrentProjection.projection, rawStore)
      : false;
    let observabilityModule: OrganizationalObservabilityModule | null = null;

    if (!storedCurrentProjection || storedProjectionStale) {
      observabilityModule = await loadOrganizationalObservabilityModule(repoRoot);
    }

    const currentProjection = storedCurrentProjection && !storedProjectionStale
      ? storedCurrentProjection.projection
      : record(observabilityModule?.aggregateFromStore({
      repoRoot,
      storeRoot: configuredStoreRoot,
      producerKeys,
      mode: "current",
    }));

    if (!currentProjection.projection_type) {
      throw new Error("Organizational Observability projection unavailable");
    }

    let historicalProjection: JsonRecord | null = null;
    let qualificationProjections: Array<{ epochId: string; projection: JsonRecord }> = [];

    try {
      if (!observabilityModule) {
        observabilityModule = await loadOrganizationalObservabilityModule(repoRoot);
      }
      historicalProjection = record(observabilityModule.aggregateFromStore({
        repoRoot,
        storeRoot: configuredStoreRoot,
        producerKeys,
        mode: "historical",
      }));
      const epochIds = [
        ...new Set([
          ...strings(currentProjection.available_qualification_epochs),
          ...strings(historicalProjection.available_qualification_epochs),
        ]),
      ].slice(0, 4);
      qualificationProjections = epochIds.map((epochId) => ({
        epochId,
        projection: record(observabilityModule?.aggregateFromStore({
          repoRoot,
          storeRoot: configuredStoreRoot,
          producerKeys,
          mode: "qualification_epoch",
          qualificationEpoch: epochId,
        })),
      }));
    } catch {
      historicalProjection = null;
      qualificationProjections = [];
    }

    const diagnostics = buildProjectionDiagnostics({
      repoInfo,
      storeRoot,
      projectionPath: storedCurrentProjection?.path || observabilityProjectionPath(repoRoot, configuredStoreRoot),
      projectionSource: storedCurrentProjection && !storedProjectionStale ? "stored_projection" : "dynamic_aggregation",
      aggregationRanDynamically: !storedCurrentProjection || storedProjectionStale,
      storedProjectionUsed: Boolean(storedCurrentProjection && !storedProjectionStale),
      storedProjectionStale,
      currentProjection,
      historicalProjection,
      rawStore,
      producerKeysConfigured: Boolean(producerKeys),
    });

    return normalizeOrganizationalObservabilityProjection({
      currentProjection,
      historicalProjection,
      qualificationProjections,
      diagnostics,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Organizational Observability projection unavailable";
    return unavailableObservabilityProjection(reason);
  }
}

export async function getDeltaHqViewModel(): Promise<DeltaHqViewModel> {
  const base = cloneBaseViewModel();
  const [evolution, observabilityProjection] = await Promise.all([
    getHistorianEvolutionProjection(),
    getOrganizationalObservabilityProjection(),
  ]);
  const issues = await getIssuesProjection(observabilityProjection);
  return {
    ...base,
    generatedAt: new Date().toISOString(),
    evolution,
    issues,
    observability: {
      ...base.observability,
      status: observabilityProjection.status === "available"
        ? "Organizational Observability is wired as a trust-labeled read-only projection. HQ displays supplied trust, freshness, data quality, and missing-state fields directly."
        : base.observability.status,
      projection: observabilityProjection,
    },
    currentRealDataIntegrations: base.currentRealDataIntegrations.some((source) =>
      source.label === "Organizational Observability projection"
    )
      ? base.currentRealDataIntegrations.some((source) => source.label === "Issues & Diagnosis projection")
        ? base.currentRealDataIntegrations
        : [
            ...base.currentRealDataIntegrations,
            {
              label: "Issues & Diagnosis projection",
              kind: "real",
              path: "delta-site/src/lib/deltaHqServerViewModel.ts",
              detail:
                "Builds read-only known-issue display records from structured source artifacts without creating a registry, lifecycle authority, remediation action, or Event Bus change.",
            },
          ]
      : [
          ...base.currentRealDataIntegrations,
          {
            label: "Organizational Observability projection",
            kind: "real",
            path: "delta-agent/src/observability/aggregate.mjs",
            detail:
              "Supplies read-only metric_id, value, trust_state, data_quality_state, freshness, qualification epoch, source count, and producer identity fields for HQ display.",
          },
          {
            label: "Issues & Diagnosis projection",
            kind: "real",
            path: "delta-site/src/lib/deltaHqServerViewModel.ts",
            detail:
              "Builds read-only known-issue display records from structured source artifacts without creating a registry, lifecycle authority, remediation action, or Event Bus change.",
          },
        ],
    mockedOrAwaitingCoreFields: base.mockedOrAwaitingCoreFields.filter((source) =>
      source.label !== "Organizational Observability metrics",
    ),
  };
}
