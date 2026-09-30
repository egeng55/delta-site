export type HistorianMetric = {
  metric_id: string;
  title: string;
  unit: string;
  previous: number | null;
  current: number | null;
  absolute_change: number | null;
  percentage_change: number | null;
};
export type HistorianEvidence = {
  kind?: string;
  ref: string;
  summary: string;
  confidence: string;
  classification: string;
};
export type HistorianMilestone = {
  id: string;
  date: string;
  title: string;
  significance: string;
  tracks: string[];
  description: string;
  gained: string;
  confidence: string;
  evidence: HistorianEvidence[];
  omittedEvidence: number;
};
export type DeltaHistoryFeed = {
  schemaVersion: 1;
  feedType: "delta_history_feed_v1";
  sourceProjectionType: string;
  generatedAt: string;
  story: {
    headline: string;
    summary: string;
    coreShift: string;
    truthBoundary: string;
  };
  origin: {
    milestoneId: string;
    date: string;
    title: string;
    summary: string;
    currentTruthGuard: string;
  } | null;
  chapters: {
    id: string;
    name: string;
    zone: string;
    period: string;
    headline: string;
    copy: string;
    milestoneIds: string[];
  }[];
  outputModules: {
    id: string;
    label: string;
    consumes: string[];
  }[];
};
export type HistorianArchive = {
  version: number;
  sourceMode?: "live_agent_store" | "bundled_archive";
  freshness?: {
    state: string;
    generatedAt: string | null;
    latestAcceptedSourceTime: string | null;
  };
  sourceCommit: string;
  archiveThrough: string;
  provenance: { path: string; sha256: string }[];
  snapshots: {
    id: string;
    date: string;
    methodology: string;
    quality: string;
    missingQualification: boolean;
  }[];
  milestones: HistorianMilestone[];
  historyFeed?: DeltaHistoryFeed;
  comparison: {
    id: string;
    recordedAt: string;
    methodology: string;
    metrics: HistorianMetric[];
    repositories: {
      repo: string;
      commit_count: number;
      data_quality_previous: string;
      data_quality_current: string;
      metrics: Record<string, {
        previous: number | null;
        current: number | null;
        absolute_change: number | null;
        percentage_change: number | null;
      }>;
    }[];
    interpretation: {
      summary: string;
      product_capability_assessment: string;
      infrastructure_governance_assessment: string;
    };
    limitations: string[];
  };
};
export const historyTracks: Record<string, string> = {
  product_intelligence: "Product intelligence",
  engineering_agentic: "Engineering & agents",
  converged_platform: "Shared platform",
  origin_archaeology: "Origin archaeology",
};
export function historianNumber(value: number | null, unit = "count") {
  return value === null
    ? "Not measured"
    : new Intl.NumberFormat("en-US", {
      maximumFractionDigits: unit === "ratio" ? 4 : 0,
    }).format(value);
}
