import "server-only";

import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";
import fallbackArchive from "./historianArchive.json";
import type {
  DeltaHistoryFeed,
  HistorianArchive,
  HistorianEvidence,
  HistorianMilestone,
} from "./historian";

const MAX_JSON_BYTES = 2_000_000;
const COMPARISON_ROOT = "agent/measurements/organizational-observability/comparisons";
const SNAPSHOT_ROOT = "agent/measurements/organizational-observability/census/snapshots";
const TIMELINE_ROOT = "agent/historian/projections";
const HISTORY_PROJECTION_TYPES = new Set(["evolution_timeline", "delta_origin_story"]);
const SAFE_EVIDENCE_KINDS = new Set([
  "git_artifact",
  "git_commit",
  "historian_milestone",
  "historian_projection",
  "historian_update",
  "repo_doc",
  "other",
]);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function readBoundedJson(agentRoot: string, relativePath: string): { raw: string; parsed: JsonRecord } {
  if (path.isAbsolute(relativePath) || relativePath.includes("..")) throw new Error("invalid_historian_ref");
  const filePath = path.join(agentRoot, relativePath);
  const stat = statSync(filePath);
  if (!stat.isFile() || stat.size > MAX_JSON_BYTES) throw new Error("invalid_historian_artifact");
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("invalid_historian_artifact");
  return { raw, parsed };
}

function listJsonFiles(agentRoot: string, relativeDirectory: string): string[] {
  const directory = path.join(agentRoot, relativeDirectory);
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  function walk(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(path.relative(agentRoot, entryPath).split(path.sep).join("/"));
      }
    }
  }
  walk(directory);
  return files.sort();
}

function dateMs(value: unknown): number {
  const text = stringValue(value);
  const ms = text ? Date.parse(text) : Number.NaN;
  return Number.isFinite(ms) ? ms : 0;
}

function latestByDate<T>(items: T[], getDate: (item: T) => number): T | null {
  return items.reduce<T | null>((latest, item) => {
    if (!latest) return item;
    return getDate(item) >= getDate(latest) ? item : latest;
  }, null);
}

function resolveAgentRoot(): string | null {
  if (process.env.DELTA_AGENT_ROOT) {
    return path.isAbsolute(process.env.DELTA_AGENT_ROOT) && existsSync(process.env.DELTA_AGENT_ROOT)
      ? process.env.DELTA_AGENT_ROOT : null;
  }
  const candidates = [
    process.env.DELTA_AGENT_ROOT,
    path.resolve(process.cwd(), "..", "delta-agent"),
    "/Users/egeng/delta/delta-agent",
    "/Users/egeng/delta-agent",
  ].filter((candidate): candidate is string => Boolean(candidate && path.isAbsolute(candidate)));
  return candidates.find((candidate) =>
    existsSync(path.join(candidate, "src", "observability", "structural-census.mjs"))
      && existsSync(path.join(candidate, "agent", "measurements", "organizational-observability")),
  ) ?? null;
}

function selectLatestComparison(agentRoot: string): { path: string; raw: string; artifact: JsonRecord } | null {
  const comparisons = listJsonFiles(agentRoot, COMPARISON_ROOT)
    .map((file) => {
      try {
        const { raw, parsed } = readBoundedJson(agentRoot, file);
        if (
          parsed.artifact_type !== "structural_census_progress_baseline"
          || !isRecord(parsed.read_only_boundary)
          || parsed.read_only_boundary.no_metric_methodology_change !== true
        ) return null;
        return { path: file, raw, artifact: parsed };
      } catch {
        return null;
      }
    })
    .filter((item): item is { path: string; raw: string; artifact: JsonRecord } => Boolean(item));

  return latestByDate(comparisons, (item) =>
    dateMs(isRecord(item.artifact.current_checkpoint) ? item.artifact.current_checkpoint.captured_at : item.artifact.recorded_at),
  );
}

function selectLatestTimeline(agentRoot: string): { path: string; raw: string; timeline: JsonRecord } | null {
  const timelines = listJsonFiles(agentRoot, TIMELINE_ROOT)
    .map((file) => {
      try {
        const { raw, parsed } = readBoundedJson(agentRoot, file);
        const projectionType = stringValue(parsed.projection_type);
        if (!projectionType || !HISTORY_PROJECTION_TYPES.has(projectionType) || !Array.isArray(parsed.entries)) return null;
        return { path: file, raw, timeline: parsed };
      } catch {
        return null;
      }
    })
    .filter((item): item is { path: string; raw: string; timeline: JsonRecord } => Boolean(item));

  return latestByDate(timelines, (item) => {
    const window = isRecord(item.timeline.timeline_window) ? item.timeline.timeline_window : {};
    return Math.max(dateMs(window.to), dateMs(item.timeline.generated_at));
  });
}

function readSnapshot(agentRoot: string, relativePath: string) {
  if (!relativePath.startsWith(`${SNAPSHOT_ROOT}/`) || !relativePath.endsWith(".json")) {
    throw new Error("invalid_census_ref");
  }
  const { raw, parsed } = readBoundedJson(agentRoot, relativePath);
  const organizationalScale = isRecord(parsed.organizational_scale) ? parsed.organizational_scale : {};
  const qualified = isRecord(organizationalScale.qualified_intelligent_agents)
    ? organizationalScale.qualified_intelligent_agents.value
    : undefined;
  return {
    raw,
    projected: {
      id: stringValue(parsed.census_id) ?? path.basename(relativePath, ".json"),
      date: stringValue(parsed.captured_at) ?? stringValue(parsed.generated_at) ?? "",
      methodology: stringValue(parsed.methodology_version) ?? "unknown",
      quality: isRecord(parsed.data_quality) ? stringValue(parsed.data_quality.state) ?? "unknown" : "unknown",
      missingQualification: qualified === null,
    },
  };
}

function safeHistorianEvidence(value: unknown): HistorianEvidence | null {
  if (!isRecord(value)) return null;
  const kind = stringValue(value.kind) ?? "other";
  if (!SAFE_EVIDENCE_KINDS.has(kind)) return null;
  const ref = stringValue(value.ref);
  if (
    !ref
    || path.isAbsolute(ref)
    || ref.includes("..")
    || ref.includes("/Users/")
    || /\.delta|memory\.db|Bearer /i.test(ref)
  ) return null;
  if (
    kind === "git_artifact"
    && !/^delta-(agent|backend|site|mobile|jobs):[a-f0-9]{40}:[a-zA-Z0-9_./-]+$/.test(ref)
  ) return null;
  if (
    kind === "git_commit"
    && !/^delta-(agent|backend|site|mobile|jobs):[a-f0-9]{7,40}$/.test(ref)
  ) return null;
  if (!kind.startsWith("git_") && !/^[a-zA-Z0-9_./:-]+$/.test(ref)) return null;
  return {
    kind,
    ref,
    summary: stringValue(value.summary) ?? "",
    confidence: stringValue(value.confidence) ?? "unknown",
    classification: stringValue(value.claim_classification) ?? "unknown",
  };
}

function milestonesFromTimeline(timeline: JsonRecord): HistorianMilestone[] {
  return (Array.isArray(timeline.entries) ? timeline.entries : [])
    .filter(isRecord)
    .map((entry) => {
      const evidenceReferences = Array.isArray(entry.evidence_references) ? entry.evidence_references : [];
      const evidence = evidenceReferences
        .map(safeHistorianEvidence)
        .filter((item): item is HistorianEvidence => Boolean(item));
      return {
        id: stringValue(entry.milestone_id) ?? stringValue(entry.id) ?? "unknown-milestone",
        date: stringValue(entry.date) ?? stringValue(entry.recorded_at) ?? "",
        title: stringValue(entry.milestone) ?? stringValue(entry.title) ?? "Untitled milestone",
        significance: stringValue(entry.significance) ?? "unknown",
        tracks: strings(entry.lineage_tracks),
        description: stringValue(entry.concise_description) ?? stringValue(entry.summary) ?? "",
        gained: stringValue(entry.major_capability_gained) ?? "",
        confidence: stringValue(entry.evidence_confidence) ?? "unknown",
        evidence,
        omittedEvidence: evidenceReferences.length - evidence.length,
      };
    });
}

function idsWithTrack(milestones: HistorianMilestone[], track: string) {
  return milestones
    .filter((milestone) => milestone.tracks.includes(track))
    .map((milestone) => milestone.id);
}

function chapterMilestones(milestones: HistorianMilestone[], ids: string[]) {
  const allowed = new Set(ids);
  return milestones.filter((milestone) => allowed.has(milestone.id));
}

function periodFor(milestones: HistorianMilestone[]) {
  const dates = milestones
    .map((milestone) => Date.parse(milestone.date))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (dates.length === 0) return "Recorded history";
  const format = (ms: number) => new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "America/New_York",
  });
  const first = format(dates[0]);
  const last = format(dates.at(-1) ?? dates[0]);
  return first === last ? first : `${first} - ${last}`;
}

function buildHistoryFeed(timeline: JsonRecord, milestones: HistorianMilestone[]): DeltaHistoryFeed {
  const projectionType = stringValue(timeline.projection_type) ?? "unknown";
  const storySummary = isRecord(timeline.story_summary) ? timeline.story_summary : {};
  const productIds = idsWithTrack(milestones, "product_intelligence");
  const engineeringIds = idsWithTrack(milestones, "engineering_agentic");
  const convergedIds = idsWithTrack(milestones, "converged_platform");
  const origin = milestones.find((milestone) => milestone.id === productIds[0]) ?? milestones[0] ?? null;
  const earlyProductIds = productIds
    .slice(1)
    .filter((id) => !/behavioral-os|intelligence-os|shared-substrate/.test(id));
  const substrateIds = productIds
    .filter((id) => /behavioral-os|intelligence-os|shared-substrate/.test(id));
  const specialistIds = [...new Set(convergedIds)];
  const agentIds = engineeringIds.filter((id) => !specialistIds.includes(id));
  const chapterSpecs = [
    {
      id: "origin",
      name: "Origin",
      zone: "Surface",
      ids: origin ? [origin.id] : [],
      headline: origin?.title ? `${origin.title}.` : "An idea becomes a system.",
      copy: origin?.description ?? "The earliest available Historian projection supplies Delta's origin baseline.",
    },
    {
      id: "memory-and-health",
      name: "Memory and health intelligence",
      zone: "Sunlight",
      ids: earlyProductIds,
      headline: "The score becomes continuity.",
      copy: "The product lineage moved from isolated measurement toward memory, conversation, inference, and health-intelligence loops.",
    },
    {
      id: "operating-substrate",
      name: "Operating substrate",
      zone: "Twilight",
      ids: substrateIds,
      headline: "The product becomes an operating system.",
      copy: "Delta generalized from one domain into Behavioral OS and Intelligence OS framing, with substrate proof replacing implied transferability.",
    },
    {
      id: "agentic-engineering",
      name: "Agentic engineering",
      zone: "Midnight",
      ids: agentIds,
      headline: "The engineering system gets its own runtime.",
      copy: "The engineering lineage added supervisor, shared runtime, Mission Control, and bounded Historian dependency records.",
    },
    {
      id: "governed-specialists",
      name: "Governed specialists",
      zone: "Abyss",
      ids: specialistIds,
      headline: "Specialists join the current.",
      copy: "Qualified specialist milestones show the shared runtime expanding into distinct advisory roles without granting autonomous execution authority.",
    },
  ].filter((chapter) => chapter.ids.length > 0);

  return {
    schemaVersion: 1,
    feedType: "delta_history_feed_v1",
    sourceProjectionType: projectionType,
    generatedAt: stringValue(timeline.generated_at) ?? "",
    story: {
      headline: stringValue(storySummary.one_sentence) ?? "Delta through time.",
      summary: stringValue(storySummary.personal_continuity_relevance)
        ?? "Historian supplies milestone projections for the website to render without changing historical truth.",
      coreShift: stringValue(storySummary.core_shift)
        ?? "Delta evolved through product, memory, substrate, and governed-agent phases.",
      truthBoundary: "Historian remains temporal truth. The website renders a read-only presentation feed and does not mutate canon.",
    },
    origin: origin
      ? {
        milestoneId: origin.id,
        date: origin.date,
        title: origin.title,
        summary: origin.description,
        currentTruthGuard: "Origin evidence is historical context, not current canonical product identity.",
      }
      : null,
    chapters: chapterSpecs.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      zone: chapter.zone,
      period: periodFor(chapterMilestones(milestones, chapter.ids)),
      headline: chapter.headline,
      copy: chapter.copy,
      milestoneIds: chapter.ids,
    })),
    outputModules: [
      { id: "origin_hero", label: "Origin story hero", consumes: ["historyFeed.origin", "historyFeed.story"] },
      { id: "ocean_timeline", label: "Interactive evolution timeline", consumes: ["historyFeed.chapters", "milestones"] },
      { id: "census_growth", label: "Measured structural growth", consumes: ["comparison", "snapshots"] },
      { id: "evidence_drawers", label: "Bounded evidence drawers", consumes: ["milestones.evidence", "provenance"] },
    ],
  };
}

function sourceCommitFromComparison(artifact: JsonRecord): string {
  const checkpoint = isRecord(artifact.current_checkpoint) ? artifact.current_checkpoint : {};
  const repos = Array.isArray(checkpoint.repos) ? checkpoint.repos.filter(isRecord) : [];
  const agent = repos.find((repo) => repo.repo === "delta-agent" || repo.repo === "agent");
  const commit = stringValue(agent?.commit);
  return commit && /^[a-f0-9]{40}$/.test(commit) ? commit : "";
}

function buildLiveArchive(agentRoot: string): HistorianArchive | null {
  const comparison = selectLatestComparison(agentRoot);
  const timeline = selectLatestTimeline(agentRoot);
  if (!comparison || !timeline) return null;
  const refs = isRecord(comparison.artifact.snapshot_refs) ? comparison.artifact.snapshot_refs : {};
  const priorRef = stringValue(refs.prior_snapshot_ref);
  const currentRef = stringValue(refs.current_snapshot_ref);
  if (!priorRef || !currentRef) return null;

  const prior = readSnapshot(agentRoot, priorRef);
  const current = readSnapshot(agentRoot, currentRef);
  const milestones = milestonesFromTimeline(timeline.timeline);
  const historyFeed = buildHistoryFeed(timeline.timeline, milestones);
  const archiveThrough = isRecord(timeline.timeline.timeline_window)
    ? stringValue(timeline.timeline.timeline_window.to)
    : null;

  return {
    version: 1,
    sourceMode: "live_agent_store",
    sourceCommit: sourceCommitFromComparison(comparison.artifact),
    archiveThrough: archiveThrough ?? stringValue(timeline.timeline.generated_at) ?? "",
    freshness: {
      state: "live",
      generatedAt: stringValue(comparison.artifact.recorded_at),
      latestAcceptedSourceTime: isRecord(comparison.artifact.current_checkpoint)
        ? stringValue(comparison.artifact.current_checkpoint.captured_at)
        : null,
    },
    provenance: [
      { path: comparison.path, sha256: sha256(comparison.raw) },
      { path: timeline.path, sha256: sha256(timeline.raw) },
      { path: priorRef, sha256: sha256(prior.raw) },
      { path: currentRef, sha256: sha256(current.raw) },
    ],
    snapshots: [prior.projected, current.projected],
    milestones,
    historyFeed,
    comparison: {
      id: stringValue(comparison.artifact.artifact_id) ?? "latest-structural-census-comparison",
      recordedAt: stringValue(comparison.artifact.recorded_at) ?? "",
      methodology: stringValue(comparison.artifact.methodology_version) ?? "unknown",
      metrics: Array.isArray(comparison.artifact.side_by_side_metrics)
        ? comparison.artifact.side_by_side_metrics as HistorianArchive["comparison"]["metrics"]
        : [],
      repositories: Array.isArray(comparison.artifact.repo_breakdown)
        ? comparison.artifact.repo_breakdown as HistorianArchive["comparison"]["repositories"]
        : [],
      interpretation: isRecord(comparison.artifact.growth_interpretation)
        ? comparison.artifact.growth_interpretation as HistorianArchive["comparison"]["interpretation"]
        : { summary: "Interpretation unavailable.", product_capability_assessment: "Not supplied by this comparison.", infrastructure_governance_assessment: "Not supplied by this comparison." },
      limitations: Array.isArray(comparison.artifact.known_limitations)
        ? strings(comparison.artifact.known_limitations)
        : [],
    },
  };
}

export function readHistorianArchive(): HistorianArchive {
  const agentRoot = resolveAgentRoot();
  if (agentRoot) {
    try {
      const live = buildLiveArchive(agentRoot);
      if (live) return live;
    } catch {
      // Fall through to the pinned bundled archive. Missing live history must not
      // create a synthetic present-day story.
    }
  }
  return {
    ...(fallbackArchive as HistorianArchive),
    sourceMode: "bundled_archive",
    freshness: {
      state: "fallback",
      generatedAt: fallbackArchive.comparison.recordedAt,
      latestAcceptedSourceTime: fallbackArchive.snapshots.at(-1)?.date ?? null,
    },
  };
}
