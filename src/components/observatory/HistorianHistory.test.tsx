import { render, screen, fireEvent, within } from "@testing-library/react";
import HistorianHistory from "./HistorianHistory";
import archive from "@/lib/historianArchive.json";
const original = global.fetch;
beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => archive });
});
afterEach(() => {
  global.fetch = original;
});
it("keeps the real archive behind sign-in in preview mode", () => {
  render(<HistorianHistory preview />);
  expect(fetch).not.toHaveBeenCalled();
  expect(
    screen.getByText(/Sign in to the private workspace/),
  ).toBeInTheDocument();
});
it("exposes every milestone through ocean chapters and preserves measured census scope", async () => {
  render(<HistorianHistory />);
  await screen.findByRole("heading", { name: "Stats Social App Origin." });
  expect(
    screen
      .getByRole("navigation", { name: "Ocean chapters" })
      .querySelectorAll("button"),
  ).toHaveLength(6);
  for (const milestone of archive.milestones)
    expect(screen.getByText(milestone.title)).toBeInTheDocument();
  const origin = screen.getByText(archive.milestones[0].title).closest("details")!;
  fireEvent.click(within(origin).getByText(archive.milestones[0].title));
  expect(origin).toHaveAttribute("open");
  expect(within(origin).getByText(archive.milestones[0].gained)).toBeVisible();
  fireEvent.change(screen.getByLabelText("Census metric"), {
    target: { value: "unique_tests" },
  });
  expect(
    screen.getByRole("img", { name: "Unique tests: 365 to 417" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/not every repository’s test suite/),
  ).toBeInTheDocument();
});
it("renders a live census feed without hardcoded archive totals", async () => {
  const live = JSON.parse(JSON.stringify(archive));
  live.sourceMode = "live_agent_store";
  live.historyFeed = {
    schemaVersion: 1,
    feedType: "delta_history_feed_v1",
    sourceProjectionType: "delta_origin_story",
    generatedAt: "2026-09-30T12:00:00.000Z",
    story: {
      headline: "Delta began as a stats app and became an Intelligence OS.",
      summary: "The stats app is the website origin baseline.",
      coreShift: "The center moved from scoring to governed intelligence.",
      truthBoundary: "Historian is temporal truth; the site renders only.",
    },
    origin: {
      milestoneId: live.milestones[0].id,
      date: live.milestones[0].date,
      title: "Stats Social App Origin",
      summary: live.milestones[0].description,
      currentTruthGuard: "Historical only.",
    },
    chapters: [
      {
        id: "origin",
        name: "Origin",
        zone: "Surface",
        period: "Dec 2025",
        headline: "Stats Social App Origin.",
        copy: "The website renders the supplied origin story instead of hardcoded legacy copy.",
        milestoneIds: [live.milestones[0].id],
      },
    ],
    outputModules: [],
  };
  live.freshness = {
    state: "live",
    generatedAt: "2026-09-30T12:00:00.000Z",
    latestAcceptedSourceTime: "2026-09-30T12:00:00.000Z",
  };
  live.snapshots = [
    { ...live.snapshots[0], id: "prior", date: "2026-08-25T12:00:00.000Z" },
    { ...live.snapshots[1], id: "current", date: "2026-09-30T12:00:00.000Z" },
  ];
  live.comparison.recordedAt = "2026-09-30T12:00:00.000Z";
  live.comparison.metrics = live.comparison.metrics.map((metric: typeof archive.comparison.metrics[number]) => {
    if (metric.metric_id === "source_loc") {
      return { ...metric, previous: 198699, current: 297386, absolute_change: 98687, percentage_change: 49.666581 };
    }
    if (metric.metric_id === "test_loc") {
      return { ...metric, previous: 60977, current: 116250, absolute_change: 55273, percentage_change: 90.645653 };
    }
    return metric;
  });
  jest.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => live } as Response);
  render(<HistorianHistory />);
  expect(await screen.findByRole("heading", { name: "Stats Social App Origin." })).toBeInTheDocument();
  expect(screen.getByText(/supplied origin story/)).toBeInTheDocument();
  expect(screen.getByText(/scoring to governed intelligence/)).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "297,386 lines below the surface." })).toBeInTheDocument();
  expect(screen.getByText(/live agent store/)).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Source LOC: 198,699 to 297,386" })).toBeInTheDocument();
});
it("shows an unavailable state with retry on an unauthorized or failed read", async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: false } as Response);
  render(<HistorianHistory />);
  expect(
    await screen.findByRole("button", { name: "Retry history" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Delta through time.")).not.toBeInTheDocument();
});
