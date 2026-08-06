import { readFileSync } from "fs";
import path from "path";
import { getDeltaHqViewModel } from "@/lib/deltaHqViewModel";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Delta HQ web route", () => {
  it("mounts the shared HQ renderer without replacing the OS Console", () => {
    const pageSource = readSource("src/app/(hq)/hq/page.tsx");
    const componentSource = readSource("src/components/DeltaHQ.tsx");
    const middlewareSource = readSource("middleware.ts");

    expect(pageSource).toContain("Delta HQ");
    expect(pageSource).toContain("<DeltaHQ model={getDeltaHqViewModel()} />");
    expect(componentSource).toContain("Owner HQ");
    expect(componentSource).toContain("Executive brief");
    expect(componentSource).toContain("Organization");
    expect(componentSource).toContain("Initiatives");
    expect(componentSource).toContain("Activity");
    expect(componentSource).toContain("Owner review");
    expect(componentSource).toContain("Analytics");
    expect(componentSource).toContain("Ask Delta");
    expect(componentSource).toContain("Operator Mode");
    expect(componentSource).toContain("Advisory only");
    expect(componentSource).toContain("reloadHq");
    expect(middlewareSource).toContain("OWNER_HQ_ROUTE = '/hq'");
    expect(middlewareSource).toContain("PROTECTED_ROUTES = [");
    expect(middlewareSource).toContain("'/hq/:path*'");
    expect(middlewareSource).toContain("'/os/:path*'");
  });

  it("keeps canonical state seams explicit in the HQ view model", () => {
    const model = getDeltaHqViewModel();

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

  it("prepares Organizational Observability without inventing metric definitions", () => {
    const model = getDeltaHqViewModel();

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
  });

  it("preserves Mission Control owner-review authority limits", () => {
    const model = getDeltaHqViewModel();
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
