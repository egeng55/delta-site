import { NextResponse } from 'next/server';
import { requireObservatoryOwner, readObservatoryReport } from '@/lib/observatoryServer';
export const dynamic = 'force-dynamic';
export async function GET() {
  const owner = await requireObservatoryOwner();
  const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };
  if (owner !== 'owner') return NextResponse.json({ error: 'owner_access_required' }, { status: owner === 'unconfigured' ? 503 : owner === 'signed_out' ? 401 : 403, headers });
  const report = await readObservatoryReport();
  if (!report) return NextResponse.json({ error: 'report_unavailable' }, { status: 503, headers });
  return NextResponse.json(report, { headers });
}
