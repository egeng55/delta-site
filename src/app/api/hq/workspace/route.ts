import { NextResponse } from 'next/server';
import { requireObservatoryOwner } from '@/lib/observatoryServer';
import { readWorkspace } from '@/lib/workspaceServer';
export const dynamic = 'force-dynamic';
export async function GET() {
  const owner = await requireObservatoryOwner();
  const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' };
  if (owner !== 'owner') return NextResponse.json({ error: 'owner_access_required' }, { status: owner === 'unconfigured' ? 503 : owner === 'signed_out' ? 401 : 403, headers });
  return NextResponse.json(await readWorkspace(), { headers });
}
