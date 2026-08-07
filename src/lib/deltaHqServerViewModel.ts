import path from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  DELTA_HQ_VIEW_MODEL,
  type DeltaHqEvolutionMilestone,
  type DeltaHqEvolutionProjection,
  type DeltaHqLineageTrackId,
  type DeltaHqMilestoneClaims,
  type DeltaHqMilestoneEvidenceReference,
  type DeltaHqObservabilityEpochProjection,
  type DeltaHqObservabilityFreshness,
  type DeltaHqObservabilityMetric,
  type DeltaHqObservabilityProjection,
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

function hasAgentRuntimeArtifacts(candidate: string): boolean {
  return existsSync(path.join(candidate, "src", "historian", "milestones.mjs"))
    && existsSync(path.join(candidate, "src", "observability", "aggregate.mjs"));
}

function resolveAgentRepoRoot(): string {
  const candidates = [
    process.env.DELTA_AGENT_REPO_ROOT,
    process.env.DELTA_HQ_AGENT_REPO_ROOT,
    ...deltaWorkspaceRootCandidates().flatMap((workspaceRoot) => [
      path.join(workspaceRoot, "delta-worktrees", "agent-main-promotion-2026-08-06"),
      ...agentWorktreeCandidates(workspaceRoot),
      path.join(workspaceRoot, "delta-agent"),
    ]),
    path.resolve(process.cwd(), "..", "delta-agent"),
    path.resolve(process.cwd(), "delta-agent"),
  ];

  return uniqueStrings(candidates).find(hasAgentRuntimeArtifacts) || path.resolve(process.cwd(), "..", "delta-agent");
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
    data_quality_state: stringValue(metric.data_quality_state, stringValue(dataQuality.state, trustState)),
    missing_reason: nullableString(metric.missing_reason) || nullableString(dataQuality.missing_reason),
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
    data_quality_state: stringValue(point.data_quality_state, stringValue(point.trust_state, "missing")),
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

function readStoredObservabilityProjection(repoRoot: string, storeRoot: string | null): JsonRecord | null {
  const configuredPath = process.env.DELTA_OBSERVABILITY_PROJECTION_PATH;
  const defaultPath = path.join(
    storeRoot || defaultObservabilityStoreRoot(repoRoot),
    "projections",
    "organizational-observability.json",
  );
  const candidates = [configuredPath, defaultPath].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const parsed = JSON.parse(readFileSync(candidate, "utf8")) as unknown;
    const projection = record(parsed);
    if (projection.projection_type === "organizational_observability") return projection;
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
  return {
    epoch_id: epochId,
    generated_at: nullableString(projection.generated_at),
    current_state_applicability: stringValue(projection.current_state_applicability, "qualification_epoch"),
    trust_summary: numberRecord(projection.trust_summary),
    metrics,
  };
}

function normalizeOrganizationalObservabilityProjection({
  currentProjection,
  historicalProjection = null,
  qualificationProjections = [],
}: {
  currentProjection: JsonRecord;
  historicalProjection?: JsonRecord | null;
  qualificationProjections?: Array<{ epochId: string; projection: JsonRecord }>;
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
  };
}

function unavailableObservabilityProjection(reason: string): DeltaHqObservabilityProjection {
  return {
    ...DELTA_HQ_VIEW_MODEL.observability.projection,
    unavailableReason: reason,
    fixtureFallback: true,
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
    .filter((entry) => entry.lineage_tracks.includes("converged_platform"))
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
        ? "Historian explicitly marks these milestones as converged."
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
    read_only_boundary: {
      canonical_mutation_performed: timeline.read_only_boundary?.canonical_mutation_performed
        || inspection.read_only_boundary?.canonical_mutation_performed
        || false,
      architecture_decision_performed: false,
      runtime_authority_assigned: timeline.read_only_boundary?.runtime_authority_assigned
        || inspection.read_only_boundary?.runtime_authority_assigned
        || false,
    },
  };
}

function unavailableEvolutionProjection(reason: string): DeltaHqEvolutionProjection {
  return {
    ...DELTA_HQ_VIEW_MODEL.evolution,
    unavailableReason: reason,
    fixtureFallback: true,
  };
}

export async function getHistorianEvolutionProjection(): Promise<DeltaHqEvolutionProjection> {
  try {
    const repoRoot = resolveAgentRepoRoot();
    const historian = await loadHistorianMilestoneModule(repoRoot);
    const inspection = historian.inspectHistorianMilestones({ repoRoot, significance: "all", limit: 50 });
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
    const repoRoot = resolveAgentRepoRoot();
    const storeRoot = resolveObservabilityStoreRoot();
    const producerKeys = loadObservabilityProducerKeys();
    const storedCurrentProjection = readStoredObservabilityProjection(repoRoot, storeRoot);
    let observabilityModule: OrganizationalObservabilityModule | null = null;

    if (!storedCurrentProjection) {
      observabilityModule = await loadOrganizationalObservabilityModule(repoRoot);
    }

    const currentProjection = storedCurrentProjection || record(observabilityModule?.aggregateFromStore({
      repoRoot,
      storeRoot,
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
        storeRoot,
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
          storeRoot,
          producerKeys,
          mode: "qualification_epoch",
          qualificationEpoch: epochId,
        })),
      }));
    } catch {
      historicalProjection = null;
      qualificationProjections = [];
    }

    return normalizeOrganizationalObservabilityProjection({
      currentProjection,
      historicalProjection,
      qualificationProjections,
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
  return {
    ...base,
    evolution,
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
      ? base.currentRealDataIntegrations
      : [
          ...base.currentRealDataIntegrations,
          {
            label: "Organizational Observability projection",
            kind: "real",
            path: "delta-agent/src/observability/aggregate.mjs",
            detail:
              "Supplies read-only metric_id, value, trust_state, data_quality_state, freshness, qualification epoch, source count, and producer identity fields for HQ display.",
          },
        ],
    mockedOrAwaitingCoreFields: base.mockedOrAwaitingCoreFields.filter((source) =>
      source.label !== "Organizational Observability metrics",
    ),
  };
}
