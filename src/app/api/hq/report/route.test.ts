/** @jest-environment node */
import { GET } from './route';
import { requireObservatoryOwner, readObservatoryReport } from '@/lib/observatoryServer';
import { observatoryPreview } from '@/lib/observatoryPreview';
jest.mock('@/lib/observatoryServer', () => ({ requireObservatoryOwner: jest.fn(), readObservatoryReport: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it.each([['denied', 403], ['signed_out', 401], ['unconfigured', 503]] as const)('does not read report for %s', async (state, status) => {
  jest.mocked(requireObservatoryOwner).mockResolvedValue(state);
  const result = await GET();
  expect(result.status).toBe(status); expect(readObservatoryReport).not.toHaveBeenCalled();
  expect(result.headers.get('cache-control')).toContain('no-store');
});
it('returns the validated private projection only after owner authorization', async () => {
  jest.mocked(requireObservatoryOwner).mockResolvedValue('owner');
  const report = { ...observatoryPreview(), synthetic: false };
  jest.mocked(readObservatoryReport).mockResolvedValue(report);
  const result = await GET();
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual(report);
  expect(result.headers.get('cache-control')).toContain('private');
  expect(result.headers.get('vary')).toBe('Cookie');
});
it('authorizes before read and never returns unavailable data as an empty healthy report', async () => {
  jest.mocked(requireObservatoryOwner).mockResolvedValue('owner');
  jest.mocked(readObservatoryReport).mockResolvedValue(null);
  const result = await GET(); expect(result.status).toBe(503);
  expect(jest.mocked(requireObservatoryOwner).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(readObservatoryReport).mock.invocationCallOrder[0]);
  expect(await result.json()).toEqual({ error: 'report_unavailable' });
});
