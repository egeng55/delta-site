export interface Census { capabilities: number; tools: number; systems: number; resolved: number; ambiguous: number; unmapped: number }
export interface GraphNode { id: string; label: string; group: string; kind: string; maturity: string }
export interface Graph { id: 'systems' | 'capabilities' | 'modules'; sourceCommit: string; generatedAt: string; nodes: GraphNode[]; links: { source: string; target: string; relation: string }[] }
export interface ObservatoryReport {
  version: 1; generatedAt: string; sourceCommit: string; architectureVersion: string; synthetic: boolean;
  repositories: { id: string; label: string; sha: string; files: number; testFiles: number }[];
  census: Census; graphs: Graph[]; history: { generatedAt: string; sourceCommit: string; census: Census }[];
}
export type Section = 'overview' | 'architecture' | 'census' | 'quality' | 'settings' | 'work' | 'engineering';
export function freshness(timestamp: string, now = Date.now()) {
  const age = now - Date.parse(timestamp);
  return age < -60_000 || !Number.isFinite(age) ? 'invalid' : age > 26 * 3600_000 ? 'stale' : 'recent';
}
export function reportReply(input: string, report: ObservatoryReport): { text: string; section?: Section; days?: number; repo?: string; rebuild?: boolean } {
  const q = input.trim().toLowerCase();
  if (q.length > 500) return { text: 'Keep your request under 500 characters.' };
  if (/\b(deploy|execute|delete|send|pay|write|shell|secret|token|password|approve)\b/.test(q)) return { text: 'This panel cannot execute operations or change authority.' };
  const days = q.match(/\b(7|30|90)\s*days?\b/);
  if (days) return { text: `Showing recorded snapshots from the last ${days[1]} days. Missing days are not inferred.`, days: Number(days[1]), section: 'census' };
  if (/\b(rebuild|relayout|reset graph)\b/.test(q)) return { text: 'Rebuilding the layout from this snapshot. Source data is unchanged.', rebuild: true, section: 'architecture' };
  const repo = ['agent', 'backend', 'site', 'mobile', 'jobs'].find(id => new RegExp(`\\b${id}\\b`).test(q));
  if (repo) return { text: `Focused on ${repo} in the supplied architecture snapshot.`, repo, section: 'architecture' };
  if (/\b(census|count|capabilities|how many)\b/.test(q)) return { text: `${report.census.capabilities} registered capabilities; ${report.census.resolved} with one explicit system mapping, ${report.census.ambiguous} with multiple, ${report.census.unmapped} without a mapping. These are declarations, not usage measurements.`, section: 'census' };
  if (/\b(quality|security|checks|missing|health|tests)\b/.test(q)) return { text: 'Source validation checks the report shape and closed graph references. CI, deployed parity, runtime activity, and spend are not supplied by this snapshot and are not marked passing.', section: 'quality' };
  if (/\b(architecture|graph|map)\b/.test(q)) return { text: 'Opening explicit architecture ownership and dependency mappings. Static edges do not prove runtime collaboration.', section: 'architecture' };
  return { text: 'I can show architecture, focus agent/backend/site/mobile/jobs, show census, select 7/30/90 days, rebuild the graph layout, or list quality gaps. No model or system action is invoked.' };
}
