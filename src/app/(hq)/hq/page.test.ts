import { existsSync, readFileSync } from "fs";
import path from "path";
import type { DeltaHqObservabilityMetric, DeltaHqObservabilityTimeSeriesPoint } from "@/lib/deltaHqViewModel";
import {
  AGENT_ECONOMICS_METRIC_IDS,
  buildAgentEconomicsProfile,
  canonicalEconomicsMetricValue,
  economicsCostTrustLabel,
  economicsPointsForAgent,
  formatEconomicsDatumValue,
  isCurrentOperationEconomics,
} from "@/lib/deltaHqAgentEconomics";
import { getDeltaHqViewModel as getBaseDeltaHqViewModel } from "@/lib/deltaHqViewModel";
import {
  getDeltaHqViewModel,
  getHistorianEvolutionProjection,
  getIssuesProjection,
  getOrganizationalObservabilityProjection,
} from "@/lib/deltaHqServerViewModel";
import {
  canRenderAsCurrentOperationalMeasurement,
  formatObservabilityMetricValue,
  metricOperationalStateLabel,
} from "@/lib/deltaHqObservability";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const siblingAgentRoot = process.env.DELTA_AGENT_REPO_ROOT
  ?? path.resolve(process.cwd(), "..", "delta-agent");
const hasSiblingAgentContracts = [
  "src/historian/milestones.mjs",
  "src/observability/aggregate.mjs",
  "config/organizational-metrics.json",
].every((relativePath) => existsSync(path.join(siblingAgentRoot, relativePath)));
const itWithSiblingAgent = hasSiblingAgentContracts ? it : it.skip;

function observabilityMetric(overrides: Partial<DeltaHqObservabilityMetric> = {}): DeltaHqObservabilityMetric {
  return {
    metric_id: "event_bus.wake_success_rate",
    metric_version: 1,
    registry_version: "2026-08-06.phase1",
    aggregation_version: "2026-08-06.security-hardening.v1",
    title: "Wake success rate",
    owner: "event_bus",
    scope: "event_bus",
    value: 1,
    unit: "ratio",
    trust_state: "trusted",
    cost_trust_state: null,
    data_quality_state: "complete",
    missing_reason: null,
    aggregation_window: {
      from: null,
      to: "2026-08-06T12:00:00.000Z",
      mode: "current",
      qualification_epoch: null,
    },
    measurement_time_range: {
      from: "2026-08-06T12:00:00.000Z",
      to: "2026-08-06T12:00:00.000Z",
    },
    source_freshness: {
      state: "current",
      latest_accepted_source_time: "2026-08-06T12:00:00.000Z",
      max_age_ms: 1000,
      sla_ms: 86400000,
    },
    latest_accepted_source_time: "2026-08-06T12:00:00.000Z",
    current_state_applicability: "current_only",
    qualification_epochs: [],
    current_qualification_epoch: null,
    source_event_count: 1,
    producer_identities: ["delta.event_bus.lifecycle"],
    dimensioned_points: [],
    ...overrides,
  };
}

function economicsPoint(overrides: Partial<DeltaHqObservabilityTimeSeriesPoint> = {}): DeltaHqObservabilityTimeSeriesPoint {
  return {
    timestamp: "2026-08-06T12:00:00.000Z",
    metric_id: AGENT_ECONOMICS_METRIC_IDS.cumulativeCost,
    metric_version: 1,
    registry_version: "2026-08-07.agent-economics.v1",
    aggregation_version: "2026-08-06.security-hardening.v1",
    value: 0.0025,
    unit: "usd",
    trust_state: "trusted",
    cost_trust_state: "provider_confirmed",
    data_quality_state: "complete",
    dimension_values: {
      agent_id: "mission_control",
      spend_class: "qualification",
      evaluation_stage: "full_qualification",
      evaluation_attempt_id: "attempt-1",
      qualification_attempt: "qualification-attempt-1",
    },
    aggregation_window: {
      from: null,
      to: "2026-08-06T12:00:00.000Z",
      mode: "current",
      qualification_epoch: null,
    },
    measurement_time_range: {
      from: "2026-08-06T12:00:00.000Z",
      to: "2026-08-06T12:00:00.000Z",
    },
    source_freshness_state: "current",
    latest_accepted_source_time: "2026-08-06T12:00:00.000Z",
    source_event_count: 1,
    qualification_epochs: [],
    current_state_applicability: "current_only",
    ...overrides,
  };
}

describe("Delta HQ web route", () => {
  it("mounts the shared HQ renderer without replacing the OS Console", () => {
    const pageSource = readSource("src/app/(hq)/hq/page.tsx");
    const componentSource = readSource("src/components/DeltaHQ.tsx");
    const serverViewModelSource = readSource("src/lib/deltaHqServerViewModel.ts");
    const middlewareSource = readSource("middleware.ts");

    expect(pageSource).toContain("Delta HQ");
    expect(pageSource).toContain("requireObservatoryOwner()");
    expect(pageSource).toContain("<Observatory initialReport={await readObservatoryReport()} />");
    expect(pageSource).not.toContain("getDeltaHqViewModel");
    expect(pageSource).toContain('dynamic = "force-dynamic"');
    expect(componentSource).toContain("Owner HQ");
    expect(componentSource).toContain("Executive brief");
    expect(componentSource).toContain("Organization");
    expect(componentSource).toContain("Initiatives");
    expect(componentSource).toContain("Issues");
    expect(componentSource).toContain("Evolution");
    expect(componentSource).toContain("Activity");
    expect(componentSource).toContain("Owner review");
    expect(componentSource).toContain("Analytics");
    expect(componentSource).toContain("Agent Economics");
    expect(componentSource).toContain("Qualification funnel");
    expect(componentSource).toContain("No avoided spend inferred");
    expect(componentSource).toContain("router.refresh()");
    expect(componentSource).toContain("Refreshing...");
    expect(componentSource).toContain("No newer data");
    expect(componentSource).toContain("Refresh failed");
    expect(componentSource).toContain("Projection data path");
    expect(componentSource).toContain("No accepted current telemetry");
    expect(componentSource).toContain("Functional controls audit");
    expect(componentSource).toContain("HQ web shell");
    expect(componentSource).toContain("Observability projection");
    expect(componentSource).toContain("Ask Delta");
    expect(componentSource).toContain("Ask Delta");
    expect(componentSource).toContain("Operator Mode");
    expect(componentSource).toContain("Advisory only");
    expect(componentSource).toContain("reloadHq");
    expect(componentSource).toContain("disabled={!serviceManagerEnabled}");
    expect(serverViewModelSource).toContain("inspectHistorianMilestones");
    expect(serverViewModelSource).toContain("buildEvolutionTimeline");
    expect(serverViewModelSource).toContain("getIssuesProjection");
    expect(serverViewModelSource).toContain("aggregateFromStore");
    expect(serverViewModelSource).toContain("inspectRawTelemetryStore");
    expect(serverViewModelSource).toContain("projectionIsOlderThanRaw");
    expect(middlewareSource).toContain("OWNER_HQ_ROUTE = '/hq'");
    expect(middlewareSource).toContain("PROTECTED_ROUTES = [");
    expect(middlewareSource).toContain("'/hq/:path*'");
    expect(middlewareSource).toContain("'/os/:path*'");
  });

  it("keeps canonical state seams explicit in the HQ view model", () => {
    const model = getBaseDeltaHqViewModel();

    expect(model.routeDecision.primarySurface).toContain("/hq");
    expect(model.routeDecision.sharedRendererMount).toContain("web now and Delta.app later");
    expect(model.routeDecision.desktopDeliveryPath).toContain("Delta.app");
    expect(model.routeDecision.separatedSurface).toContain("/os remains");
    expect(model.organization.map(agent => agent.name)).toEqual(
      expect.arrayContaining([
        "Core Intelligence",
        "Mission Control",
        "Historian",
        "Architecture Steward",
        "Integration Steward",
        "Security",
        "Evaluation",
        "Product",
        "Experience",
        "Execution",
        "Perception",
        "Domain Intelligence Systems",
      ]),
    );
    expect(model.currentRealDataIntegrations.some(source => source.kind === "real")).toBe(true);
    expect(model.mockedOrAwaitingCoreFields.some(source => source.kind === "awaiting_core")).toBe(true);
    expect(model.issues.authority_limits).toEqual(
      expect.arrayContaining([
        "HQ does not create a canonical issue registry.",
        "HQ does not execute remediation or Event Bus changes.",
      ]),
    );
    expect(model.issues.read_only_boundary).toMatchObject({
      canonical_issue_registry_created: false,
      lifecycle_authority_created: false,
      mutation_performed: false,
      remediation_performed: false,
      event_bus_changed: false,
    });
    expect(model.eventBusIntegrationPoints).toEqual(
      expect.arrayContaining([
        "event.id, version, type, occurred_at, received_at, completed_at",
        "observability_refs for canonical department, trend, and dashboard rollups",
        "operator_diagnostic_ref for authorized raw diagnostics",
      ]),
    );
    expect(model.webIntegrationPlan).toEqual(
      expect.arrayContaining([
        "Keep /hq as the primary first-pass owner operating surface in the normal website runtime.",
        "Protect /hq as an owner web app route instead of hiding it as a local-only technical cockpit.",
      ]),
    );
    expect(model.deferredMacCapabilities).toEqual(
      expect.arrayContaining([
        "Launch at login",
        "Background daemon or menu bar agent",
        "Desktop notifications",
        "Global shortcuts",
        "Native Swift/AppKit rewrite",
      ]),
    );
  });

  itWithSiblingAgent("loads the Historian-backed Evolution projection without creating a second history store", async () => {
    const model = await getDeltaHqViewModel();
    const evolution = model.evolution;

    expect(evolution.fixtureFallback).toBe(false);
    expect(evolution.source_of_truth).toContain("agent/historian/milestones");
    expect(evolution.entries.length).toBeGreaterThanOrEqual(5);
    expect(evolution.entries[0].milestone_id).toBe("local-operator-runtime-foundation-v1");
    expect(evolution.entries[0].lineage_tracks).toEqual(expect.arrayContaining(["engineering_agentic"]));
    expect(evolution.entries.map((entry) => entry.milestone)).toEqual(
      expect.arrayContaining([
        "Authenticated local operator runtime foundation established",
        "Mission Control gained bounded conversational orchestration",
        "Mission Control gained bounded verifier-driven repair",
        "Historian became a bounded Mission Control dependency",
        "Failure Triage Second Qualified Specialist",
      ]),
    );
    expect(evolution.lineage_tracks.find((track) => track.id === "engineering_agentic")?.milestone_ids.length).toBeGreaterThan(0);
    expect(["evidenced", "not_evidenced_in_current_projection"]).toContain(evolution.convergence.status);
    expect(evolution.read_only_boundary.canonical_mutation_performed).toBe(false);
  });

  itWithSiblingAgent("preserves Historian evidence confidence and claim classifications for milestone detail", async () => {
    const evolution = await getHistorianEvolutionProjection();
    const failureTriage = evolution.entries.find(
      (entry) => entry.milestone_id === "failure-triage-second-qualified-specialist-2026-08-07",
    );

    expect(failureTriage?.evidence_confidence).toBe("high");
    expect(failureTriage?.claim_summary.directly_evidenced).toEqual(
      expect.arrayContaining([
        "Commit c97133590603f12d030d9793dfe6163faec7304d promoted Failure Triage from candidate to qualified handoff-only advisory/read-only use on August 7, 2026.",
      ]),
    );
    expect(failureTriage?.claim_summary.unresolved.length).toBeGreaterThan(0);
    expect(failureTriage?.evidence_mode).toBe("Contains unresolved evidence");
    expect(failureTriage?.directly_evidenced).toBe(false);
  });

  it("prepares Organizational Observability without inventing authority or metric definitions", () => {
    const model = getBaseDeltaHqViewModel();

    expect(model.observability.projection.fixtureFallback).toBe(true);
    expect(model.observability.projection.promotionScope).toBe("trust-labeled read-only display");
    expect(model.observability.projection.authorityLimitations).toEqual(
      expect.arrayContaining([
        "Not an executive health authority.",
        "Not a Mission Control reasoning input.",
        "Not an anomaly-triggered Event Bus input.",
      ]),
    );
    expect(model.observability.briefTrends).toHaveLength(3);
    expect(model.observability.departments.length).toBeGreaterThan(0);
    expect(model.observability.dedicatedSurfaces.map(surface => surface.label)).toEqual(
      expect.arrayContaining(["Executive trends", "Department performance", "Analytics deep dive"]),
    );
    expect(model.observability.briefTrends.every(trend => trend.canonicalMetricRef === null)).toBe(true);
    expect(model.observability.departments.every(department =>
      department.performancePanels.every(panel => panel.canonicalMetricRef === null),
    )).toBe(true);
    expect(model.observability.guardedSemantics).toEqual(
      expect.arrayContaining([
        "HQ must render unavailable when a metric definition is absent.",
        "HQ must not derive performance scores, SLAs, costs, or productivity metrics from logs.",
      ]),
    );
    expect(model.currentRealDataIntegrations.map(source => source.label)).toContain("Organizational Observability projection");
    expect(model.mockedOrAwaitingCoreFields.map(source => source.label)).not.toContain("Organizational Observability metrics");
  });

  itWithSiblingAgent("loads the Organizational Observability projection as read-only HQ display evidence", async () => {
    const projection = await getOrganizationalObservabilityProjection();

    expect(projection.fixtureFallback).toBe(false);
    expect(projection.projection_type).toBe("organizational_observability");
    expect(projection.promotionScope).toBe("trust-labeled read-only display");
    expect(projection.guarantees.composite_health_score).toBe(false);
    expect(projection.guarantees.runtime_authority_added).toBe(false);
    expect(projection.metrics.map(metric => metric.metric_id)).toEqual(
      expect.arrayContaining([
        "event_bus.events_received",
        "event_bus.dispatches",
        "event_bus.wake_success_rate",
        "event_bus.queue_depth",
        "event_bus.dispatch_latency_ms",
        "mission_control.event_task_success_rate",
        "mission_control.cost_per_successful_event",
        "organization.autonomy_ratio",
      ]),
    );
    expect(JSON.stringify(projection)).not.toContain("source_event_refs");
  });

  itWithSiblingAgent("exposes live Organizational Observability data-path diagnostics instead of silently falling back", async () => {
    const projection = await getOrganizationalObservabilityProjection();
    const diagnostics = projection.diagnostics;

    expect(diagnostics.repo_root).toMatch(/delta-agent|agent-main-promotion|agent-canonical|agent-convergence/);
    expect(diagnostics.repo_root_source).toBeTruthy();
    expect(diagnostics.store_root).toContain("agent/measurements/organizational-observability");
    expect(diagnostics.projection_path).toContain("organizational-observability.json");
    expect(["stored_projection", "dynamic_aggregation"]).toContain(diagnostics.projection_source);
    expect(typeof diagnostics.aggregation_ran_dynamically).toBe("boolean");
    expect(diagnostics.projection_generated_at).toBe(projection.generated_at);
    expect(diagnostics.newest_accepted_event_time).toBe(projection.latest_accepted_source_time);
    expect(diagnostics.accepted_source_event_count).toBe(projection.event_acceptance_summary.accepted_source_event_count);
    expect(diagnostics.rejected_source_event_count).toBe(projection.event_acceptance_summary.rejected_source_event_count);
    if (diagnostics.accepted_source_event_count === 0) {
      expect(diagnostics.empty_state_reason).toBeTruthy();
      expect(diagnostics.next_event_owner).toBeTruthy();
    }
  });

  it("renders Organizational Observability trust states without deriving replacement health", () => {
    const trustedCurrent = observabilityMetric();
    expect(canRenderAsCurrentOperationalMeasurement(trustedCurrent)).toBe(true);
    expect(metricOperationalStateLabel(trustedCurrent)).toBe("Measured");
    expect(formatObservabilityMetricValue(trustedCurrent)).toBe("1 ratio");

    const missing = observabilityMetric({
      value: null,
      trust_state: "missing",
      data_quality_state: "missing",
      missing_reason: "no_source_events",
      source_event_count: 0,
      source_freshness: {
        state: "missing",
        latest_accepted_source_time: null,
        max_age_ms: null,
        sla_ms: 86400000,
      },
      latest_accepted_source_time: null,
    });
    expect(canRenderAsCurrentOperationalMeasurement(missing)).toBe(false);
    expect(metricOperationalStateLabel(missing)).toBe("Unavailable");
    expect(formatObservabilityMetricValue(missing)).toBe("Unavailable");

    const stale = observabilityMetric({
      trust_state: "stale",
      data_quality_state: "stale",
      missing_reason: "freshness_sla_exceeded",
      source_freshness: {
        state: "stale",
        latest_accepted_source_time: "2026-08-04T12:00:00.000Z",
        max_age_ms: 172800000,
        sla_ms: 86400000,
      },
    });
    expect(canRenderAsCurrentOperationalMeasurement(stale)).toBe(false);
    expect(metricOperationalStateLabel(stale)).toBe("Stale");

    const fixture = observabilityMetric({
      trust_state: "fixture",
      data_quality_state: "fixture",
      current_state_applicability: "historical",
    });
    expect(canRenderAsCurrentOperationalMeasurement(fixture)).toBe(false);
    expect(metricOperationalStateLabel(fixture)).toBe("Fixture evidence");

    const unpriced = observabilityMetric({
      metric_id: "mission_control.cost_per_successful_event",
      title: "Cost per successful event",
      scope: "mission_control",
      owner: "mission_control",
      value: null,
      unit: "usd",
      trust_state: "unpriced",
      data_quality_state: "unpriced",
      missing_reason: "cost_not_priced",
    });
    expect(formatObservabilityMetricValue(unpriced)).toBe("Unpriced");
    expect(formatObservabilityMetricValue(unpriced)).not.toBe("$0");

    const qualificationEpoch = observabilityMetric({
      current_state_applicability: "qualification_epoch",
      qualification_epochs: ["mission-control-live-qualification-2026-08-06"],
    });
    expect(canRenderAsCurrentOperationalMeasurement(qualificationEpoch)).toBe(false);
    expect(metricOperationalStateLabel(qualificationEpoch)).toBe("Qualification epoch");

    const conflicted = observabilityMetric({ trust_state: "conflicted", data_quality_state: "conflicted" });
    const untrusted = observabilityMetric({ trust_state: "untrusted", data_quality_state: "untrusted" });
    expect(metricOperationalStateLabel(conflicted)).toBe("Conflicted");
    expect(metricOperationalStateLabel(untrusted)).toBe("Untrusted");

    const unavailableTrusted = observabilityMetric({ value: null });
    expect(canRenderAsCurrentOperationalMeasurement(unavailableTrusted)).toBe(false);
    expect(formatObservabilityMetricValue(unavailableTrusted)).toBe("Unavailable");
  });

  it("builds the read-only Issues projection without creating lifecycle authority", async () => {
    const projection = await getIssuesProjection();

    expect(projection.status).toMatch(/available|partial/);
    expect(projection.issues.length).toBeGreaterThan(0);
    expect(projection.read_only_boundary).toMatchObject({
      canonical_issue_registry_created: false,
      lifecycle_authority_created: false,
      mutation_performed: false,
      remediation_performed: false,
      event_bus_changed: false,
      automatic_dedupe_claimed_as_truth: false,
    });
    expect(projection.authority_limits.join(" ")).toContain("does not create a canonical issue registry");
    expect(projection.authority_limits.join(" ")).toContain("does not expose remediation actions");
  });

  it("excludes resolved issues from the default Issues set and surfaces blockers first", async () => {
    const projection = await getIssuesProjection();
    const issuesById = new Map(projection.issues.map((issue) => [issue.id, issue]));
    const defaultIssues = projection.default_issue_ids.map((issueId) => issuesById.get(issueId));

    expect(defaultIssues.every((issue) => issue?.state !== "resolved")).toBe(true);
    expect(defaultIssues.every((issue) => issue?.state !== "accepted-risk")).toBe(true);
    expect(defaultIssues[0]?.impact).toBe("blocker");
    expect(defaultIssues[0]?.state).toBe("blocked");
  });

  it("preserves evidence refs and ignores stale worktree-only issue sources", async () => {
    const projection = await getIssuesProjection();
    const credentialRotation = projection.issues.find((issue) => issue.id === "site-finding-001");

    expect(credentialRotation?.evidence_refs).toEqual(
      expect.arrayContaining([
        "/Users/egeng/delta-backend/docs/SECURITY_ROTATION_CHECKLIST.md",
        "/Users/egeng/delta-backend/scripts/secret_scan.py",
      ]),
    );
    expect(JSON.stringify(projection.issues)).not.toContain(`${path.sep}delta-worktrees${path.sep}`);
  });

  it("keeps missing Observability as an evidence gap rather than inferred health", async () => {
    const baseProjection = getBaseDeltaHqViewModel().observability.projection;
    const projection = await getIssuesProjection(baseProjection);
    const observabilityIssue = projection.issues.find((issue) => issue.id === "observability-projection-unavailable");

    expect(observabilityIssue?.title).toBe("Observability projection unavailable");
    expect(observabilityIssue?.concise_diagnosis).toContain("data availability issue");
    expect(observabilityIssue?.concise_diagnosis).toContain("not as inferred operational health");
    expect(observabilityIssue?.source_state).toBe("unavailable");
  });

  itWithSiblingAgent("preserves source gaps where canonical structured issue truth is missing", async () => {
    const projection = await getIssuesProjection();

    expect(projection.source_gaps.map((gap) => gap.source_system)).toEqual(
      expect.arrayContaining([
        "failure_triage",
        "architecture_review",
        "evaluation",
        "security",
        "governance",
      ]),
    );
    expect(projection.source_gaps.map((gap) => gap.reason).join(" ")).toContain("did not convert nested evaluation scenarios into current issues");
  });

  it("fails visibly to bounded fallbacks when the external agent contracts are unavailable", async () => {
    const previousRoot = process.env.DELTA_AGENT_REPO_ROOT;
    process.env.DELTA_AGENT_REPO_ROOT = path.join(process.cwd(), ".missing-delta-agent");

    try {
      const evolution = await getHistorianEvolutionProjection();
      const observability = await getOrganizationalObservabilityProjection();

      expect(evolution.fixtureFallback).toBe(true);
      expect(evolution.unavailableReason).toContain("unavailable");
      expect(observability.fixtureFallback).toBe(true);
      expect(observability.diagnostics.projection_source).toBe("unavailable");
      expect(observability.authorityLimitations).toContain("Not a Mission Control reasoning input.");
    } finally {
      if (previousRoot === undefined) delete process.env.DELTA_AGENT_REPO_ROOT;
      else process.env.DELTA_AGENT_REPO_ROOT = previousRoot;
    }
  });

  it("renders Agent Economics cost trust without turning unpriced or missing values into spend", () => {
    const unpriced = observabilityMetric({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.cumulativeCost,
      title: "Agent cumulative cost",
      owner: "core",
      scope: "agent_economics",
      value: null,
      unit: "usd",
      trust_state: "unpriced",
      cost_trust_state: "unpriced",
      data_quality_state: "unpriced",
      missing_reason: "cost_not_priced",
    });
    const confirmed = observabilityMetric({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.cumulativeCost,
      title: "Agent cumulative cost",
      owner: "core",
      scope: "agent_economics",
      value: 0.0025,
      unit: "usd",
      trust_state: "trusted",
      cost_trust_state: "provider_confirmed",
    });
    const estimate = observabilityMetric({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.cumulativeCost,
      title: "Agent cumulative cost",
      owner: "core",
      scope: "agent_economics",
      value: 0.003,
      unit: "usd",
      trust_state: "trusted",
      cost_trust_state: "trusted_estimate",
    });

    expect(formatEconomicsDatumValue(unpriced)).toBe("Unpriced");
    expect(formatEconomicsDatumValue(unpriced)).not.toBe("$0");
    expect(economicsCostTrustLabel(confirmed.cost_trust_state)).toBe("Provider-confirmed");
    expect(economicsCostTrustLabel(estimate.cost_trust_state)).toBe("Trusted estimate");
    expect(formatEconomicsDatumValue(confirmed)).toContain("$");
    expect(formatEconomicsDatumValue(estimate)).toContain("$");
  });

  it("keeps historical qualification and development economics separate from current operation", () => {
    const historicalQualification = economicsPoint({
      current_state_applicability: "historical",
      dimension_values: {
        agent_id: "mission_control",
        spend_class: "qualification",
        evaluation_stage: "full_qualification",
      },
    });
    const currentOperation = economicsPoint({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.operatingCost,
      current_state_applicability: "current_only",
      dimension_values: {
        agent_id: "mission_control",
        spend_class: "operation",
        evaluation_stage: "operation",
      },
    });

    expect(isCurrentOperationEconomics(historicalQualification)).toBe(false);
    expect(isCurrentOperationEconomics(currentOperation)).toBe(true);
  });

  it("leaves missing agent economics unavailable and does not recalculate canonical values from dimensions", () => {
    const baseProjection = getBaseDeltaHqViewModel().observability.projection;
    const missionPoint = economicsPoint();
    const projection = {
      ...baseProjection,
      dimensioned_time_series_points: [missionPoint],
    };
    const failureTriage = buildAgentEconomicsProfile(projection, "failure_triage");
    const missingMetric = observabilityMetric({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.cumulativeCost,
      title: "Agent cumulative cost",
      owner: "core",
      scope: "agent_economics",
      value: null,
      unit: "usd",
      trust_state: "missing",
      cost_trust_state: "unpriced",
      data_quality_state: "missing",
    });

    expect(failureTriage.evidenceState).toBe("unavailable");
    expect(canonicalEconomicsMetricValue(missingMetric, [missionPoint])).toBeNull();
    expect(formatEconomicsDatumValue(missingMetric)).toBe("Unpriced");
  });

  it("filters Agent Economics dimensions without double-counting duplicate slices", () => {
    const first = economicsPoint({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.providerRequests,
      value: 1,
      unit: "count",
      cost_trust_state: null,
    });
    const duplicate = economicsPoint({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.providerRequests,
      value: 1,
      unit: "count",
      cost_trust_state: null,
    });
    const secondAttempt = economicsPoint({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.providerRequests,
      value: 1,
      unit: "count",
      cost_trust_state: null,
      dimension_values: {
        agent_id: "mission_control",
        spend_class: "qualification",
        evaluation_stage: "full_qualification",
        evaluation_attempt_id: "attempt-2",
      },
    });
    const otherAgent = economicsPoint({
      metric_id: AGENT_ECONOMICS_METRIC_IDS.providerRequests,
      value: 1,
      unit: "count",
      cost_trust_state: null,
      dimension_values: {
        agent_id: "failure_triage",
        spend_class: "qualification",
        evaluation_stage: "full_qualification",
        evaluation_attempt_id: "attempt-1",
      },
    });

    expect(economicsPointsForAgent([first, duplicate, secondAttempt, otherAgent], "mission_control")).toHaveLength(2);
  });

  it("preserves Mission Control owner-review authority limits", () => {
    const model = getBaseDeltaHqViewModel();
    const review = model.reviews.find(item => item.id === "review-source-parity-block");

    expect(review?.status).toBe("Owner decision required");
    expect(review?.routeOrHandoff).toContain("No owner was notified");
    expect(review?.stoppingReason).toContain("Stopped before verification");
    expect(review?.supportedControls).toEqual(
      expect.arrayContaining(["Accept review", "Reject review", "Ask why", "Review later", "Mark resolved"]),
    );
    expect(JSON.stringify(review)).toContain("no provider cost recorded");
  });
});
