/** @jest-environment node */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readHistorianArchive } from "./historianArchiveServer";

let root: string;
const originalAgentRoot = process.env.DELTA_AGENT_ROOT;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "historian-archive-server-"));
  process.env.DELTA_AGENT_ROOT = root;
  write("src/observability/structural-census.mjs", "export {};\n");
});

afterEach(() => {
  if (originalAgentRoot === undefined) delete process.env.DELTA_AGENT_ROOT;
  else process.env.DELTA_AGENT_ROOT = originalAgentRoot;
  fs.rmSync(root, { recursive: true, force: true });
});

it("uses an explicitly labelled archive when the configured store is unavailable", () => {
  process.env.DELTA_AGENT_ROOT = path.join(root, "missing");
  const archive = readHistorianArchive();
  expect(archive.sourceMode).toBe("bundled_archive");
  expect(archive.freshness?.state).toBe("fallback");
});

it("does not borrow source commits or interpretation from the bundled archive", () => {
  writeJson("agent/measurements/organizational-observability/census/snapshots/2026-08-25/orgcensus-prior.json", snapshot("prior", "2026-08-25T12:00:00Z"));
  writeJson("agent/measurements/organizational-observability/census/snapshots/2026-09-30/orgcensus-current.json", snapshot("current", "2026-09-30T12:00:00Z"));
  const artifact = comparison("incomplete", "2026-09-30T12:00:00Z", 297386);
  artifact.current_checkpoint.repos = [];
  writeJson("agent/measurements/organizational-observability/comparisons/current.json", {...artifact, growth_interpretation: null});
  writeJson("agent/historian/projections/current.json", {projection_type: "evolution_timeline", generated_at: "2026-09-30T12:00:00Z", entries: []});
  const archive = readHistorianArchive();
  expect(archive.sourceMode).toBe("live_agent_store");
  expect(archive.sourceCommit).toBe("");
  expect(archive.comparison.interpretation.summary).toBe("Interpretation unavailable.");
});

function write(relativePath: string, text: string) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function writeJson(relativePath: string, value: unknown) {
  write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function snapshot(id: string, capturedAt: string) {
  return {
    schema_version: 1,
    snapshot_type: "structural_census",
    census_id: id,
    captured_at: capturedAt,
    methodology_version: "2026-08-06.phase1",
    data_quality: { state: "complete" },
    organizational_scale: { qualified_intelligent_agents: { value: null } },
  };
}

function comparison(id: string, currentDate: string, currentSourceLoc: number) {
  return {
    schema_version: 1,
    artifact_type: "structural_census_progress_baseline",
    artifact_id: id,
    baseline_id: "canonical-numerical-progress",
    recorded_at: currentDate,
    methodology_version: "2026-08-06.phase1",
    prior_checkpoint: { captured_at: "2026-08-25T12:00:00.000Z", repos: [] },
    current_checkpoint: {
      captured_at: currentDate,
      repos: [{ repo: "delta-agent", commit: "b".repeat(40), date: currentDate }],
    },
    snapshot_refs: {
      prior_snapshot_ref: "agent/measurements/organizational-observability/census/snapshots/2026-08-25/orgcensus-prior.json",
      current_snapshot_ref: "agent/measurements/organizational-observability/census/snapshots/2026-09-30/orgcensus-current.json",
    },
    side_by_side_metrics: [
      { metric_id: "source_loc", title: "Source LOC", unit: "loc", previous: 198699, current: currentSourceLoc, absolute_change: currentSourceLoc - 198699, percentage_change: 49.666581 },
      { metric_id: "test_loc", title: "Test LOC", unit: "loc", previous: 60977, current: 116250, absolute_change: 55273, percentage_change: 90.645653 },
    ],
    repo_breakdown: [
      {
        repo: "delta-agent",
        commit_count: 0,
        data_quality_previous: "complete",
        data_quality_current: "complete",
        metrics: {
          source_loc: { previous: 64633, current: 150748, absolute_change: 86115, percentage_change: 133.235 },
          test_loc: { previous: 20168, current: 51048, absolute_change: 30880, percentage_change: 153.117 },
          documentation_loc: { previous: 18698, current: 27183, absolute_change: 8485, percentage_change: 45.379 },
        },
      },
    ],
    growth_interpretation: {
      summary: "Live census selected.",
      product_capability_assessment: "Product growth remains separate from infrastructure growth.",
      infrastructure_governance_assessment: "Growth is infrastructure-heavy.",
    },
    known_limitations: ["unique_tests limitation"],
    read_only_boundary: { no_metric_methodology_change: true },
  };
}

it("selects the latest live agent comparison and keeps paths relative", () => {
  writeJson("agent/measurements/organizational-observability/census/snapshots/2026-08-25/orgcensus-prior.json", snapshot("prior", "2026-08-25T12:00:00.000Z"));
  writeJson("agent/measurements/organizational-observability/census/snapshots/2026-09-30/orgcensus-current.json", snapshot("current", "2026-09-30T12:00:00.000Z"));
  writeJson("agent/measurements/organizational-observability/comparisons/2026-08-26/old.json", comparison("old", "2026-08-26T12:00:00.000Z", 200000));
  writeJson("agent/measurements/organizational-observability/comparisons/2026-09-30/latest.json", comparison("latest", "2026-09-30T12:00:00.000Z", 297386));
  writeJson("agent/historian/projections/evolution-timeline-old.json", {
    projection_type: "evolution_timeline",
    generated_at: "2026-08-01T12:00:00.000Z",
    timeline_window: { to: "2026-08-01T12:00:00.000Z" },
    entries: [],
  });
  writeJson("agent/historian/projections/evolution-timeline-latest.json", {
    projection_type: "delta_origin_story",
    generated_at: "2026-09-30T12:00:00.000Z",
    timeline_window: { to: "2026-09-30T12:00:00.000Z" },
    story_summary: {
      one_sentence: "Delta began as a stats app and became an Intelligence OS.",
      core_shift: "The system moved from scorekeeping to governed intelligence.",
      personal_continuity_relevance: "The origin baseline is now the stats app.",
    },
    entries: [{
      milestone_id: "delta-live-origin",
      date: "2026-09-30T12:00:00.000Z",
      milestone: "Live Origin Feed",
      significance: "major",
      lineage_tracks: ["product_intelligence", "origin_archaeology"],
      concise_description: "Latest feed selected.",
      major_capability_gained: "History can render newest persisted census.",
      evidence_confidence: "high",
      evidence_references: [
        {
          kind: "historian_milestone",
          ref: "agent/historian/milestones/delta-live-origin.json",
          summary: "Safe relative milestone evidence.",
          confidence: "high",
          claim_classification: "directly_evidenced",
        },
        {
          kind: "local_runtime_artifact",
          ref: "/Users/egeng/.delta/memory.db",
          summary: "Unsafe evidence must not project.",
          confidence: "low",
          claim_classification: "unsupported",
        },
      ],
    }],
  });

  const archive = readHistorianArchive();
  expect(archive.sourceMode).toBe("live_agent_store");
  expect(archive.comparison.id).toBe("latest");
  expect(archive.comparison.metrics.find((metric) => metric.metric_id === "source_loc")?.current).toBe(297386);
  expect(archive.milestones).toHaveLength(1);
  expect(archive.milestones[0].id).toBe("delta-live-origin");
  expect(archive.milestones[0].evidence).toEqual([{
    kind: "historian_milestone",
    ref: "agent/historian/milestones/delta-live-origin.json",
    summary: "Safe relative milestone evidence.",
    confidence: "high",
    classification: "directly_evidenced",
  }]);
  expect(archive.milestones[0].omittedEvidence).toBe(1);
  expect(archive.historyFeed?.feedType).toBe("delta_history_feed_v1");
  expect(archive.historyFeed?.sourceProjectionType).toBe("delta_origin_story");
  expect(archive.historyFeed?.origin?.milestoneId).toBe("delta-live-origin");
  expect(archive.historyFeed?.chapters[0].milestoneIds).toEqual(["delta-live-origin"]);
  expect(JSON.stringify(archive)).not.toContain(root);
  expect(JSON.stringify(archive)).not.toContain("/Users/");
  expect(JSON.stringify(archive)).not.toContain("memory.db");
});
