import { NextResponse } from 'next/server';
import { getWorkspaceAccess, workspaceAccessFailure, workspacePrivateHeaders } from '@/lib/workspaceAccessServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getWorkspaceAccess();
  if (result.status !== 'authenticated') {
    const failure = workspaceAccessFailure(result.status);
    return NextResponse.json({ error: failure.error }, { status: failure.status, headers: workspacePrivateHeaders });
  }
  return NextResponse.json({ access: result.access }, { headers: workspacePrivateHeaders });
}
