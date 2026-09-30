import { freshness, type ObservatoryReport } from './observatory';

export interface WorkspaceSummary {
  available: boolean;
  observedAt: string | null;
  counts: null | {
    capabilities: number; tools: number; systems: number; repositories: number;
    sourceFiles: number; testFiles: number; mappedCapabilities: number;
    ambiguousCapabilities: number; unmappedCapabilities: number;
  };
  statuses: {
    snapshot: 'recent' | 'stale' | 'unavailable';
    runtime: 'not_observed';
    deployment: 'not_observed';
  };
}

function unavailable(): WorkspaceSummary {
  return {
    available: false, observedAt: null, counts: null,
    statuses: { snapshot: 'unavailable', runtime: 'not_observed', deployment: 'not_observed' },
  };
}

/** Counts from a source snapshot are not runtime health, customer activity or deployed proof. */
export function summarizeWorkspace(report: ObservatoryReport | null, now = Date.now()): WorkspaceSummary {
  if (!report || report.synthetic || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(report.generatedAt)) return unavailable();
  const snapshot = freshness(report.generatedAt, now);
  if (snapshot === 'invalid') return unavailable();
  const counts = {
    capabilities: report.census.capabilities,
    tools: report.census.tools,
    systems: report.census.systems,
    repositories: report.repositories.length,
    sourceFiles: report.repositories.reduce((total, repo) => total + repo.files, 0),
    testFiles: report.repositories.reduce((total, repo) => total + repo.testFiles, 0),
    mappedCapabilities: report.census.resolved,
    ambiguousCapabilities: report.census.ambiguous,
    unmappedCapabilities: report.census.unmapped,
  };
  if (Object.values(counts).some(value => !Number.isSafeInteger(value) || value < 0 || value > 100_000_000)) return unavailable();
  return {
    available: true, observedAt: report.generatedAt, counts,
    statuses: { snapshot, runtime: 'not_observed', deployment: 'not_observed' },
  };
}
