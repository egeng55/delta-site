import {NextRequest,NextResponse} from 'next/server';
import {observationClient} from '@/lib/hostedObservationServer';
import {validateReport} from '@/lib/observatory-contract.cjs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const headers={'Cache-Control':'private, no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff'};
 const auth=await observationClient();if(!auth)return NextResponse.json({error:'owner_access_required'},{status:403,headers});
 const id=request.nextUrl.searchParams.get('revision');
 if(id&&!/^[a-f0-9]{64}$/.test(id))return NextResponse.json({error:'invalid_revision'},{status:400,headers});
 if(id){const {data,error}=await auth.client.from('hq_graph_revisions').select('report,observed_at,digest').eq('owner_id',auth.owner).eq('digest',id).maybeSingle();
  if(error)return NextResponse.json({error:'revision_storage_unavailable'},{status:503,headers});
  if(!data)return NextResponse.json({error:'revision_not_retained'},{status:404,headers});
  try{return NextResponse.json({digest:data.digest,observedAt:data.observed_at,report:validateReport(data.report)},{headers});}catch{return NextResponse.json({error:'invalid_revision'},{status:503,headers});}
 }
 const {data,error}=await auth.client.from('hq_graph_revisions').select('digest,observed_at,source_revision').eq('owner_id',auth.owner).order('observed_at',{ascending:false}).limit(100);
 return NextResponse.json(error?{error:'revision_storage_unavailable'}:{revisions:data,retention:100},{status:error?503:200,headers});
}
