import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import DeltaHQ from "@/components/DeltaHQ";
import type { DeltaHqIssue, DeltaHqIssueProjection, DeltaHqViewModel } from "@/lib/deltaHqViewModel";
import { getDeltaHqViewModel as getBaseDeltaHqViewModel } from "@/lib/deltaHqViewModel";

const mockRouterRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

function cloneBaseModel(): DeltaHqViewModel {
  return JSON.parse(JSON.stringify(getBaseDeltaHqViewModel())) as DeltaHqViewModel;
}

function liveProjectionModel({
  modelGeneratedAt = "2026-08-07T18:30:00.000Z",
  projectionId = "orgobs-test-1",
  projectionGeneratedAt = "2026-08-07T18:29:00.000Z",
  latestAcceptedSourceTime = null,
  rawEventCount = 0,
  acceptedEventCount = 0,
}: {
  modelGeneratedAt?: string;
  projectionId?: string;
  projectionGeneratedAt?: string;
  latestAcceptedSourceTime?: string | null;
  rawEventCount?: number;
  acceptedEventCount?: number;
} = {}): DeltaHqViewModel {
  const model = cloneBaseModel();
  const projection = model.observability.projection;
  model.generatedAt = modelGeneratedAt;
  model.observability.projection = {
    ...projection,
    status: "available",
    projection_id: projectionId,
    generated_at: projectionGeneratedAt,
    evaluated_at: projectionGeneratedAt,
    fixtureFallback: false,
    unavailableReason: undefined,
    registry_version: "2026-08-06.phase1",
    aggregation_version: "2026-08-06.security-hardening.v1",
    latest_accepted_source_time: latestAcceptedSourceTime,
    current_state_applicability: "current_only",
    trust_summary: acceptedEventCount > 0 ? { trusted: 1 } : { missing: 39 },
    data_quality_summary: {
      ...projection.data_quality_summary,
      metric_count: 39,
      by_state: acceptedEventCount > 0 ? { complete: 1 } : { missing: 39 },
      raw_valid_event_count: rawEventCount,
      accepted_source_event_count: acceptedEventCount,
      rejected_source_event_count: 0,
      duplicate_source_event_count: 0,
      invalid_raw_event_count: 0,
    },
    event_acceptance_summary: {
      ...projection.event_acceptance_summary,
      raw_valid_event_count: rawEventCount,
      accepted_source_event_count: acceptedEventCount,
      rejected_source_event_count: 0,
      duplicate_source_event_count: 0,
      invalid_raw_event_count: 0,
      rejected_by_reason: {},
    },
    diagnostics: {
      ...projection.diagnostics,
      repo_root: "/Users/egeng/delta/delta-agent",
      repo_root_source: "workspace sibling",
      store_root: "/Users/egeng/delta/delta-agent/agent/measurements/organizational-observability",
      projection_path: "/Users/egeng/delta/delta-agent/agent/measurements/organizational-observability/projections/organizational-observability.json",
      projection_source: "dynamic_aggregation",
      aggregation_ran_dynamically: true,
      stored_projection_used: false,
      stored_projection_stale: false,
      raw_event_count: rawEventCount,
      accepted_source_event_count: acceptedEventCount,
      rejected_source_event_count: 0,
      invalid_raw_event_count: 0,
      duplicate_source_event_count: 0,
      newest_raw_event_time: latestAcceptedSourceTime,
      newest_accepted_event_time: latestAcceptedSourceTime,
      projection_generated_at: projectionGeneratedAt,
      empty_state_reason: acceptedEventCount === 0
        ? "No accepted current-state telemetry events were found in the canonical measurement store."
        : null,
      next_event_owner: acceptedEventCount === 0
        ? "Canonical Organizational Observability telemetry producer"
        : null,
      historical_only: false,
    },
  };
  return model;
}

function testIssue(overrides: Partial<DeltaHqIssue> = {}): DeltaHqIssue {
  return {
    id: "issue-blocker",
    title: "Credential rotation confirmation",
    severity: "critical",
    priority: "P0",
    state: "blocked",
    source_state: "pending-human",
    canonical_owner: "Security",
    diagnosed_by: {
      source_system: "site_finding",
      source_label: "Canonical site finding / security-review",
      source_ref: "agent/findings/001-credential-rotation-confirmation.md",
    },
    concise_diagnosis:
      "Provider-side credential rotation still requires human confirmation outside the repository.",
    evidence_refs: [
      "/Users/egeng/delta-backend/docs/SECURITY_ROTATION_CHECKLIST.md",
      "/Users/egeng/delta-backend/scripts/secret_scan.py",
    ],
    affected: {
      capabilities: ["credential-rotation-confirmation"],
      repos: ["backend"],
      domains: ["security-review"],
    },
    impact: "blocker",
    recommended_next_action:
      "Confirm provider-side rotation status without printing or committing secrets.",
    last_updated: "2026-08-07T12:00:00.000Z",
    resolution: null,
    sourceKind: "real",
    ...overrides,
  };
}

function issuesProjectionModel(): DeltaHqViewModel {
  const model = liveProjectionModel();
  const issues = [
    testIssue(),
    testIssue({
      id: "issue-observability-missing",
      title: "No accepted current Observability telemetry",
      severity: "medium",
      priority: "P2",
      state: "monitoring",
      source_state: "missing_current_measurement",
      canonical_owner: "Organizational Observability telemetry producers",
      diagnosed_by: {
        source_system: "observability",
        source_label: "Organizational Observability gaps",
        source_ref: "agent/measurements/organizational-observability/projections/organizational-observability.json",
      },
      concise_diagnosis:
        "The projection reports no accepted current-state telemetry. HQ treats this as unavailable measurement evidence and does not infer a healthy state.",
      evidence_refs: ["No accepted current-state telemetry."],
      affected: {
        capabilities: ["organizational_observability", "analytics"],
        repos: ["agent"],
        domains: ["observability"],
      },
      impact: "advisory",
      recommended_next_action:
        "Emit accepted current-state Observability events through the canonical producer path.",
    }),
    testIssue({
      id: "issue-resolved-history",
      title: "Resolved checkout cleanup",
      severity: "low",
      priority: "P3",
      state: "resolved",
      source_state: "resolved",
      resolution: "Source marked resolved.",
      impact: "advisory",
    }),
  ];
  const projection: DeltaHqIssueProjection = {
    status: "partial",
    generated_at: "2026-08-07T12:01:00.000Z",
    source_of_truth: "Read-only test projection",
    authority_limits: [
      "HQ does not create a canonical issue registry.",
      "HQ does not expose remediation actions, mutate sources, or change the Event Bus.",
    ],
    issues,
    default_issue_ids: ["issue-blocker", "issue-observability-missing"],
    history_issue_ids: ["issue-resolved-history"],
    source_counts: {
      site_finding: 2,
      observability: 1,
    },
    source_gaps: [
      {
        source_system: "failure_triage",
        source_label: "Failure Triage",
        reason: "Only qualification/regression evidence was found; HQ did not convert nested evaluation scenarios into current issues.",
        source_ref: "agent/runs/*failure-triage*.json",
      },
    ],
    read_only_boundary: {
      canonical_issue_registry_created: false,
      lifecycle_authority_created: false,
      mutation_performed: false,
      remediation_performed: false,
      event_bus_changed: false,
      automatic_dedupe_claimed_as_truth: false,
    },
  };
  model.issues = projection;
  return model;
}

describe("DeltaHQ live Analytics UI", () => {
  beforeEach(() => {
    mockRouterRefresh.mockClear();
    window.history.replaceState(null, "", "/hq");
    (window as typeof window & { deltaDesktop?: unknown }).deltaDesktop = undefined;
  });

  it("uses router.refresh and shows changed projection data after refresh", async () => {
    window.history.replaceState(null, "", "/hq#analytics");
    const initialModel = liveProjectionModel();
    const refreshedModel = liveProjectionModel({
      modelGeneratedAt: "2026-08-07T18:32:00.000Z",
      projectionId: "orgobs-test-2",
      projectionGeneratedAt: "2026-08-07T18:31:00.000Z",
      latestAcceptedSourceTime: "2026-08-07T18:30:00.000Z",
      rawEventCount: 1,
      acceptedEventCount: 1,
    });

    const { rerender } = render(<DeltaHQ model={initialModel} />);

    expect(await screen.findByText("Projection data path")).toBeInTheDocument();
    const refreshButton = screen.getByRole("button", { name: "Refresh" });
    fireEvent.click(refreshButton);

    expect(screen.getByRole("button", { name: "Refreshing..." })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Refreshing..." }));
    await waitFor(() => expect(mockRouterRefresh).toHaveBeenCalledTimes(1));

    rerender(<DeltaHQ model={refreshedModel} />);

    expect(await screen.findByRole("button", { name: "Updated" })).toBeEnabled();
    expect(within(screen.getByText("Accepted sources").closest("div") as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("reports no newer data when refresh rereads the same projection", async () => {
    const initialModel = liveProjectionModel();
    const rerenderOnlyModel = liveProjectionModel({
      modelGeneratedAt: "2026-08-07T18:33:00.000Z",
    });

    const { rerender } = render(<DeltaHQ model={initialModel} />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(screen.getByRole("button", { name: "Refreshing..." })).toBeDisabled();
    await waitFor(() => expect(mockRouterRefresh).toHaveBeenCalledTimes(1));

    rerender(<DeltaHQ model={rerenderOnlyModel} />);

    expect(await screen.findByRole("button", { name: "No newer data" })).toBeEnabled();
  });

  it("renders independent connection states and a useful zero-telemetry Analytics empty state", async () => {
    window.history.replaceState(null, "", "/hq#analytics");
    render(<DeltaHQ model={liveProjectionModel()} />);

    expect(await screen.findByText("Projection data path")).toBeInTheDocument();
    expect(screen.getByText("No accepted current telemetry")).toBeInTheDocument();
    expect(screen.getByText("HQ web shell")).toBeInTheDocument();
    expect(screen.getByText("Delta runtime")).toBeInTheDocument();
    expect(screen.getByText("Observability projection")).toBeInTheDocument();
    expect(screen.getAllByText("Ask Delta").length).toBeGreaterThan(0);
    expect(screen.getByText("No accepted Agent Economics telemetry")).toBeInTheDocument();
  });

  it("disables Operator runtime controls in the browser HQ shell", async () => {
    render(<DeltaHQ model={liveProjectionModel()} />);

    fireEvent.click(screen.getByRole("button", { name: "Operator" }));

    expect(await screen.findByText("Service controls are available only inside Delta.app.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Start local runtime" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Stop app-launched runtime" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Service manager" })).toBeDisabled();
    });
  });
});

describe("DeltaHQ Issues UI", () => {
  beforeEach(() => {
    mockRouterRefresh.mockClear();
    window.history.replaceState(null, "", "/hq#issues");
    (window as typeof window & { deltaDesktop?: unknown }).deltaDesktop = undefined;
  });

  it("shows default open issues with blockers first and keeps resolved history secondary", async () => {
    render(<DeltaHQ model={issuesProjectionModel()} />);

    expect(await screen.findByText("Known problems and diagnosis")).toBeInTheDocument();
    const bodyText = document.body.textContent || "";
    expect(bodyText.indexOf("Credential rotation confirmation")).toBeLessThan(
      bodyText.indexOf("No accepted current Observability telemetry"),
    );
    expect(screen.queryByText("Resolved checkout cleanup")).not.toBeInTheDocument();
  });

  it("exposes evidence refs and source gaps without mutation controls", async () => {
    render(<DeltaHQ model={issuesProjectionModel()} />);

    expect(await screen.findByText("/Users/egeng/delta-backend/docs/SECURITY_ROTATION_CHECKLIST.md")).toBeInTheDocument();
    expect(screen.getByText("/Users/egeng/delta-backend/scripts/secret_scan.py")).toBeInTheDocument();
    expect(screen.getByText("Only qualification/regression evidence was found; HQ did not convert nested evaluation scenarios into current issues.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resolve issue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remediate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start repair/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark resolved/i })).not.toBeInTheDocument();
  });

  it("renders missing Observability as unavailable evidence instead of inferred health", async () => {
    render(<DeltaHQ model={issuesProjectionModel()} />);

    fireEvent.click(await screen.findByRole("button", { name: /No accepted current Observability telemetry/i }));

    expect(screen.getByText(/unavailable measurement evidence/)).toBeInTheDocument();
    expect(screen.getByText(/does not infer a healthy state/)).toBeInTheDocument();
    expect(screen.getByText("missing_current_measurement")).toBeInTheDocument();
  });
});
