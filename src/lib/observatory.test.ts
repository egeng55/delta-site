/** @jest-environment node */
import { validateReport } from './observatory-contract.cjs';
import { observatoryPreview } from './observatoryPreview';
import { freshness, reportReply } from './observatory';
const report = () => ({ ...observatoryPreview('2026-09-16T12:00:00.000Z'), synthetic: false });
it('accepts a bounded closed report and rejects synthetic input in the live contract', () => {
  expect(validateReport(report()).version).toBe(1);
  expect(() => validateReport(observatoryPreview())).toThrow('observatory_invalid_report');
});
it.each(['owner@example.test', 'https://private.example/meeting', 'Bearer private', '<script>'])('rejects private or executable metadata: %s', value => {
  const data = report(); data.graphs[0].nodes[0].label = value;
  expect(() => validateReport(data)).toThrow('observatory_invalid_report');
});
it('rejects unknown fields, bad references, duplicates and invalid counts', () => {
  expect(() => validateReport({ ...report(), rawPayload: 'private' })).toThrow();
  const refs = report(); refs.graphs[0].links[0].target = 'fabricated'; expect(() => validateReport(refs)).toThrow();
  const dup = report(); dup.graphs[0].nodes.push(dup.graphs[0].nodes[0]); expect(() => validateReport(dup)).toThrow();
  const count = report(); count.census.capabilities++; expect(() => validateReport(count)).toThrow();
});
it('rejects invalid timestamps and misbound provenance', () => {
  const data = report(); data.generatedAt = '2026-02-31T12:00:00.000Z'; expect(() => validateReport(data)).toThrow();
  const other = report(); other.sourceCommit = 'b'.repeat(40); expect(() => validateReport(other)).toThrow();
});
it('never upgrades stale, future or absent evidence into current truth', () => {
  const now = Date.parse('2026-09-16T12:00:00.000Z');
  expect(freshness('2026-09-16T10:00:00.000Z', now)).toBe('recent');
  expect(freshness('2026-09-14T10:00:00.000Z', now)).toBe('stale');
  expect(freshness('2026-09-18T10:00:00.000Z', now)).toBe('invalid');
  expect(freshness('missing', now)).toBe('invalid');
});
it('chat changes only fixed local view controls and refuses execution', () => {
  expect(reportReply('show census for 7 days', report())).toMatchObject({ days: 7, section: 'census' });
  expect(reportReply('show backend', report())).toMatchObject({ repo: 'backend' });
  expect(reportReply('rebuild graph', report())).toMatchObject({ rebuild: true });
  expect(reportReply('execute shell and deploy', report())).toEqual({ text: 'This panel cannot execute operations or change authority.' });
  expect(reportReply('quality', report()).text).toContain('not supplied');
});
