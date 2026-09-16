/** @jest-environment node */
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { POST } from './route';
jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
beforeEach(() => { jest.resetAllMocks(); process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://auth.invalid'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public'; });
it.each([null, 'https://other.invalid'])('rejects wrong or absent origin before auth %s', async origin => {
  const response = await POST(new NextRequest('https://delta.invalid/api/hq/signout', { method: 'POST', headers: origin ? { origin } : {} }));
  expect(response.status).toBe(403); expect(createServerClient).not.toHaveBeenCalled();
});
it('signs out only the current session and propagates cleared cookies', async () => {
  const signOut = jest.fn(async () => ({ error: null }));
  jest.mocked(createServerClient).mockImplementation((_url, _key, options) => {
    options.cookies.setAll?.([{ name: 'session.0', value: '', options: { maxAge: 0 } }]);
    return { auth: { signOut } } as unknown as ReturnType<typeof createServerClient>;
  });
  const response = await POST(new NextRequest('https://delta.invalid/api/hq/signout', { method: 'POST', headers: { origin: 'https://delta.invalid' } }));
  expect(response.status).toBe(200); expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(response.cookies.get('session.0')?.value).toBe('');
  expect(response.headers.get('cache-control')).toContain('no-store');
});
it('does not claim success when signout fails', async () => {
  jest.mocked(createServerClient).mockReturnValue({ auth: { signOut: async () => ({ error: new Error('private') }) } } as unknown as ReturnType<typeof createServerClient>);
  const response = await POST(new NextRequest('https://delta.invalid/api/hq/signout', { method: 'POST', headers: { origin: 'https://delta.invalid' } }));
  expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: 'signout_unavailable' });
});
it('accepts the served loopback host when Next normalizes its internal URL', async () => {
  const signOut = jest.fn(async () => ({ error: null }));
  jest.mocked(createServerClient).mockReturnValue({ auth: { signOut } } as unknown as ReturnType<typeof createServerClient>);
  const response = await POST(new NextRequest('http://localhost:3112/api/hq/signout', { method: 'POST', headers: { host: '127.0.0.1:3112', origin: 'http://127.0.0.1:3112' } }));
  expect(response.status).toBe(200);
});
it('does not accept forwarded-host as an origin override', async () => {
  const response = await POST(new NextRequest('https://delta.invalid/api/hq/signout', { method: 'POST', headers: { host: 'delta.invalid', origin: 'https://other.invalid', 'x-forwarded-host': 'other.invalid' } }));
  expect(response.status).toBe(403); expect(createServerClient).not.toHaveBeenCalled();
});
