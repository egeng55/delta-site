import {NextResponse} from 'next/server';
import {requireObservatoryOwner} from '@/lib/observatoryServer';
export const dynamic='force-dynamic';
export async function GET(){
 const headers={'Cache-Control':'private, no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff'};
 const owner=await requireObservatoryOwner();
 if(owner!=='owner')return NextResponse.json({error:'owner_access_required'},{status:owner==='unconfigured'?503:owner==='signed_out'?401:403,headers});
 const {default:archive}=await import('@/lib/historianArchive.json');
 return NextResponse.json(archive,{headers});
}
