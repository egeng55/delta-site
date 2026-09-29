/** @jest-environment node */
import { readWorkspace } from './workspaceServer';
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('./observatoryServer', () => ({ readObservatoryReport: async () => null }));
const env = process.env, originalFetch = global.fetch;
beforeEach(() => { process.env = { ...env }; delete process.env.DELTA_HQ_RUNTIME_PORT; delete process.env.DELTA_HQ_RUNTIME_TOKEN; global.fetch = jest.fn(); });
afterEach(() => { process.env = env; global.fetch = originalFetch; });
it('does not connect when unconfigured or invalid', async () => {
 expect((await readWorkspace()).connection).toBe('unconfigured'); process.env.DELTA_HQ_RUNTIME_PORT = 'http://evil.test'; process.env.DELTA_HQ_RUNTIME_TOKEN = 'a'.repeat(64);
 expect((await readWorkspace()).connection).toBe('unavailable'); expect(fetch).not.toHaveBeenCalled();
});
it('uses fixed loopback route, forbids redirects and hides failure details', async () => {
 process.env.DELTA_HQ_RUNTIME_PORT = '4318'; process.env.DELTA_HQ_RUNTIME_TOKEN = 'a'.repeat(64);
 jest.mocked(fetch).mockRejectedValue(new Error('secret')); const value = await readWorkspace(); expect(value.connection).toBe('unavailable'); expect(JSON.stringify(value)).not.toContain('secret');
 expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:4318/v1/operator/status', expect.objectContaining({ redirect: 'error', cache: 'no-store' }));
});
it('projects a successful response and drops unrelated fields', async () => {
 process.env.DELTA_HQ_RUNTIME_PORT = '4318'; process.env.DELTA_HQ_RUNTIME_TOKEN = 'a'.repeat(64);
 const payload = { status: 'ok', runtime: 'delta-agent', private_field: 'secret', operational_visibility: { observed_at: new Date().toISOString(), scope: 'this_process_only', records_evicted: 0, commands: [] }, capability_availability: [] };
 jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(payload)));
 const result = await readWorkspace(); expect(result.connection).toBe('connected'); expect(result.runtime?.retained).toBe(0); expect(JSON.stringify(result)).not.toContain('secret');
});
it('rejects oversized responses', async () => {
 process.env.DELTA_HQ_RUNTIME_PORT = '4318'; process.env.DELTA_HQ_RUNTIME_TOKEN = 'a'.repeat(64);
 jest.mocked(fetch).mockResolvedValue(new Response('x'.repeat(1_000_001))); expect((await readWorkspace()).runtime).toBeNull();
});
