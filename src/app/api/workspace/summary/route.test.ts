/** @jest-environment node */
import { GET } from './route';
import { getWorkspaceAccess } from '@/lib/workspaceAccessServer';
import { workspaceAccessFor, type WorkspaceRole } from '@/lib/workspaceAccess';
import { readObservatoryReport } from '@/lib/observatoryServer';
import { observatoryPreview } from '@/lib/observatoryPreview';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/workspaceAccessServer', () => ({ ...jest.requireActual('@/lib/workspaceAccessServer'), getWorkspaceAccess: jest.fn() }));
jest.mock('@/lib/observatoryServer', () => ({ readObservatoryReport: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it.each<WorkspaceRole>(['consumer', 'developer'])('denies %s before reading any owner report', async role => {
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status: 'authenticated', access: workspaceAccessFor('u', role) });
  const response = await GET();
  expect(response.status).toBe(403);
  expect(readObservatoryReport).not.toHaveBeenCalled();
});

it.each(['signed_out', 'denied', 'unconfigured'] as const)('denies %s before data access', async status => {
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status });
  expect((await GET()).status).not.toBe(200);
  expect(readObservatoryReport).not.toHaveBeenCalled();
});

it.each<WorkspaceRole>(['stakeholder', 'admin', 'owner'])('gives %s only a sanitized summary', async role => {
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status: 'authenticated', access: workspaceAccessFor('u', role) });
  const source = { ...observatoryPreview(), synthetic: false };
  source.repositories[0].label = '/Users/private/secret';
  jest.mocked(readObservatoryReport).mockResolvedValue(source);
  const response = await GET();
  const data = await response.json();
  expect(response.status).toBe(200);
  expect(data.summary.available).toBe(true);
  expect(data.summary.counts.capabilities).toBe(48);
  expect(JSON.stringify(data)).not.toMatch(/\/Users\/|secret|sourceCommit|graphs|userId/);
  expect(response.headers.get('Cache-Control')).toContain('private, no-store');
});

it('turns a source failure into explicit unavailable status without leaking raw errors', async () => {
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status: 'authenticated', access: workspaceAccessFor('u', 'stakeholder') });
  jest.mocked(readObservatoryReport).mockRejectedValue(new Error('private file /Users/owner/key'));
  const response = await GET();
  const data = await response.json();
  expect(data.summary).toMatchObject({ available: false, counts: null, observedAt: null });
  expect(JSON.stringify(data)).not.toMatch(/private|\/Users\//);
});
