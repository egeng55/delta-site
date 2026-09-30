import { observatoryPreview } from './observatoryPreview';
import { summarizeWorkspace } from './workspaceSummary';

const now = Date.parse('2026-09-30T15:00:00.000Z');
const report = () => ({ ...observatoryPreview(new Date(now).toISOString()), synthetic: false });

it('exposes counts and closed statuses only, without private labels or source details', () => {
  const source = report();
  source.repositories[0].label = '/Users/private/customer-secret';
  source.graphs[0].nodes[0].label = 'private task prompt';
  const result = summarizeWorkspace(source, now);
  expect(result.available).toBe(true);
  expect(result.counts).toMatchObject({ capabilities: 48, tools: 36, repositories: 5 });
  expect(result.statuses).toEqual({ snapshot: 'recent', runtime: 'not_observed', deployment: 'not_observed' });
  expect(JSON.stringify(result)).not.toMatch(/private|sourceCommit|graphs|label|architectureVersion/);
});

it('labels stale source evidence without implying live runtime health', () => {
  expect(summarizeWorkspace(report(), now + 27 * 3600_000).statuses.snapshot).toBe('stale');
});

it('does not invent counts for missing, synthetic, invalid or future evidence', () => {
  for (const source of [null, observatoryPreview(), { ...report(), generatedAt: 'private raw error' }, { ...report(), generatedAt: new Date(now + 120_000).toISOString() }, { ...report(), census: { ...report().census, tools: NaN } }]) {
    expect(summarizeWorkspace(source, now)).toEqual({ available: false, observedAt: null, counts: null, statuses: { snapshot: 'unavailable', runtime: 'not_observed', deployment: 'not_observed' } });
  }
});
