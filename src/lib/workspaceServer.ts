import 'server-only';
import { readObservatoryReport } from './observatoryServer';
import { projectRuntime, type Workspace } from './workspace';

// Fixed server configuration only: never accept a URL or credential from a caller.
export async function readWorkspace(): Promise<Workspace> {
  const result: Workspace = { version: 1, observedAt: new Date().toISOString(), source: await readObservatoryReport(), runtime: null, connection: 'unconfigured', billing: { state: 'unknown', usd: null } };
  const port = process.env.DELTA_HQ_RUNTIME_PORT;
  const token = process.env.DELTA_HQ_RUNTIME_TOKEN;
  if (!port || !token) return result;
  result.connection = 'unavailable';
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535 || !/^[a-f0-9]{64}$/.test(token)) return result;
  try {
    const response = await fetch(`http://127.0.0.1:${Number(port)}/v1/operator/status`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || !response.body) return result;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1_000_000) throw new Error('runtime_too_large');
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => undefined); }
    result.runtime = projectRuntime(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    result.connection = 'connected';
  } catch { /* Keep errors and credentials server-side; missing data is not health. */ }
  return result;
}
