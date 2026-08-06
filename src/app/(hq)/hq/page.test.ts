import { readFileSync } from "fs";
import path from "path";
import type { DeltaHqObservabilityMetric } from "@/lib/deltaHqViewModel";
import { getDeltaHqViewModel as getBaseDeltaHqViewModel } from "@/lib/deltaHqViewModel";
import {
  getDeltaHqViewModel,
  getHistorianEvolutionProjection,
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
    data_quality_state: "complete",
    missing_reason: null,
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
    expect(pageSource).toContain("<DeltaHQ model={await getDeltaHqViewModel()} />");
    expect(pageSource).toContain('dynamic = "force-dynamic"');
    expect(componentSource).toContain("Owner HQ");
    expect(componentSource).toContain("Executive brief");
    expect(componentSource).toContain("Organization");
    expect(componentSource).toContain("Initiatives");
    expect(componentSource).toContain("Evolution");
    expect(componentSource).toContain("Activity");
    expect(componentSource).toContain("Owner review");
    expect(componentSource).toContain("Analytics");
    expect(componentSource).toContain("Ask Delta");
    expect(componentSource).toContain("Operator Mode");
    expect(componentSource).toContain("Advisory only");
    expect(componentSource).toContain("reloadHq");
    expect(serverViewModelSource).toContain("inspectHistorianMilestones");
    expect(serverViewModelSource).toContain("buildEvolutionTimeline");
    expect(serverViewModelSource).toContain("aggregateFromStore");
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

  it("loads the Historian-backed Evolution projection without creating a second history store", async () => {
    const model = await getDeltaHqViewModel();
    const evolution = model.evolution;

    expect(evolution.fixtureFallback).toBe(false);
    expect(evolution.source_of_truth).toContain("agent/historian/milestones");
    expect(evolution.entries.length).toBeGreaterThanOrEqual(12);
    expect(evolution.entries[0]).toMatchObject({
      milestone_id: "delta-origin-2025-12-26",
      milestone: "Delta Origin",
      lineage_tracks: ["product_intelligence"],
    });
    expect(evolution.entries.map((entry) => entry.milestone)).toEqual(
      expect.arrayContaining([
        "Durable Memory Architecture",
        "Conversational Delta",
        "Behavioral OS",
        "Intelligence OS",
        "Agent Supervisor Origin",
        "Agentic OS Direction",
        "Shared LLM Agent Runtime",
        "Mission Control Live Qualification",
        "Historian Runtime Becomes Bounded Dependency",
      ]),
    );
    expect(evolution.lineage_tracks.find((track) => track.id === "product_intelligence")?.milestone_ids.length).toBeGreaterThan(0);
    expect(evolution.lineage_tracks.find((track) => track.id === "engineering_agentic")?.milestone_ids.length).toBeGreaterThan(0);
    expect(evolution.convergence.status).toBe("not_evidenced_in_current_projection");
    expect(evolution.read_only_boundary.canonical_mutation_performed).toBe(false);
  });

  it("preserves Historian evidence confidence and claim classifications for milestone detail", async () => {
    const evolution = await getHistorianEvolutionProjection();
    const origin = evolution.entries.find((entry) => entry.milestone_id === "delta-origin-2025-12-26");
    const memory = evolution.entries.find((entry) => entry.milestone_id === "delta-durable-memory-architecture-2026-01-01");

    expect(origin?.evidence_confidence).toBe("high");
    expect(origin?.claim_summary.unresolved).toEqual(
      expect.arrayContaining(["Whether an older non-recovered Delta repository existed before December 26, 2025."]),
    );
    expect(memory?.evidence_mode).toBe("Direct evidence with inferred interpretation");
    expect(memory?.evidence_references.some((reference) => reference.claim_classification === "strongly_inferred")).toBe(true);
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

  it("loads the Organizational Observability projection as read-only HQ display evidence", async () => {
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
