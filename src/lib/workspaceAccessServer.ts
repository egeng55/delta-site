import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { workspaceAccessFor, type WorkspaceAccessResult, type WorkspaceRole } from './workspaceAccess';
import { accountAdmission } from './accountAdmission';

const userIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type GrantedRole = Exclude<WorkspaceRole, 'owner'> | 'revoked';
const grantedRoles = new Set<GrantedRole>(['consumer', 'developer', 'stakeholder', 'admin', 'revoked']);

function readGrants(raw: string | undefined): Map<string, GrantedRole> | null {
  if (raw === undefined || raw.trim() === '') return new Map();
  if (raw.length > 64_000) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed);
    if (entries.length > 1000) return null;
    const grants = new Map<string, GrantedRole>();
    for (const [id, role] of entries) {
      if (!userIdPattern.test(id) || typeof role !== 'string' || !grantedRoles.has(role as GrantedRole)) return null;
      const normalizedId = id.toLowerCase();
      if (grants.has(normalizedId)) return null;
      grants.set(normalizedId, role as GrantedRole);
    }
    return grants;
  } catch { return null; }
}

/** Server-controlled grants are resolved on each request, never from user metadata or client roles. */
export async function getWorkspaceAccess(): Promise<WorkspaceAccessResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ownerId = process.env.DELTA_HQ_OWNER_USER_ID;
  const grants = readGrants(process.env.DELTA_WORKSPACE_GRANTS);
  if (!url || !key || !ownerId || !userIdPattern.test(ownerId) || !grants) return { status: 'unconfigured' };
  try {
    const jar = await cookies();
    const client = createServerClient(url, key, {
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(5000) }),
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: values => {
          // Route handlers propagate refresh cookies. Server Components use the existing session proxy.
          try { for (const { name, value, options } of values) jar.set(name, value, options); } catch { /* read-only cookie jar */ }
        },
      },
    });
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { status: 'signed_out' };
    const user = data.user;
    if (!userIdPattern.test(user.id) || user.is_anonymous || !user.email_confirmed_at) return { status: 'denied' };
    const id = user.id.toLowerCase();
    const granted = grants.get(id);
    if (granted === 'revoked') return { status: 'denied' };
    let role: WorkspaceRole | undefined = id === ownerId.toLowerCase() ? 'owner' : granted;
    if (!role) {
      const { data: sessionData } = await client.auth.getSession();
      if (await accountAdmission(sessionData.session?.access_token || '', user.id) !== 'approved') return { status: 'denied' };
      role = 'consumer';
    }
    return { status: 'authenticated', access: workspaceAccessFor(user.id, role) };
  } catch { return { status: 'denied' }; }
}

export const workspacePrivateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
};

export function workspaceAccessFailure(status: 'signed_out' | 'denied' | 'unconfigured') {
  return {
    status: status === 'signed_out' ? 401 : status === 'unconfigured' ? 503 : 403,
    error: status === 'signed_out' ? 'authentication_required'
      : status === 'unconfigured' ? 'workspace_access_unconfigured' : 'workspace_access_denied',
  };
}
