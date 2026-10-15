/** @jest-environment node */
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { proxy as middleware } from './src/proxy';
import { accountAdmission } from './src/lib/accountAdmission';
jest.mock('./src/lib/accountAdmission', () => ({ accountAdmission: jest.fn() }));

jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));

const createClient = jest.mocked(createServerClient);
const originalEnvironment = process.env;

beforeEach(() => {
  process.env = { ...originalEnvironment };
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://auth.example.invalid';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key';
  delete process.env.DELTA_HQ_OWNER_USER_ID;
  createClient.mockReset();
  jest.mocked(accountAdmission).mockResolvedValue('approved');
});
afterEach(() => { process.env = originalEnvironment; });

function refreshCookies(user: { id: string } | null) {
  createClient.mockImplementation((_url, _key, options) => ({
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'fixture' } } }),
      getUser: async () => {
        // A session may span multiple cookies; every chunk must survive.
        options.cookies.setAll?.([
          { name: 'session.0', value: 'first', options: { httpOnly: true } },
          { name: 'session.1', value: 'second', options: { httpOnly: true } },
        ]);
        return { data: { user: user ? { ...user, email_confirmed_at: '2026-01-01' } : null }, error: null };
      },
    },
  } as ReturnType<typeof createServerClient>));
}

test('all refreshed session cookies survive a protected page response', async () => {
  refreshCookies({ id: 'fixture-owner' });
  const response = await middleware(new NextRequest('https://delta.example.invalid/command'));
  expect(response.status).toBe(200);
  expect(response.cookies.get('session.0')?.value).toBe('first');
  expect(response.cookies.get('session.1')?.value).toBe('second');
});

test.each(['denied', 'unavailable'] as const)('blocks %s admission on private routes', async admission => {
  refreshCookies({ id: 'fixture-owner' });
  jest.mocked(accountAdmission).mockResolvedValue(admission);
  const response = await middleware(new NextRequest('https://delta.example.invalid/app'));
  expect(response.status).toBe(admission === 'denied' ? 403 : 503);
});

test('auth redirects preserve refreshed cookies', async () => {
  refreshCookies({ id: 'fixture-owner' });
  const response = await middleware(new NextRequest('https://delta.example.invalid/login'));
  expect(response.headers.get('location')).toBe('https://delta.example.invalid/app');
  expect(response.cookies.get('session.0')?.value).toBe('first');
  expect(response.cookies.get('session.1')?.value).toBe('second');
});
test('owner sign-in defaults to HQ and preserves an explicit safe destination', async () => {
  process.env.DELTA_HQ_OWNER_USER_ID = 'fixture-owner';
  refreshCookies({ id: 'fixture-owner' });
  expect((await middleware(new NextRequest('https://delta.example.invalid/login'))).headers.get('location')).toBe('https://delta.example.invalid/hq');
  expect((await middleware(new NextRequest('https://delta.example.invalid/login?redirect=%2Fhq%23architecture'))).headers.get('location')).toBe('https://delta.example.invalid/hq#architecture');
  delete process.env.DELTA_HQ_OWNER_USER_ID;
});

test('an unauthenticated command request redirects to login', async () => {
  refreshCookies(null);
  const response = await middleware(new NextRequest('https://delta.example.invalid/command'));
  expect(response.headers.get('location')).toBe('https://delta.example.invalid/login?redirect=%2Fcommand');
});

test.each(['/workspace-preview?role=owner', '/workspace-preview?role=admin', '/workspace-preview/nested'])('production preview %s returns 404 before consulting authentication', async path => {
  process.env = { ...process.env, NODE_ENV: 'production' };
  const response = await middleware(new NextRequest(`https://delta.example.invalid${path}`));
  expect(response.status).toBe(404);
  expect(await response.text()).toBe('Not found');
  expect(createClient).not.toHaveBeenCalled();
});

test('development preview skips private authentication even when auth is configured', async () => {
  process.env = { ...process.env, NODE_ENV: 'development' };
  const response = await middleware(new NextRequest('http://127.0.0.1:3000/workspace-preview?role=owner'));
  expect(response.status).toBe(200);
  expect(createClient).not.toHaveBeenCalled();
  expect(response.cookies.getAll()).toEqual([]);
});

test('an unauthenticated workspace redirects to its own sign-in destination', async () => {
  refreshCookies(null);
  const response = await middleware(new NextRequest('https://delta.example.invalid/workspace'));
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('https://delta.example.invalid/login?redirect=%2Fworkspace');
  expect(response.cookies.get('session.0')?.value).toBe('first');
  expect(response.cookies.get('session.1')?.value).toBe('second');
});

test('workspace fails closed when authentication is not configured', async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  const response = await middleware(new NextRequest('https://delta.example.invalid/workspace'));
  expect(response.status).toBe(503);
  expect(createClient).not.toHaveBeenCalled();
});
