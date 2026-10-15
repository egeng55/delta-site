/** @jest-environment node */
import { accountAdmission } from './accountAdmission';
import { conversationProxy } from './conversationProxyServer';
import { createClient } from '@supabase/supabase-js';
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
const environment = process.env;
const uid = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  process.env = { ...environment, NEXT_PUBLIC_DELTA_API_URL: 'https://backend.invalid', NEXT_PUBLIC_SUPABASE_URL: 'https://auth.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-fixture' };
  jest.mocked(createClient).mockReturnValue({ auth: { getUser: async () => ({ data: { user: { id: uid, email_confirmed_at: '2026-01-01' } }, error: null }) } } as never);
});
afterEach(() => { process.env = environment; jest.restoreAllMocks(); });
test.each([401, 403, 500])('admission fails closed for %s', async status => {
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status }));
  expect(await accountAdmission('fixture', uid)).toBe(status === 500 ? 'unavailable' : 'denied');
});
test('admission rejects a different validated identity', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue(Response.json({ status: 'valid', user: { user_id: 'other' } }));
  expect(await accountAdmission('fixture', uid)).toBe('denied');
});
test('conversation proxy binds the verified user, strips caller fields and caps pagination', async () => {
  const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(Response.json({ id: uid }));
  const response = await conversationProxy(new Request('http://localhost/api/conversations?offset=100000', { method: 'POST', headers: { Authorization: 'Bearer fixture' }, body: JSON.stringify({ id: uid, title: 'Private title', user_id: 'other' }) }));
  expect(response.status).toBe(200);
  expect(fetch).toHaveBeenCalledWith(`https://backend.invalid/conversations/${uid}?limit=50&offset=10000`, expect.objectContaining({ body: JSON.stringify({ id: uid, title: 'Private title' }), redirect: 'error' }));
  expect(response.headers.get('cache-control')).toContain('no-store');
});
test.each(['null', '[]', '{', '"text"'])('rejects malformed conversation input without forwarding', async body => {
  const fetch = jest.spyOn(global, 'fetch');
  expect((await conversationProxy(new Request('http://localhost/api/conversations', { method: 'POST', headers: { Authorization: 'Bearer fixture' }, body }))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
test('upstream details never enter a failure response', async () => {
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('private-secret'));
  const response = await conversationProxy(new Request('http://localhost/api/conversations', { headers: { Authorization: 'Bearer fixture' } }));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private-secret');
});
