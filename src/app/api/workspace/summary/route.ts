import { NextResponse } from 'next/server';
import { getWorkspaceAccess, workspaceAccessFailure, workspacePrivateHeaders } from '@/lib/workspaceAccessServer';
import { hasWorkspacePermission } from '@/lib/workspaceAccess';
import { readObservatoryReport } from '@/lib/observatoryServer';
import { summarizeWorkspace } from '@/lib/workspaceSummary';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getWorkspaceAccess();
  if (result.status !== 'authenticated') {
    const failure = workspaceAccessFailure(result.status);
    return NextResponse.json({ error: failure.error }, { status: failure.status, headers: workspacePrivateHeaders });
  }
  if (!hasWorkspacePermission(result.access, 'control.summary.read')) {
    return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403, headers: workspacePrivateHeaders });
  }
  // The existing reader preserves its hosted owner gate; unavailable data is never bypassed.
  // Only this closed count/status projection leaves the server for nonowner control viewers.
  try {
    return NextResponse.json({ summary: summarizeWorkspace(await readObservatoryReport()) }, { headers: workspacePrivateHeaders });
  } catch {
    return NextResponse.json({ summary: summarizeWorkspace(null) }, { headers: workspacePrivateHeaders });
  }
}
