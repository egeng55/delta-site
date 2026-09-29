import {NextResponse} from 'next/server';
import {requireObservatoryOwner} from '@/lib/observatoryServer';
import {readOperations} from '@/lib/operationsServer';
export const dynamic='force-dynamic';
export async function GET(){const headers={'Cache-Control':'private, no-store',Vary:'Cookie'};const owner=await requireObservatoryOwner();if(owner!=='owner')return NextResponse.json({error:'owner_access_required'},{status:owner==='unconfigured'?503:owner==='signed_out'?401:403,headers});return NextResponse.json(await readOperations(),{headers});}
