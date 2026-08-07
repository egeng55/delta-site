import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import DeltaHQ from "@/components/DeltaHQ";
import type { DeltaHqViewModel } from "@/lib/deltaHqViewModel";
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
