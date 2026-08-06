import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  DELTA_HQ_VIEW_MODEL,
  type DeltaHqEvolutionMilestone,
  type DeltaHqEvolutionProjection,
  type DeltaHqLineageTrackId,
  type DeltaHqMilestoneClaims,
  type DeltaHqMilestoneEvidenceReference,
  type DeltaHqViewModel,
} from "./deltaHqViewModel";

type HistorianMilestoneDetail = {
  milestone_id: string;
  recorded_at: string;
  title: string;
  summary: string;
  significance: string;
  lineage_tracks: string[];
  major_capability_gained: string;
  predecessor_milestones: string[];
  successor_milestones: string[];
  evidence_confidence: string;
  evidence_references: DeltaHqMilestoneEvidenceReference[];
  claim_summary?: Partial<DeltaHqMilestoneClaims>;
  record_ref?: string;
};

type HistorianTimelineEntry = {
  date: string;
  milestone_id: string;
  milestone: string;
  significance: string;
  lineage_tracks: string[];
  concise_description: string;
  major_capability_gained: string;
  predecessor_milestones: string[];
  successor_milestones: string[];
  evidence_confidence: string;
  evidence_references: DeltaHqMilestoneEvidenceReference[];
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
  timeline_window: DeltaHqEvolutionProjection["timeline_window"];
  entries: HistorianTimelineEntry[];
  read_only_boundary: DeltaHqEvolutionProjection["read_only_boundary"];
  source_boundary?: {
    source_of_truth?: string;
  };
};

type HistorianMilestoneModule = {
  inspectHistorianMilestones: (args: { repoRoot: string; track?: string; significance?: string; limit?: number }) => HistorianInspection;
  buildEvolutionTimeline: (args: { repoRoot: string; track?: string; limit?: number }) => HistorianTimeline;
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

function resolveAgentRepoRoot(): string {
  return process.env.DELTA_AGENT_REPO_ROOT || path.resolve(process.cwd(), "..", "delta-agent");
}

async function loadHistorianMilestoneModule(repoRoot: string): Promise<HistorianMilestoneModule> {
  const modulePath = path.join(repoRoot, "src", "historian", "milestones.mjs");
  return await import(pathToFileURL(modulePath).href) as HistorianMilestoneModule;
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
  return timeline.entries.map((entry) => {
    const inspected = inspectionById.get(entry.milestone_id);
    const claimSummary = normalizeClaims(inspected?.claim_summary);
    const references = inspected?.evidence_references || entry.evidence_references;
    const evidence = evidenceMode(references, claimSummary);

    return {
      date: entry.date,
      milestone_id: entry.milestone_id,
      milestone: entry.milestone,
      significance: entry.significance,
      lineage_tracks: normalizeTracks(entry.lineage_tracks),
      concise_description: entry.concise_description,
      major_capability_gained: entry.major_capability_gained,
      predecessor_milestones: entry.predecessor_milestones,
      successor_milestones: entry.successor_milestones,
      evidence_confidence: entry.evidence_confidence,
      evidence_references: references,
      claim_summary: claimSummary,
      record_ref: inspected?.record_ref,
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
  const lineageTracks = TRACKS.map((track) => ({
    ...track,
    milestone_ids: entries
      .filter((entry) => entry.lineage_tracks.includes(track.id))
      .map((entry) => entry.milestone_id),
  }));
  const convergenceMilestoneIds = entries
    .filter((entry) => entry.lineage_tracks.includes("converged_platform") || entry.lineage_tracks.length > 1)
    .map((entry) => entry.milestone_id);

  return {
    status: timeline.status === inspection.status ? timeline.status : "incomplete",
    generated_at: timeline.generated_at,
    inspected_at: inspection.inspected_at,
    timeline_window: timeline.timeline_window,
    source_of_truth: timeline.source_boundary?.source_of_truth || "agent/historian/milestones",
    source_boundary: "Historian milestones are rendered as read-only projections. HQ does not create, modify, or reinterpret milestone records.",
    fixtureFallback: false,
    entries,
    lineage_tracks: lineageTracks,
    convergence: {
      status: convergenceMilestoneIds.length > 0 ? "evidenced" : "not_evidenced_in_current_projection",
      milestone_ids: convergenceMilestoneIds,
      explanation: convergenceMilestoneIds.length > 0
        ? "Historian explicitly marks these milestones as converged or multi-track."
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
    read_only_boundary: timeline.read_only_boundary || inspection.read_only_boundary,
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
    const inspection = historian.inspectHistorianMilestones({ repoRoot, track: "all", significance: "all", limit: 50 });
    const timeline = historian.buildEvolutionTimeline({ repoRoot, track: "all", limit: 50 });
    return buildEvolutionProjection(timeline, inspection);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Historian milestone runtime unavailable";
    return unavailableEvolutionProjection(reason);
  }
}

export async function getDeltaHqViewModel(): Promise<DeltaHqViewModel> {
  const base = cloneBaseViewModel();
  const evolution = await getHistorianEvolutionProjection();
  return {
    ...base,
    evolution,
  };
}
