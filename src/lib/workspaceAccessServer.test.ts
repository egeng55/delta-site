/** @jest-environment node */
import { createServerClient } from '@supabase/ssr';
import { getWorkspaceAccess } from './workspaceAccessServer';

jest.mock('server-only', () => ({}), { virtual: true });
const mockSetCookie = jest.fn();
jest.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => [], set: mockSetCookie }) }));
jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
const original = process.env;
const owner = '12345678-1234-1234-1234-123456789012';
const member = 'abcdef12-1234-1234-1234-123456789012';

function verifiedUser(user: unknown) {
  jest.mocked(createServerClient).mockReturnValue({ auth: { getUser: async () => ({ data: { user }, error: null }) } } as never);
}

beforeEach(() => {
  process.env = { ...original, DELTA_HQ_OWNER_USER_ID: owner, NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture' };
  delete process.env.DELTA_WORKSPACE_GRANTS;
  jest.clearAllMocks();
});
afterEach(() => { process.env = original; });

it('binds the sole owner to the server-verified ID', async () => {
  verifiedUser({ id: owner, email_confirmed_at: '2026-01-01' });
  expect(await getWorkspaceAccess()).toMatchObject({ status: 'authenticated', access: { userId: owner, role: 'owner', permissions: expect.arrayContaining(['runtime.execute']) } });
});

it('ignores email, profile role and user-controlled metadata when assigning permissions', async () => {
  verifiedUser({ id: member, email: 'owner@example.test', role: 'admin', user_metadata: { role: 'owner', permissions: ['runtime.execute'] }, app_metadata: { role: 'admin' }, email_confirmed_at: '2026-01-01' });
  expect(await getWorkspaceAccess()).toEqual({ status: 'authenticated', access: { userId: member, role: 'consumer', workspaces: ['personal'], permissions: ['personal.read'] } });
});

it.each(['developer', 'stakeholder', 'admin', 'consumer'])('uses only the explicit server grant for %s', async role => {
  process.env.DELTA_WORKSPACE_GRANTS = JSON.stringify({ [member]: role });
  verifiedUser({ id: member, email_confirmed_at: '2026-01-01' });
  const result = await getWorkspaceAccess();
  expect(result).toMatchObject({ status: 'authenticated', access: { role } });
  if (result.status === 'authenticated') expect(result.access.permissions).not.toContain('runtime.execute');
});

it('applies grant revocation on the next request without a stale authorization cache', async () => {
  process.env.DELTA_WORKSPACE_GRANTS = JSON.stringify({ [member]: 'admin' });
  verifiedUser({ id: member, email_confirmed_at: '2026-01-01' });
  expect(await getWorkspaceAccess()).toMatchObject({ access: { role: 'admin' } });
  process.env.DELTA_WORKSPACE_GRANTS = '{}';
  expect(await getWorkspaceAccess()).toMatchObject({ access: { role: 'consumer', workspaces: ['personal'] } });
  expect(createServerClient).toHaveBeenCalledTimes(2);
});

it.each([
  [null, 'signed_out'],
  [{ id: member, is_anonymous: true, email_confirmed_at: '2026-01-01' }, 'denied'],
  [{ id: member }, 'denied'],
  [{ id: 'invalid', email_confirmed_at: '2026-01-01' }, 'denied'],
])('requires a verified nonanonymous confirmed identity', async (user, status) => {
  verifiedUser(user);
  expect(await getWorkspaceAccess()).toEqual({ status });
});

it.each(['not json', '[]', 'null', JSON.stringify({ [member]: 'owner' }), JSON.stringify({ [member]: 'root' }), JSON.stringify({ 'not-a-user-id': 'admin' }), 'x'.repeat(64_001)])('fails closed on malformed or overprivileged grants', async raw => {
  process.env.DELTA_WORKSPACE_GRANTS = raw;
  expect(await getWorkspaceAccess()).toEqual({ status: 'unconfigured' });
  expect(createServerClient).not.toHaveBeenCalled();
});

it('requires a configured owner identity before exposing a role-based workspace', async () => {
  delete process.env.DELTA_HQ_OWNER_USER_ID;
  expect(await getWorkspaceAccess()).toEqual({ status: 'unconfigured' });
  expect(createServerClient).not.toHaveBeenCalled();
});

it('returns a closed error when authentication throws', async () => {
  jest.mocked(createServerClient).mockReturnValue({ auth: { getUser: async () => { throw new Error('private token detail'); } } } as never);
  expect(await getWorkspaceAccess()).toEqual({ status: 'denied' });
});

it('propagates refreshed auth cookies and forces private bounded auth fetches', async () => {
  jest.mocked(createServerClient).mockImplementation((_url, _key, options) => ({ auth: { getUser: async () => {
    options.cookies.setAll?.([{ name: 'session.0', value: 'fresh', options: { httpOnly: true } }]);
    return { data: { user: { id: member, email_confirmed_at: '2026-01-01' } }, error: null };
  } } }) as never);
  expect(await getWorkspaceAccess()).toMatchObject({ status: 'authenticated' });
  expect(mockSetCookie).toHaveBeenCalledWith('session.0', 'fresh', { httpOnly: true });
  const options = jest.mocked(createServerClient).mock.calls[0][2];
  const mockFetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
  try {
    await options.global?.fetch?.('https://fixture.invalid/auth/v1/user', { cache: 'force-cache' });
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }));
  } finally { mockFetch.mockRestore(); }
});
