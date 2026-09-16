/** @jest-environment node */
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { middleware } from './middleware';

jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));

const createClient = jest.mocked(createServerClient);

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://auth.example.invalid';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key';
  createClient.mockReset();
});

function refreshCookies(user: { id: string } | null) {
  createClient.mockImplementation((_url, _key, options) => ({
    auth: {
      getUser: async () => {
        // A session may span multiple cookies; every chunk must survive.
        options.cookies.setAll?.([
          { name: 'session.0', value: 'first', options: { httpOnly: true } },
          { name: 'session.1', value: 'second', options: { httpOnly: true } },
        ]);
        return { data: { user }, error: null };
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

test('auth redirects preserve refreshed cookies', async () => {
  refreshCookies({ id: 'fixture-owner' });
  const response = await middleware(new NextRequest('https://delta.example.invalid/login'));
  expect(response.headers.get('location')).toBe('https://delta.example.invalid/account');
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
