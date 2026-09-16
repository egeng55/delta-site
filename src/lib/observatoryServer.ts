import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { open } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { validateReport, MAX_BYTES } from './observatory-contract.cjs';
import type { ObservatoryReport } from './observatory';

export async function requireObservatoryOwner(): Promise<'owner' | 'signed_out' | 'denied' | 'unconfigured'> {
  const id = process.env.DELTA_HQ_OWNER_USER_ID;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!id || !/^[a-f0-9-]{36}$/i.test(id) || !url || !key) return 'unconfigured';
  try {
    const jar = await cookies();
    const client = createServerClient(url, key, {
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(5000) }) },
      cookies: { getAll: () => jar.getAll(), setAll: () => {} },
    });
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return 'signed_out';
    return data.user.id === id && !data.user.is_anonymous && Boolean(data.user.email_confirmed_at) ? 'owner' : 'denied';
  } catch { return 'denied'; }
}

export async function readObservatoryReport(): Promise<ObservatoryReport | null> {
  // No worktree discovery, source execution, provider request, or client-selected path.
  const configured = process.env.DELTA_HQ_REPORT_PATH;
  if (!configured || !path.isAbsolute(configured)) return null;
  let file;
  try {
    file = await open(configured, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES) return null;
    const buffer = Buffer.alloc(MAX_BYTES + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    if (bytesRead > MAX_BYTES) return null;
    const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytesRead)));
    return validateReport(parsed) as ObservatoryReport;
  } catch { return null; }
  finally { await file?.close(); }
}
