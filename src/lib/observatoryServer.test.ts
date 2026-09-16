/** @jest-environment node */
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServerClient } from '@supabase/ssr';
import { requireObservatoryOwner, readObservatoryReport } from './observatoryServer';
import { observatoryPreview } from './observatoryPreview';
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => [] }) }));
jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
const original = process.env;
const id = '12345678-1234-1234-1234-123456789012';
beforeEach(() => { process.env = { ...original, DELTA_HQ_OWNER_USER_ID: id, NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture' }; jest.clearAllMocks(); });
afterEach(() => { process.env = original; });
it('fails before auth/data access when owner identity is unconfigured', async () => {
  delete process.env.DELTA_HQ_OWNER_USER_ID;
  expect(await requireObservatoryOwner()).toBe('unconfigured');
  expect(createServerClient).not.toHaveBeenCalled();
});
it.each([
  [{ id, email_confirmed_at: '2026-01-01' }, 'owner'],
  [{ id: 'someone-else', role: 'admin', user_metadata: { owner: true }, email_confirmed_at: '2026-01-01' }, 'denied'],
  [{ id, is_anonymous: true, email_confirmed_at: '2026-01-01' }, 'denied'],
  [{ id }, 'denied'],
  [null, 'signed_out'],
])('requires server-verified exact owner ID and confirmed nonanonymous identity', async (user, expected) => {
  jest.mocked(createServerClient).mockReturnValue({ auth: { getUser: async () => ({ data: { user }, error: null }) } } as never);
  expect(await requireObservatoryOwner()).toBe(expected);
});
it('sanitizes authentication failures', async () => {
  jest.mocked(createServerClient).mockReturnValue({ auth: { getUser: async () => { throw new Error('private bearer token'); } } } as never);
  expect(await requireObservatoryOwner()).toBe('denied');
});
it('reads only configured bounded files and rejects synthetic, symlink and malformed data', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'observatory-test-'));
  try {
    const file = path.join(directory, 'report.json');
    process.env.DELTA_HQ_REPORT_PATH = file;
    await writeFile(file, JSON.stringify({ ...observatoryPreview(), synthetic: false }));
    expect((await readObservatoryReport())?.version).toBe(1);
    await writeFile(file, JSON.stringify(observatoryPreview())); expect(await readObservatoryReport()).toBeNull();
    await writeFile(file, 'private invalid data'); expect(await readObservatoryReport()).toBeNull();
    await writeFile(file, 'x'.repeat(2_000_001)); expect(await readObservatoryReport()).toBeNull();
    await symlink(file, path.join(directory, 'link')); process.env.DELTA_HQ_REPORT_PATH = path.join(directory, 'link'); expect(await readObservatoryReport()).toBeNull();
    process.env.DELTA_HQ_REPORT_PATH = 'relative.json'; expect(await readObservatoryReport()).toBeNull();
  } finally { await rm(directory, { recursive: true }); }
});
