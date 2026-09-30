/** @jest-environment node */
import { GET } from './route';
import { getWorkspaceAccess } from '@/lib/workspaceAccessServer';
import { workspaceAccessFor } from '@/lib/workspaceAccess';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/workspaceAccessServer', () => ({ ...jest.requireActual('@/lib/workspaceAccessServer'), getWorkspaceAccess: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it.each([['signed_out', 401], ['denied', 403], ['unconfigured', 503]] as const)('returns a private closed failure for %s', async (status, code) => {
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status });
  const response = await GET();
  expect(response.status).toBe(code);
  expect(response.headers.get('Cache-Control')).toContain('private, no-store');
  expect(response.headers.get('Vary')).toBe('Cookie');
  expect(await response.json()).toEqual({ error: expect.any(String) });
});

it('returns only the verified current caller access contract', async () => {
  const access = workspaceAccessFor('verified-user', 'owner');
  jest.mocked(getWorkspaceAccess).mockResolvedValue({ status: 'authenticated', access });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ access });
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});
