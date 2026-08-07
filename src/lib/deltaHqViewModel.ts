export type DeltaHqSourceKind = "real" | "fixture" | "awaiting_core";

export type DeltaHqLifecycle =
  | "building"
  | "incubation"
  | "qualified"
  | "active"
  | "governed"
  | "maintenance"
  | "blocked"
  | "sleeping";

export type DeltaHqSeverity = "good" | "notice" | "blocked" | "attention";

export type DeltaHqSource = {
  label: string;
  kind: DeltaHqSourceKind;
  path?: string;
  detail: string;
};

export type DeltaHqSignal = {
  label: string;
  value: string;
  severity: DeltaHqSeverity;
  source: string;
};

export type DeltaHqAgent = {
  id: string;
  name: string;
  department: string;
  mission: string;
  lifecycle: DeltaHqLifecycle[];
  authority: string;
  qualification: string;
  contextSources: string[];
  lastActivity: string;
  evaluationHealth: string;
  cost: string;
  blockers: string[];
  recentDecisions: string[];
  wakeConditions: string[];
  sourceKind: DeltaHqSourceKind;
};

export type DeltaHqTrendPoint = {
  label: string;
  occurredAt: string;
  valueLabel: string;
  severity: DeltaHqSeverity;
  sourceKind: DeltaHqSourceKind;
};

export type DeltaHqTrendVisualization = {
  id: string;
  title: string;
  scope: string;
  canonicalMetricRef: string | null;
  definitionStatus: string;
  adapterNote: string;
  sourceKind: DeltaHqSourceKind;
  points: DeltaHqTrendPoint[];
};

export type DeltaHqDepartmentPerformancePanel = {
  id: string;
  title: string;
  canonicalMetricRef: string | null;
  definitionStatus: string;
  summary: string;
  sourceKind: DeltaHqSourceKind;
  points: DeltaHqTrendPoint[];
};

export type DeltaHqDepartment = {
  id: string;
  name: string;
  mission: string;
  owner: string;
  agentIds: string[];
  sourceKind: DeltaHqSourceKind;
  performancePanels: DeltaHqDepartmentPerformancePanel[];
};

export type DeltaHqObservabilityTrustState =
  | "trusted"
  | "partial"
  | "stale"
  | "untrusted"
  | "conflicted"
  | "missing"
  | "unpriced"
  | "fixture"
  | string;

export type DeltaHqObservabilityFreshness = {
  state: string;
  latest_accepted_source_time: string | null;
  max_age_ms: number | null;
  sla_ms: number | null;
};

export type DeltaHqObservabilityDimensionValues = Record<string, string | number | boolean | null>;

export type DeltaHqObservabilityMetric = {
  metric_id: string;
  metric_version: number;
  registry_version: string;
  aggregation_version: string;
  title: string;
  owner: string;
  scope: string;
  value: number | null;
  unit: string;
  trust_state: DeltaHqObservabilityTrustState;
  cost_trust_state: string | null;
  data_quality_state: string;
  missing_reason: string | null;
  aggregation_window: {
    from: string | null;
    to: string | null;
    mode: string;
    qualification_epoch: string | null;
  };
  measurement_time_range: {
    from: string | null;
    to: string | null;
  };
  source_freshness: DeltaHqObservabilityFreshness;
  latest_accepted_source_time: string | null;
  current_state_applicability: string;
  qualification_epochs: string[];
  current_qualification_epoch: string | null;
  source_event_count: number;
  producer_identities: string[];
  dimensioned_points: DeltaHqObservabilityTimeSeriesPoint[];
};

export type DeltaHqObservabilityTimeSeriesPoint = {
  timestamp: string;
  metric_id: string;
  metric_version: number;
  registry_version: string;
  aggregation_version: string;
  value: number | null;
  unit: string;
  trust_state: DeltaHqObservabilityTrustState;
  cost_trust_state: string | null;
  data_quality_state: string;
  dimension_values: DeltaHqObservabilityDimensionValues;
  aggregation_window: {
    from: string | null;
    to: string | null;
    mode: string;
    qualification_epoch: string | null;
  };
  measurement_time_range: {
    from: string | null;
    to: string | null;
  };
  source_freshness_state: string;
  latest_accepted_source_time: string | null;
  source_event_count: number;
  qualification_epochs: string[];
  current_state_applicability: string;
};

export type DeltaHqObservabilityEpochProjection = {
  epoch_id: string;
  generated_at: string | null;
  current_state_applicability: string;
  trust_summary: Record<string, number>;
  metrics: DeltaHqObservabilityMetric[];
  time_series_points: DeltaHqObservabilityTimeSeriesPoint[];
  dimensioned_time_series_points: DeltaHqObservabilityTimeSeriesPoint[];
};

export type DeltaHqObservabilityProjectionDiagnostics = {
  repo_root: string | null;
  repo_root_source: string;
  repo_root_warning: string | null;
  store_root: string | null;
  projection_path: string | null;
  projection_source: "stored_projection" | "dynamic_aggregation" | "unavailable";
  aggregation_ran_dynamically: boolean;
  stored_projection_used: boolean;
  stored_projection_stale: boolean;
  raw_event_count: number;
  accepted_source_event_count: number;
  rejected_source_event_count: number;
  invalid_raw_event_count: number;
  duplicate_source_event_count: number;
  newest_raw_event_time: string | null;
  newest_accepted_event_time: string | null;
  projection_generated_at: string | null;
  producer_keys_configured: boolean;
  empty_state_reason: string | null;
  next_event_owner: string | null;
  historical_only: boolean;
};

export type DeltaHqObservabilityProjection = {
  status: "available" | "unavailable";
  projection_id: string | null;
  projection_type: string;
  generated_at: string | null;
  evaluated_at: string | null;
  fixtureFallback: boolean;
  unavailableReason?: string;
  source_of_truth: string;
  diagnostics: DeltaHqObservabilityProjectionDiagnostics;
  promotionScope: string;
  authorityLimitations: string[];
  registry_version: string | null;
  aggregation_version: string | null;
  latest_accepted_source_time: string | null;
  current_state_applicability: string;
  current_qualification_epoch: string | null;
  available_qualification_epochs: string[];
  guarantees: Record<string, boolean>;
  trust_summary: Record<string, number>;
  data_quality_summary: {
    metric_count: number;
    by_state: Record<string, number>;
    raw_valid_event_count: number;
    accepted_source_event_count: number;
    rejected_source_event_count: number;
    duplicate_source_event_count: number;
    invalid_raw_event_count: number;
  };
  event_acceptance_summary: {
    raw_valid_event_count: number;
    accepted_source_event_count: number;
    rejected_source_event_count: number;
    duplicate_source_event_count: number;
    invalid_raw_event_count: number;
    rejected_by_reason: Record<string, number>;
  };
  metrics: DeltaHqObservabilityMetric[];
  metricsByScope: Record<string, DeltaHqObservabilityMetric[]>;
  historicalMetrics: DeltaHqObservabilityMetric[];
  qualificationEpochs: DeltaHqObservabilityEpochProjection[];
  time_series_points: DeltaHqObservabilityTimeSeriesPoint[];
  historical_time_series_points: DeltaHqObservabilityTimeSeriesPoint[];
  dimensioned_time_series_points: DeltaHqObservabilityTimeSeriesPoint[];
  historical_dimensioned_time_series_points: DeltaHqObservabilityTimeSeriesPoint[];
};

export type DeltaHqLineageTrackId = "product_intelligence" | "engineering_agentic" | "converged_platform";

export type DeltaHqMilestoneEvidenceReference = {
  kind?: string;
  ref: string;
  summary?: string;
  confidence: string;
  claim_classification: string;
};

export type DeltaHqMilestoneClaims = {
  directly_evidenced: string[];
  strongly_inferred: string[];
  unresolved: string[];
};

export type DeltaHqEvolutionMilestone = {
  date: string;
  milestone_id: string;
  milestone: string;
  significance: string;
  lineage_tracks: DeltaHqLineageTrackId[];
  concise_description: string;
  major_capability_gained: string;
  predecessor_milestones: string[];
  successor_milestones: string[];
  evidence_confidence: string;
  evidence_references: DeltaHqMilestoneEvidenceReference[];
  claim_summary: DeltaHqMilestoneClaims;
  record_ref?: string;
  evidence_mode: string;
  directly_evidenced: boolean;
};

export type DeltaHqLineageTrack = {
  id: DeltaHqLineageTrackId;
  label: string;
  description: string;
  milestone_ids: string[];
};

export type DeltaHqEvolutionProjection = {
  status: string;
  generated_at: string | null;
  inspected_at: string | null;
  timeline_window: {
    from: string | null;
    to: string | null;
  };
  source_of_truth: string;
  source_boundary: string;
  fixtureFallback: boolean;
  unavailableReason?: string;
  entries: DeltaHqEvolutionMilestone[];
  lineage_tracks: DeltaHqLineageTrack[];
  convergence: {
    status: string;
    milestone_ids: string[];
    explanation: string;
  };
  analyticsAnnotationSeams: string[];
  askDeltaSuggestedQuestions: string[];
  read_only_boundary: {
    canonical_mutation_performed: boolean;
    architecture_decision_performed: boolean;
    runtime_authority_assigned: boolean;
  };
};

export type DeltaHqInitiative = {
  id: string;
  objective: string;
  owner: string;
  lifecycle: DeltaHqLifecycle;
  dependencies: string[];
  blockers: string[];
  qualification: string;
  integrationReadiness: string;
  recentMovement: string;
  sourceKind: DeltaHqSourceKind;
};

export type DeltaHqActivityEvent = {
  id: string;
  occurredAt: string;
  title: string;
  summary: string;
  actor: string;
  affected: string[];
  severity: DeltaHqSeverity;
  reviewId?: string;
  sourceKind: DeltaHqSourceKind;
};

export type DeltaHqOwnerReview = {
  id: string;
  event: string;
  status: string;
  primaryOwner: string;
  recommendation: string;
  routeOrHandoff: string;
  escalation: string;
  uncertainty: string[];
  stoppingReason: string;
  cost: string;
  evidence: Array<{
    label: string;
    contribution: string;
    trust: string;
    sourceKind: DeltaHqSourceKind;
  }>;
  provenance: string[];
  supportedControls: string[];
  sourceKind: DeltaHqSourceKind;
};

export type DeltaHqViewModel = {
  generatedAt: string;
  routeDecision: {
    primarySurface: string;
    sharedRendererMount: string;
    desktopDeliveryPath: string;
    separatedSurface: string;
    shellDecision: string;
  };
  executiveBrief: {
    headline: string;
    summary: string;
    criticalPath: string;
    recommendation: string;
    signals: DeltaHqSignal[];
  };
  observability: {
    status: string;
    contractOwner: string;
    projection: DeltaHqObservabilityProjection;
    briefTrends: DeltaHqTrendVisualization[];
    departments: DeltaHqDepartment[];
    dedicatedSurfaces: Array<{
      id: string;
      label: string;
      purpose: string;
      sourceKind: DeltaHqSourceKind;
    }>;
    contractIntegrationPoints: string[];
    guardedSemantics: string[];
  };
  evolution: DeltaHqEvolutionProjection;
  organization: DeltaHqAgent[];
  initiatives: DeltaHqInitiative[];
  activity: DeltaHqActivityEvent[];
  reviews: DeltaHqOwnerReview[];
  operatorBoundary: {
    normalHq: string[];
    operatorMode: string[];
  };
  currentRealDataIntegrations: DeltaHqSource[];
  mockedOrAwaitingCoreFields: DeltaHqSource[];
  eventBusIntegrationPoints: string[];
  webIntegrationPlan: string[];
  desktopIntegrationPlan: string[];
  deferredMacCapabilities: string[];
};

export const DELTA_HQ_OWNER_ID = "delta-hq-owner-local";

export const DELTA_HQ_VIEW_MODEL: DeltaHqViewModel = {
  generatedAt: "2026-08-06T20:49:21.646Z",
  routeDecision: {
    primarySurface: "/hq is the primary first-pass owner operating surface for the website.",
    sharedRendererMount: "/hq is the shared HQ experience for web now and Delta.app later.",
    desktopDeliveryPath: "Delta.app remains the future desktop delivery path for the same HQ experience plus native/local-runtime capabilities.",
    separatedSurface: "/os remains the local OS Console and is not turned into HQ.",
    shellDecision:
      "Preserve the existing delta-site Electron foundation for future desktop delivery, but do not let native shell work block web HQ progress.",
  },
  executiveBrief: {
    headline: "Delta is governed and inspectable; release readiness is blocked by source parity.",
    summary:
      "The engineering organization has clean architecture drift, deny-by-default governance, and a reviewed Historian runtime seam. The blocking decision is whether the dirty multi-repo worktrees are active work to reconcile or unrelated work to isolate before verification and release claims.",
    criticalPath: "Resolve source parity, then run cross-repo verification before any release or capability promotion.",
    recommendation:
      "Treat the current dirty worktrees as the owner decision. Do not approve release-readiness work until each repo is clean, intentionally parked, or isolated in a reviewed worktree.",
    signals: [
      {
        label: "Architecture",
        value: "OK, 0 warnings, 0 blocks",
        severity: "good",
        source: "architecture-drift-check 2026-08-06T20:49:20Z",
      },
      {
        label: "Governance",
        value: "Deny by default, single-use leases",
        severity: "good",
        source: "agent:governance report 2026-08-06",
      },
      {
        label: "Release readiness",
        value: "Blocked by uncommitted changes",
        severity: "blocked",
        source: "agent:quality report 2026-08-06T20:49:20Z",
      },
      {
        label: "Owner attention",
        value: "1 primary decision, 2 advisory reviews",
        severity: "attention",
        source: "HQ adapter projection awaiting Core Event Bus",
      },
      {
        label: "Runtime connectivity",
        value: "Browser HQ active; native runtime bridge optional",
        severity: "notice",
        source: "shared HQ renderer and optional Electron bridge",
      },
    ],
  },
  observability: {
    status: "Connected to the Organizational Observability contract when the server projection is available; fixture panels remain labeled as future-only placeholders.",
    contractOwner: "Core Intelligence + Evaluation",
    projection: {
      status: "unavailable",
      projection_id: null,
      projection_type: "organizational_observability",
      generated_at: null,
      evaluated_at: null,
      fixtureFallback: true,
      unavailableReason: "Organizational Observability projection has not been loaded by the HQ server adapter.",
      source_of_truth: "delta-agent/src/observability/aggregate.mjs",
      diagnostics: {
        repo_root: null,
        repo_root_source: "unresolved",
        repo_root_warning: null,
        store_root: null,
        projection_path: null,
        projection_source: "unavailable",
        aggregation_ran_dynamically: false,
        stored_projection_used: false,
        stored_projection_stale: false,
        raw_event_count: 0,
        accepted_source_event_count: 0,
        rejected_source_event_count: 0,
        invalid_raw_event_count: 0,
        duplicate_source_event_count: 0,
        newest_raw_event_time: null,
        newest_accepted_event_time: null,
        projection_generated_at: null,
        producer_keys_configured: false,
        empty_state_reason: "HQ server adapter has not attempted to load the Organizational Observability projection.",
        next_event_owner: "Organizational Observability telemetry producers",
        historical_only: false,
      },
      promotionScope: "trust-labeled read-only display",
      authorityLimitations: [
        "Not an executive health authority.",
        "Not a Mission Control reasoning input.",
        "Not an anomaly-triggered Event Bus input.",
      ],
      registry_version: null,
      aggregation_version: null,
      latest_accepted_source_time: null,
      current_state_applicability: "unavailable",
      current_qualification_epoch: null,
      available_qualification_epochs: [],
      guarantees: {
        composite_health_score: false,
        runtime_authority_added: false,
        legacy_evidence_excluded_from_current_health: true,
      },
      trust_summary: {},
      data_quality_summary: {
        metric_count: 0,
        by_state: {},
        raw_valid_event_count: 0,
        accepted_source_event_count: 0,
        rejected_source_event_count: 0,
        duplicate_source_event_count: 0,
        invalid_raw_event_count: 0,
      },
      event_acceptance_summary: {
        raw_valid_event_count: 0,
        accepted_source_event_count: 0,
        rejected_source_event_count: 0,
        duplicate_source_event_count: 0,
        invalid_raw_event_count: 0,
        rejected_by_reason: {},
      },
      metrics: [],
      metricsByScope: {},
      historicalMetrics: [],
      qualificationEpochs: [],
      time_series_points: [],
      historical_time_series_points: [],
      dimensioned_time_series_points: [],
      historical_dimensioned_time_series_points: [],
    },
    briefTrends: [
      {
        id: "trend-source-readiness",
        title: "Release readiness",
        scope: "Executive Brief",
        canonicalMetricRef: null,
        definitionStatus: "Awaiting Organizational Observability contract.",
        adapterNote:
          "Adapter projects known release-readiness states from existing quality and supervisor artifacts; it is not a telemetry definition.",
        sourceKind: "fixture",
        points: [
          {
            label: "Architecture",
            occurredAt: "2026-08-06T20:49:20.687Z",
            valueLabel: "clear",
            severity: "good",
            sourceKind: "real",
          },
          {
            label: "Quality",
            occurredAt: "2026-08-06T20:49:20.766Z",
            valueLabel: "blocked",
            severity: "blocked",
            sourceKind: "real",
          },
          {
            label: "Supervisor",
            occurredAt: "2026-08-06T20:49:21.646Z",
            valueLabel: "decision required",
            severity: "attention",
            sourceKind: "real",
          },
        ],
      },
      {
        id: "trend-governance-posture",
        title: "Governance posture",
        scope: "Executive Brief",
        canonicalMetricRef: null,
        definitionStatus: "Awaiting Organizational Observability contract.",
        adapterNote:
          "Adapter projects discrete governance evidence from current reports; no rate, score, or threshold is defined here.",
        sourceKind: "fixture",
        points: [
          {
            label: "Policy",
            occurredAt: "2026-08-06T20:49:20.000Z",
            valueLabel: "deny by default",
            severity: "good",
            sourceKind: "real",
          },
          {
            label: "Desktop safety",
            occurredAt: "2026-08-06T20:49:21.646Z",
            valueLabel: "bounded",
            severity: "good",
            sourceKind: "real",
          },
          {
            label: "Release",
            occurredAt: "2026-08-06T20:49:21.646Z",
            valueLabel: "stopped",
            severity: "blocked",
            sourceKind: "real",
          },
        ],
      },
      {
        id: "trend-owner-review-load",
        title: "Owner review load",
        scope: "Executive Brief",
        canonicalMetricRef: null,
        definitionStatus: "Awaiting Organizational Observability contract.",
        adapterNote:
          "Adapter counts review fixtures already presented by HQ; canonical review load semantics must come from Core.",
        sourceKind: "fixture",
        points: [
          {
            label: "Historian",
            occurredAt: "2026-08-06T19:20:00.000Z",
            valueLabel: "complete",
            severity: "good",
            sourceKind: "fixture",
          },
          {
            label: "Source parity",
            occurredAt: "2026-08-06T20:49:20.766Z",
            valueLabel: "decision required",
            severity: "attention",
            sourceKind: "fixture",
          },
        ],
      },
    ],
    departments: [
      {
        id: "department-core",
        name: "Core",
        mission: "Publish the contracts that make HQ a consumer of organizational truth rather than a source of it.",
        owner: "Core Intelligence",
        agentIds: ["core-intelligence"],
        sourceKind: "awaiting_core",
        performancePanels: [
          {
            id: "core-contract-availability",
            title: "Contract availability",
            canonicalMetricRef: null,
            definitionStatus: "Awaiting Core Event Bus and Organizational Observability schema.",
            summary: "HQ can show the contract gap, but it cannot measure Core performance until Core publishes the observability contract.",
            sourceKind: "awaiting_core",
            points: [
              {
                label: "Event Bus",
                occurredAt: "2026-08-06T20:49:21.646Z",
                valueLabel: "awaiting",
                severity: "attention",
                sourceKind: "awaiting_core",
              },
              {
                label: "Lifecycle",
                occurredAt: "2026-08-06T20:49:21.646Z",
                valueLabel: "awaiting",
                severity: "attention",
                sourceKind: "awaiting_core",
              },
            ],
          },
        ],
      },
      {
        id: "department-coordination",
        name: "Coordination",
        mission: "Keep Mission Control reviews advisory, bounded, and traceable.",
        owner: "Mission Control",
        agentIds: ["mission-control"],
        sourceKind: "fixture",
        performancePanels: [
          {
            id: "coordination-review-state",
            title: "Review state history",
            canonicalMetricRef: null,
            definitionStatus: "Awaiting persistent review records from Core.",
            summary: "Current view projects existing owner-review fixtures; it does not define review throughput or SLA metrics.",
            sourceKind: "fixture",
            points: [
              {
                label: "Historian review",
                occurredAt: "2026-08-06T19:20:00.000Z",
                valueLabel: "complete",
                severity: "good",
                sourceKind: "fixture",
              },
              {
                label: "Source parity",
                occurredAt: "2026-08-06T20:49:20.766Z",
                valueLabel: "decision required",
                severity: "attention",
                sourceKind: "fixture",
              },
            ],
          },
        ],
      },
      {
        id: "department-governance",
        name: "Governance",
        mission: "Keep authority, risk, architecture, and verification boundaries visible.",
        owner: "Architecture Steward + Security + Evaluation",
        agentIds: ["architecture-steward", "security", "evaluation"],
        sourceKind: "real",
        performancePanels: [
          {
            id: "governance-boundary-checks",
            title: "Boundary check history",
            canonicalMetricRef: null,
            definitionStatus: "Awaiting canonical observability metric definition.",
            summary: "Current panels project known check outcomes from deterministic reports; HQ does not create a governance score.",
            sourceKind: "fixture",
            points: [
              {
                label: "Architecture",
                occurredAt: "2026-08-06T20:49:20.687Z",
                valueLabel: "clear",
                severity: "good",
                sourceKind: "real",
              },
              {
                label: "Policy",
                occurredAt: "2026-08-06T20:49:20.000Z",
                valueLabel: "enforced",
                severity: "good",
                sourceKind: "real",
              },
              {
                label: "Release",
                occurredAt: "2026-08-06T20:49:20.766Z",
                valueLabel: "blocked",
                severity: "blocked",
                sourceKind: "real",
              },
            ],
          },
        ],
      },
      {
        id: "department-experience-product",
        name: "Experience + Product",
        mission: "Make HQ coherent as a browser-first owner surface while preserving the future desktop path.",
        owner: "Experience + Product",
        agentIds: ["experience", "product", "integration-steward"],
        sourceKind: "fixture",
        performancePanels: [
          {
            id: "experience-surface-readiness",
            title: "Surface readiness history",
            canonicalMetricRef: null,
            definitionStatus: "Awaiting Organizational Observability contract.",
            summary: "Current status points come from explicit product decisions and implementation state; no UX health metric is defined.",
            sourceKind: "fixture",
            points: [
              {
                label: "OS separation",
                occurredAt: "2026-08-06T20:49:21.646Z",
                valueLabel: "preserved",
                severity: "good",
                sourceKind: "real",
              },
              {
                label: "Web HQ",
                occurredAt: "2026-08-06T20:49:21.646Z",
                valueLabel: "building",
                severity: "notice",
                sourceKind: "fixture",
              },
            ],
          },
        ],
      },
      {
        id: "department-delivery",
        name: "Delivery",
        mission: "Convert approved work into verified outcomes without hidden merge, deploy, or mutation authority.",
        owner: "Execution",
        agentIds: ["execution"],
        sourceKind: "real",
        performancePanels: [
          {
            id: "delivery-release-readiness",
            title: "Release readiness history",
            canonicalMetricRef: null,
            definitionStatus: "Awaiting canonical release-readiness observability semantics.",
            summary: "Current state is derived from quality report findings; HQ does not turn this into a release score.",
            sourceKind: "fixture",
            points: [
              {
                label: "Quality report",
                occurredAt: "2026-08-06T20:49:20.766Z",
                valueLabel: "blocked",
                severity: "blocked",
                sourceKind: "real",
              },
            ],
          },
        ],
      },
      {
        id: "department-signals-domains",
        name: "Signals + Domains",
        mission: "Promote evidence-backed external and domain signals without overstating readiness.",
        owner: "Perception + Domain Intelligence Systems",
        agentIds: ["perception", "domain-intelligence"],
        sourceKind: "real",
        performancePanels: [
          {
            id: "signals-domain-evidence",
            title: "Evidence readiness history",
            canonicalMetricRef: null,
            definitionStatus: "Awaiting Organizational Observability contract.",
            summary: "Current panel projects existing readiness notes from accepted artifacts and open findings.",
            sourceKind: "fixture",
            points: [
              {
                label: "RSS reconciliation",
                occurredAt: "2026-08-06T17:13:42.378Z",
                valueLabel: "accepted",
                severity: "notice",
                sourceKind: "real",
              },
              {
                label: "Second proof",
                occurredAt: "2026-08-06T20:49:21.646Z",
                valueLabel: "blocked",
                severity: "blocked",
                sourceKind: "real",
              },
            ],
          },
        ],
      },
    ],
    dedicatedSurfaces: [
      {
        id: "analytics-executive",
        label: "Executive trends",
        purpose: "Small trend set for the Brief using adapter-projected status points until canonical metrics exist.",
        sourceKind: "fixture",
      },
      {
        id: "analytics-departments",
        label: "Department performance",
        purpose: "Department-level historical dashboards backed by observability adapters.",
        sourceKind: "fixture",
      },
      {
        id: "analytics-deep-dive",
        label: "Analytics deep dive",
        purpose: "Dedicated surface for deeper observability once Core publishes canonical metric IDs, definitions, and rollups.",
        sourceKind: "awaiting_core",
      },
    ],
    contractIntegrationPoints: [
      "observability.metric_id and canonical definition reference",
      "department.id, agent_refs, initiative_refs, and time window",
      "sampled_at, source_event_refs, rollup_basis, freshness, and trust class",
      "trend point value, display unit, comparison basis, and unavailable reason",
      "owner-review, event, initiative, and agent refs for drill-through",
      "visibility class separating normal HQ analytics from Operator diagnostics",
    ],
    guardedSemantics: [
      "HQ must render unavailable when a metric definition is absent.",
      "HQ adapters may project status points from existing artifacts but must label them as fixtures.",
      "HQ must not derive performance scores, SLAs, costs, or productivity metrics from logs.",
      "Operator diagnostics stay separate from owner-facing analytics.",
    ],
  },
  evolution: {
    status: "unavailable",
    generated_at: null,
    inspected_at: null,
    timeline_window: {
      from: null,
      to: null,
    },
    source_of_truth: "delta-agent/agent/historian/milestones",
    source_boundary: "Historian remains the source of milestone truth. HQ renders projections and does not modify milestone records.",
    fixtureFallback: true,
    unavailableReason: "Historian milestone runtime unavailable to the HQ adapter.",
    entries: [],
    lineage_tracks: [
      {
        id: "product_intelligence",
        label: "Product / Intelligence evolution",
        description: "Product intelligence lineage supplied by Historian milestone projections.",
        milestone_ids: [],
      },
      {
        id: "engineering_agentic",
        label: "Engineering / Agentic evolution",
        description: "Engineering-agent lineage supplied by Historian milestone projections.",
        milestone_ids: [],
      },
      {
        id: "converged_platform",
        label: "Converged platform",
        description: "Shown only when Historian explicitly assigns a converged lineage track.",
        milestone_ids: [],
      },
    ],
    convergence: {
      status: "unavailable",
      milestone_ids: [],
      explanation: "No convergence claim is rendered until Historian supplies a converged milestone projection.",
    },
    analyticsAnnotationSeams: [
      "Milestones can annotate future Analytics timelines by canonical milestone_id and timestamp.",
      "Since milestone comparisons stay disabled until Observability supplies compatible trend projections.",
      "Milestone annotations show temporal relationship only, not causation.",
    ],
    askDeltaSuggestedQuestions: [
      "When did Delta stop being health-only?",
      "Where did persistent memory first appear?",
      "What changed between Behavioral OS and Intelligence OS?",
      "When did the engineering-agent lineage begin?",
      "Which early ideas still exist today?",
    ],
    read_only_boundary: {
      canonical_mutation_performed: false,
      architecture_decision_performed: false,
      runtime_authority_assigned: false,
    },
  },
  organization: [
    {
      id: "core-intelligence",
      name: "Core Intelligence",
      department: "Core",
      mission:
        "Own the Event Bus and Agent Lifecycle Manager contracts that will become the source of live organizational truth.",
      lifecycle: ["building", "governed"],
      authority: "Contract owner for lifecycle/event semantics; not duplicated by HQ.",
      qualification: "Core contract pending. HQ consumes fixtures at this seam.",
      contextSources: ["Delta Agent Specification", "Event Bus integration checklist"],
      lastActivity: "Event Bus fields are expected but not yet canonical.",
      evaluationHealth: "Pending Core lifecycle-manager qualification.",
      cost: "Unavailable until runtime usage summary lands on Event Bus.",
      blockers: ["Persistent event/result schema and lifecycle snapshot contract not published."],
      recentDecisions: ["Keep HQ as a consumer of Core contracts, not a lifecycle source."],
      wakeConditions: ["Core publishes event, lifecycle, review, cost, and integrity snapshots."],
      sourceKind: "awaiting_core",
    },
    {
      id: "mission-control",
      name: "Mission Control",
      department: "Coordination",
      mission:
        "Coordinate bounded engineering initiatives, route advisory outcomes, and stop before execution authority is required.",
      lifecycle: ["incubation", "active"],
      authority: "Advisory/process-local mission orchestration; execution stays approval-gated.",
      qualification: "Owner-review experience contract is complete; persistent event contract pending.",
      contextSources: ["Mission Control owner-review contract", "capability registry", "governance policy"],
      lastActivity: "Supervisor report recommended capability-first audit as next command.",
      evaluationHealth: "Mission orchestrator tests exist in delta-agent; live persistent review mapping pending.",
      cost: "Unavailable from canonical runtime. HQ shows no cost totals outside review fixtures.",
      blockers: ["No canonical Mission Control terminal event/result feed yet."],
      recentDecisions: [
        "Accepting review cannot route, notify, approve, start a handoff, or execute work.",
        "Mission status remains separate from owner review state.",
      ],
      wakeConditions: ["New terminal mission result", "human-required escalation", "review-ready handoff"],
      sourceKind: "real",
    },
    {
      id: "historian",
      name: "Historian",
      department: "Continuity",
      mission:
        "Preserve temporal engineering evidence and expose bounded packet inspection without mutating canon.",
      lifecycle: ["qualified", "active"],
      authority: "Read-only packet inspection and provenance visibility; no canon mutation through HQ.",
      qualification: "Historian runtime interface v1 implemented with tests passing in source artifact.",
      contextSources: ["historian-runtime-interface-v1 update", "canon decision ledger"],
      lastActivity: "Read-only historian packet inspection interface implemented on 2026-08-06T19:20:00Z.",
      evaluationHealth: "Historian runtime tests passed in recorded update.",
      cost: "No provider call performed in recorded historian update.",
      blockers: [],
      recentDecisions: ["Mission Control may consume historian packet inspect as an optional context source."],
      wakeConditions: ["New architecture-impact packet", "new change summary", "canon reconciliation request"],
      sourceKind: "real",
    },
    {
      id: "architecture-steward",
      name: "Architecture Steward",
      department: "Governance",
      mission:
        "Maintain architecture truth, detect drift, and keep subsystem authority boundaries explicit.",
      lifecycle: ["governed", "maintenance"],
      authority: "Advisory canon and drift review; no runtime or product execution.",
      qualification: "Architecture drift check passed with 0 warnings and 0 blocks.",
      contextSources: ["architecture invariants", "canon decisions", "Delta Product Specification"],
      lastActivity: "Accepted web monitoring RSS architecture-impact packet into canon decision ledger.",
      evaluationHealth: "Drift scanner covered 37 source files in the latest report.",
      cost: "Deterministic check; no model cost.",
      blockers: [],
      recentDecisions: [
        "Web monitoring RSS promotion reconciliation accepted as architecture-impact record.",
      ],
      wakeConditions: ["New architecture-impact packet", "cross-repo boundary change", "product object change"],
      sourceKind: "real",
    },
    {
      id: "integration-steward",
      name: "Integration Steward",
      department: "Integration",
      mission:
        "Keep external connections, local runtime seams, and product surfaces truthful about readiness and effects.",
      lifecycle: ["building", "incubation"],
      authority: "Readiness and integration review only; provider reads and writes remain separately gated.",
      qualification: "Browser HQ uses the shared renderer; Electron runtime status remains an optional native capability.",
      contextSources: ["shared HQ renderer", "desktop service manager", "capability registry", "WHOOP integration boundaries"],
      lastActivity: "HQ can run in a normal browser while preserving the future Electron runtime bridge.",
      evaluationHealth: "Site and backend production parity blocked until source parity is resolved.",
      cost: "Unavailable until runtime/API economics feed is published.",
      blockers: ["No durable integration-readiness feed from Core yet."],
      recentDecisions: ["Normal HQ hides provider/tool names unless evidence requires them."],
      wakeConditions: ["Connector freshness change", "runtime reachability failure", "integration contract change"],
      sourceKind: "real",
    },
    {
      id: "security",
      name: "Security",
      department: "Risk",
      mission:
        "Protect approval boundaries, secret handling, production mutations, and unsafe side effects.",
      lifecycle: ["governed", "active"],
      authority: "Verification and risk classification; cannot approve its own execution.",
      qualification: "Governance report confirms hard denials and blocked model self-authorization.",
      contextSources: ["governance policy", "desktop smoke checks", "Electron safety guards"],
      lastActivity: "Hard-denied effects include deploy, push, Supabase mutation, notification, and secret reads.",
      evaluationHealth: "Desktop static checks enforce sandbox, narrow bridge, and fixed spawn definitions.",
      cost: "Deterministic policy inspection.",
      blockers: [],
      recentDecisions: ["Packaged desktop mode must not launch development services."],
      wakeConditions: ["Auth/security/privacy change", "provider integration", "desktop permission expansion"],
      sourceKind: "real",
    },
    {
      id: "evaluation",
      name: "Evaluation",
      department: "Quality",
      mission:
        "Verify whether changes improve agent reasoning, authority separation, stop behavior, and benchmark coverage.",
      lifecycle: ["qualified", "maintenance"],
      authority: "Evaluation quality review only; cannot decide implementation correctness or release.",
      qualification: "Evaluation Governance is canonical; deterministic eval routes are present.",
      contextSources: ["Delta Evaluation Governance", "site eval fixtures", "agent test registry"],
      lastActivity: "Delegated deterministic eval reported as available in supervisor report.",
      evaluationHealth: "Full cross-repo verification not run because quality report was static.",
      cost: "Deterministic fixture evals have no provider cost.",
      blockers: ["Release verification is blocked until source parity is resolved."],
      recentDecisions: ["New HQ product surface should receive reasoning coverage before maturity claim."],
      wakeConditions: ["New agent", "authority change", "product object change", "benchmark drift"],
      sourceKind: "real",
    },
    {
      id: "product",
      name: "Product",
      department: "Product",
      mission:
        "Keep Delta organized around canonical objects and prevent internal capabilities from becoming competing products.",
      lifecycle: ["governed", "active"],
      authority: "Product contract stewardship; no runtime execution.",
      qualification: "Delta Product Specification v1 is canonical.",
      contextSources: ["Delta Product Specification v1", "public capability manifest"],
      lastActivity: "Confirmed HQ should be owner-facing, browser-first, and separate from consumer Delta and OS Console.",
      evaluationHealth: "Product consistency tests exist for public claims and route hygiene.",
      cost: "No runtime cost.",
      blockers: [],
      recentDecisions: ["HQ is a dedicated owner web app surface now; Delta.app later reuses the same experience."],
      wakeConditions: ["New product object", "navigation change", "consumer/operator boundary change"],
      sourceKind: "real",
    },
    {
      id: "experience",
      name: "Experience",
      department: "Experience",
      mission:
        "Make organization state legible, restrained, advisory-safe, and inspectable without exposing raw logs by default.",
      lifecycle: ["governed", "active"],
      authority: "Owner-facing presentation semantics; no canonical state mutation.",
      qualification: "Mission Control owner-review experience contract is complete.",
      contextSources: ["Owner-review contract", "Delta Experience Specification"],
      lastActivity: "Defined advisory controls and Operator Mode boundary for Mission Control reviews.",
      evaluationHealth: "Needs browser HQ interaction tests after Event Bus and Observability contracts land.",
      cost: "No runtime cost.",
      blockers: [],
      recentDecisions: ["Review controls must repeat the advisory-only non-effect boundary."],
      wakeConditions: ["New review interaction", "new uncertainty/evidence semantics", "HQ navigation change"],
      sourceKind: "real",
    },
    {
      id: "execution",
      name: "Execution",
      department: "Execution",
      mission:
        "Turn approved work into bounded actions with verification, stop conditions, and no hidden merge/deploy authority.",
      lifecycle: ["qualified", "blocked"],
      authority: "Approved worktree implementation and verification only; no merge, push, deploy, or production mutation.",
      qualification: "Capability registry contains approval-gated implementation and verification capabilities.",
      contextSources: ["capability registry", "quality report", "governance policy"],
      lastActivity: "Production quality report blocked release readiness on dirty worktrees.",
      evaluationHealth: "Static quality report completed; verification not run.",
      cost: "Unavailable until model/tool usage summary lands.",
      blockers: ["Agent, site, backend, and mobile worktrees are dirty."],
      recentDecisions: ["Stop before merge/deploy even when verification passes."],
      wakeConditions: ["Approved implementation mission", "verification failure", "owner-approved repair"],
      sourceKind: "real",
    },
    {
      id: "perception",
      name: "Perception",
      department: "Signals",
      mission:
        "Normalize external signals into evidence with provenance, freshness, and bounded handoff semantics.",
      lifecycle: ["building", "incubation"],
      authority: "Evidence gathering and source normalization; no execution or owner notification.",
      qualification: "Web monitoring RSS reconciliation has an accepted architecture decision record.",
      contextSources: ["canon decision ledger", "web monitoring updates", "evaluation governance"],
      lastActivity: "Web monitoring RSS architecture-impact record accepted into canon decision ledger.",
      evaluationHealth: "Perception scenarios should cover source policy, freshness, and confidence.",
      cost: "No provider call in recorded architecture decision.",
      blockers: ["Canonical documentation proposal remains a follow-up action."],
      recentDecisions: ["ExternalSignal and WebLead interfaces identified as affected."],
      wakeConditions: ["New source adapter", "stale source", "conflicting evidence", "new market signal"],
      sourceKind: "real",
    },
    {
      id: "domain-intelligence",
      name: "Domain Intelligence Systems",
      department: "Domains",
      mission:
        "Promote proof-backed domain intelligence without turning narrow scenario evidence into broad product claims.",
      lifecycle: ["incubation", "active"],
      authority: "Domain-specific reasoning proposals and proof review; no autonomous delivery.",
      qualification: "Late-caffeine proof is mature; second proof-backed domain remains in maintenance queue.",
      contextSources: ["Behavioral OS domain docs", "site findings", "backend scenario evidence"],
      lastActivity: "Legacy finding 020 remains open and approval-required.",
      evaluationHealth: "Poor sleep workout readiness scenario artifacts exist; promotion review still bounded.",
      cost: "Unavailable from canonical runtime.",
      blockers: ["Second proof scenario candidate still requires approved implementation path."],
      recentDecisions: ["Do not label new domain intelligence as product-ready before evidence exists."],
      wakeConditions: ["New domain event taxonomy", "scenario eval result", "promotion gate review"],
      sourceKind: "real",
    },
  ],
  initiatives: [
    {
      id: "delta-hq-web-surface",
      objective: "Build Delta HQ as the browser-first owner operating surface.",
      owner: "Experience + Product",
      lifecycle: "building",
      dependencies: ["HQ view-model adapter", "Mission Control owner-review contract", "web route protection"],
      blockers: [],
      qualification: "First pass uses route tests, shared model tests, and browser-safe runtime fallbacks.",
      integrationReadiness: "/hq renders in a normal browser. Delta.app can later load the same route with native runtime capabilities.",
      recentMovement: "Delivery priority changed to Web HQ now, Delta.app later using the same shared experience.",
      sourceKind: "real",
    },
    {
      id: "organizational-observability-prep",
      objective: "Render Organizational Observability as trust-labeled read-only HQ evidence.",
      owner: "Core Intelligence + Evaluation + Experience",
      lifecycle: "building",
      dependencies: ["Organizational Observability projection", "department refs", "event refs", "review refs"],
      blockers: ["Executive-health authority remains unapproved by governance."],
      qualification: "Read-only projection display is approved; HQ must not turn Phase 1 telemetry into a composite health authority.",
      integrationReadiness: "Analytics, Brief facts, and department panels can display supplied trust labels and missing states.",
      recentMovement: "HQ consumes the canonical projection fields and keeps fixture-only future panels labeled separately.",
      sourceKind: "real",
    },
    {
      id: "core-event-bus-lifecycle-manager",
      objective: "Publish the Core-owned event and agent lifecycle contract consumed by HQ.",
      owner: "Core Intelligence",
      lifecycle: "building",
      dependencies: ["Event Bus schema", "Agent Lifecycle Manager", "Mission Control terminal records"],
      blockers: ["Core contract not published to HQ yet."],
      qualification: "Awaiting Core.",
      integrationReadiness: "HQ adapter has explicit seam and fixtures.",
      recentMovement: "HQ identified exact integration points and fail-closed behavior.",
      sourceKind: "awaiting_core",
    },
    {
      id: "source-parity-release-readiness",
      objective: "Restore source parity before release-readiness or production claims.",
      owner: "Execution + Security",
      lifecycle: "blocked",
      dependencies: ["Clean agent/site/backend/mobile worktrees", "Cross-repo verification"],
      blockers: ["Uncommitted changes in all four repos", "mobile is ahead 14 commits"],
      qualification: "Quality report is static; verification not run.",
      integrationReadiness: "Not release ready.",
      recentMovement: "Quality report marked source parity and production parity blocked.",
      sourceKind: "real",
    },
    {
      id: "historian-runtime-interface-v1",
      objective: "Expose bounded read-only Historian packet inspection to Mission Control.",
      owner: "Historian",
      lifecycle: "qualified",
      dependencies: ["Historian runtime handler", "packet schema", "capability registry"],
      blockers: [],
      qualification: "Recorded update says historian runtime tests passed.",
      integrationReadiness: "Ready as optional context source; canonical mutation still prohibited.",
      recentMovement: "Implemented on 2026-08-06T19:20:00Z.",
      sourceKind: "real",
    },
    {
      id: "web-monitoring-rss-reconciliation",
      objective: "Reconcile web monitoring RSS promotion into canon without expanding runtime authority.",
      owner: "Perception + Architecture Steward",
      lifecycle: "active",
      dependencies: ["Canon decision ledger", "ExternalSignal/WebLead interfaces"],
      blockers: ["Canonical documentation proposal remains pending."],
      qualification: "Architecture decision accepted into canon decision ledger.",
      integrationReadiness: "Architecture-impact evidence is available; docs update remains follow-up.",
      recentMovement: "Canon decision recorded at 2026-08-06T17:13:42Z.",
      sourceKind: "real",
    },
    {
      id: "second-proof-backed-domain",
      objective: "Advance the second proof-backed domain without overclaiming domain intelligence.",
      owner: "Domain Intelligence + Evaluation",
      lifecycle: "blocked",
      dependencies: ["Backend implementation", "scenario evidence", "evaluation review"],
      blockers: ["Legacy finding 020 is open and approval-required."],
      qualification: "Evidence artifacts exist but promotion is not complete.",
      integrationReadiness: "Awaiting approved implementation path.",
      recentMovement: "Supervisor report kept the old maintenance command as approval-required.",
      sourceKind: "real",
    },
  ],
  activity: [
    {
      id: "activity-supervisor-20260806-204921",
      occurredAt: "2026-08-06T20:49:21.646Z",
      title: "Supervisor report completed",
      summary:
        "Delta reported capability-first next step, clean architecture ownership boundary, role runtime availability, and stop conditions. No implementation or production action occurred.",
      actor: "Supervisor",
      affected: ["Mission Control", "Execution", "Evaluation"],
      severity: "notice",
      reviewId: "review-source-parity-block",
      sourceKind: "real",
    },
    {
      id: "activity-quality-20260806-204920",
      occurredAt: "2026-08-06T20:49:20.766Z",
      title: "Release readiness blocked",
      summary:
        "Production quality report marked source parity blocked because agent, site, backend, and mobile worktrees have uncommitted changes.",
      actor: "Verifier",
      affected: ["Execution", "Security"],
      severity: "blocked",
      reviewId: "review-source-parity-block",
      sourceKind: "real",
    },
    {
      id: "activity-architecture-20260806-204920",
      occurredAt: "2026-08-06T20:49:20.687Z",
      title: "Architecture drift check passed",
      summary: "Architecture drift scan covered 37 files with 0 warnings and 0 blocks.",
      actor: "Architecture Steward",
      affected: ["Architecture Steward"],
      severity: "good",
      sourceKind: "real",
    },
    {
      id: "activity-governance-20260806",
      occurredAt: "2026-08-06T20:49:20.000Z",
      title: "Governance report confirmed deny-by-default posture",
      summary:
        "Policy version 2026-08-06.v9 blocks model self-authorization, agent policy self-promotion, and hard-denied effects including deploy, push, Supabase mutation, notifications, and secret reads.",
      actor: "Security",
      affected: ["Security", "Execution"],
      severity: "good",
      sourceKind: "real",
    },
    {
      id: "activity-historian-20260806-192000",
      occurredAt: "2026-08-06T19:20:00.000Z",
      title: "Historian runtime interface implemented",
      summary:
        "Read-only packet inspection was implemented with provenance and trust visibility while keeping canon, registry, memory, provider, and specialist execution mutations prohibited.",
      actor: "Historian",
      affected: ["Historian", "Mission Control"],
      severity: "good",
      reviewId: "review-historian-interface",
      sourceKind: "real",
    },
    {
      id: "activity-canon-20260806-171342",
      occurredAt: "2026-08-06T17:13:42.378Z",
      title: "Architecture-impact packet accepted into canon decision ledger",
      summary:
        "Web monitoring RSS promotion reconciliation was accepted as a decision record with read-only boundary preserved.",
      actor: "Architecture Steward",
      affected: ["Perception", "Architecture Steward"],
      severity: "notice",
      sourceKind: "real",
    },
  ],
  reviews: [
    {
      id: "review-source-parity-block",
      event: "Production quality report found the release candidate is not source-ready.",
      status: "Owner decision required",
      primaryOwner: "Execution + Security",
      recommendation:
        "Hold release-readiness claims until dirty worktrees are reconciled, parked, or moved into explicit reviewed worktrees.",
      routeOrHandoff:
        "Recommended route only. No owner was notified and no handoff was started.",
      escalation: "Owner decision required because dirty work may be active, unrelated, or partially overlapping.",
      uncertainty: [
        "HQ can see that worktrees are dirty, but not whether each change is intentional active work.",
        "Core Event Bus has not supplied canonical initiative ownership for every changed file.",
      ],
      stoppingReason: "Stopped before verification, release, merge, push, deploy, or cleanup.",
      cost: "Deterministic local reports only; no provider cost recorded.",
      evidence: [
        {
          label: "Production quality report",
          contribution: "Source parity blocked in agent, site, backend, and mobile.",
          trust: "Deterministic local report",
          sourceKind: "real",
        },
        {
          label: "Governance policy",
          contribution: "Merge, push, deploy, production mutation, and destructive cleanup are hard-denied.",
          trust: "Canonical local policy",
          sourceKind: "real",
        },
      ],
      provenance: [
        "agent:quality report 2026-08-06T20:49:20Z",
        "agent:governance report policy version 2026-08-06.v9",
        "Mission Control owner-review presentation contract",
      ],
      supportedControls: ["Accept review", "Reject review", "Ask why", "Review later", "Mark resolved"],
      sourceKind: "fixture",
    },
    {
      id: "review-historian-interface",
      event: "Historian packet inspection became available as a bounded runtime context source.",
      status: "Review complete",
      primaryOwner: "Mission Control",
      recommendation:
        "Connect Mission Control to consume historian packet inspection as optional context after Core confirms event lifecycle fields.",
      routeOrHandoff:
        "Recommended route only. No specialist was started and no canon update was performed by HQ.",
      escalation: "Routine.",
      uncertainty: [
        "Core still needs to confirm persistent event identity, integrity, and activity projection fields.",
      ],
      stoppingReason: "Stopped after recording implementation evidence and next safe action.",
      cost: "No provider call performed in recorded update.",
      evidence: [
        {
          label: "Historian runtime update",
          contribution: "States exposed are available, incomplete, and unavailable with trust/provenance visible.",
          trust: "Local update artifact",
          sourceKind: "real",
        },
        {
          label: "Verification summary",
          contribution: "Recorded historian runtime tests and capability flow as passed.",
          trust: "Local update artifact",
          sourceKind: "real",
        },
      ],
      provenance: [
        "agent/updates/2026-08-06T19-20-00Z-historian-runtime-interface-v1.json",
        "config/capabilities.json capability agent.historian.packet.inspect",
      ],
      supportedControls: ["Accept review", "Ask why", "Mark resolved"],
      sourceKind: "fixture",
    },
  ],
  operatorBoundary: {
    normalHq: [
      "Executive brief",
      "organization and agent state",
      "initiative portfolio",
      "meaningful Activity",
      "owner reviews with evidence summaries",
      "local runtime reachability",
      "Ask Delta read-only interaction",
    ],
    operatorMode: [
      "raw service logs",
      "service command previews",
      "diagnostic refs",
      "contract mapping gaps",
      "low-level runtime state",
      "tool and provider usage details when Core publishes them",
    ],
  },
  currentRealDataIntegrations: [
    {
      label: "Agent role registry",
      kind: "real",
      path: "delta-agent/config/agent-roles.json",
      detail: "Supplies available roles, authority levels, providers, and fallback behavior.",
    },
    {
      label: "Capability registry",
      kind: "real",
      path: "delta-agent/config/capabilities.json",
      detail: "Supplies local capabilities, approval requirements, execution mode, and verification hints.",
    },
    {
      label: "Governance policy",
      kind: "real",
      path: "delta-agent/config/governance-policy.json",
      detail: "Supplies deny-by-default posture, hard denials, risk classes, and approval gates.",
    },
    {
      label: "Architecture drift report",
      kind: "real",
      detail: "Latest read-only report shows status ok with 0 warnings and 0 blocks.",
    },
    {
      label: "Production quality report",
      kind: "real",
      detail: "Latest read-only report blocks source parity and production parity because worktrees are dirty.",
    },
    {
      label: "Historian runtime update",
      kind: "real",
      path: "delta-agent/agent/updates/2026-08-06T19-20-00Z-historian-runtime-interface-v1.json",
      detail: "Supplies implemented read-only Historian interface, safety boundaries, and next safe action.",
    },
    {
      label: "Historian milestone projection",
      kind: "real",
      path: "delta-agent/src/historian/milestones.mjs",
      detail: "Supplies read-only inspectHistorianMilestones and buildEvolutionTimeline projections for HQ Evolution.",
    },
    {
      label: "Organizational Observability projection",
      kind: "real",
      path: "delta-agent/src/observability/aggregate.mjs",
      detail: "Supplies trust-labeled read-only metrics for HQ Analytics, Brief facts, and department pages.",
    },
    {
      label: "Mission Control owner-review contract",
      kind: "real",
      path: "delta-agent/docs/DELTA_MISSION_CONTROL_OWNER_REVIEW_EXPERIENCE.md",
      detail: "Defines advisory-only review semantics, controls, evidence, provenance, and Operator Mode boundary.",
    },
    {
      label: "Shared HQ renderer",
      kind: "real",
      path: "delta-site/src/components/DeltaHQ.tsx",
      detail: "Supplies the browser-first HQ experience that Delta.app can reuse with native runtime capabilities later.",
    },
  ],
  mockedOrAwaitingCoreFields: [
    {
      label: "Event Bus terminal events",
      kind: "awaiting_core",
      detail: "Canonical event IDs, status enum, timestamps, integrity, actor, and affected object refs.",
    },
    {
      label: "Agent Lifecycle Manager snapshots",
      kind: "awaiting_core",
      detail: "Live lifecycle state, sleep/wake status, current run, budget, and active blocker feed.",
    },
    {
      label: "Mission Control persistent review records",
      kind: "awaiting_core",
      detail: "Activity reference, Recommendation reference, owner disposition, correction, deferment, and resolution writes.",
    },
    {
      label: "Runtime/API economics",
      kind: "awaiting_core",
      detail: "Aggregate cost, pricing basis, token/tool usage, and inclusion rules.",
    },
    {
      label: "Milestone-to-analytics correlations",
      kind: "awaiting_core",
      detail: "Future Observability projections may annotate trends with Historian milestones, but HQ does not infer before/after causality.",
    },
    {
      label: "Initiative dependency graph",
      kind: "fixture",
      detail: "First pass projects dependencies from existing artifacts instead of claiming canonical portfolio state.",
    },
  ],
  eventBusIntegrationPoints: [
    "event.id, version, type, occurred_at, received_at, completed_at",
    "event.actor, source_system, trust_classification, integrity_state",
    "agent.id, lifecycle, active_run_id, authority_class, wake_conditions",
    "initiative.id, owner, objective, lifecycle, dependency_refs, blocker_refs",
    "mission_control.terminal_status, stop_reason, escalation, route_proposal, handoff_proposal",
    "activity_ref, recommendation_ref, optional action_ref, owner_review_state",
    "evidence_refs with availability, freshness, source authority, and relevance",
    "notification_decision and approval_requirement as structured fields, never inferred from silence",
    "model_usage_summary, tool_usage_summary, estimated_cost, estimate_basis",
    "observability_refs for canonical department, trend, and dashboard rollups",
    "operator_diagnostic_ref for authorized raw diagnostics",
  ],
  webIntegrationPlan: [
    "Keep /hq as the primary first-pass owner operating surface in the normal website runtime.",
    "Use the shared DeltaHqViewModel and adapter labels for web and future desktop delivery.",
    "Protect /hq as an owner web app route instead of hiding it as a local-only technical cockpit.",
    "Render browser-safe runtime status when the Electron bridge is absent.",
    "Keep Ask Delta read-only and fail-closed when the conversation backend is unavailable.",
    "Expose Analytics, department dashboards, and executive Brief facts from the read-only Observability projection where available.",
    "Keep fixture-only future analytics panels visibly labeled and separate from projection-backed metrics.",
    "Keep /os and Operator diagnostics separate from normal HQ navigation.",
  ],
  desktopIntegrationPlan: [
    "Let Electron load the same /hq route later while keeping /os as a separate local console.",
    "Use a persistent BrowserWindow titled Delta HQ with macOS hidden-inset title bar chrome.",
    "Keep contextIsolation, sandbox, nodeIntegration disabled, permission denials, and origin-restricted navigation.",
    "Expose only named IPC methods for copy, open local URL, reload, service status, service start/stop, logs, and config.",
    "Keep development service launching allowlisted to backend and Next.js only; packaged mode remains read-only.",
    "Let the renderer show local runtime connectivity from the desktop bridge and use read-only conversation API calls.",
    "Keep Operator Mode as an explicit in-app destination for service logs and contract mapping diagnostics.",
  ],
  deferredMacCapabilities: [
    "Signed and notarized Delta.app packaging",
    "Bundled offline renderer assets and packaged backend/runtime distribution",
    "Launch at login",
    "Background daemon or menu bar agent",
    "Desktop notifications",
    "Global shortcuts",
    "Microphone, push-to-talk, TTS, wake word, and always-on listening",
    "Broad filesystem permissions or arbitrary command runner",
    "Auto-update, crash reporting, and production release publishing",
    "Native Swift/AppKit rewrite",
  ],
};

export function getDeltaHqViewModel(): DeltaHqViewModel {
  return DELTA_HQ_VIEW_MODEL;
}
