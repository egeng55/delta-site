import {NextResponse} from 'next/server';
import {requireObservatoryOwner} from '@/lib/observatoryServer';
import {workspaceLifecycle,lifecycleOperations,type LifecycleOperation} from '@/lib/workspaceLifecycle';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store',Vary:'Cookie'};
async function handle(request:Request,context:{params:Promise<{operation:string}>}) {
 const owner=await requireObservatoryOwner();
 if(owner!=='owner')return NextResponse.json({error:'owner_access_required'},{status:owner==='unconfigured'?503:owner==='signed_out'?401:403,headers});
 const {operation}=await context.params;const method=request.method as 'GET'|'POST';
 if(!lifecycleOperations.includes(operation as LifecycleOperation)||!(method==='GET'?['tasks','requests','approvals','review','session']:['tasks','control','decision','session']).includes(operation))return NextResponse.json({error:'not_found'},{status:404,headers});
 const url=new URL(request.url),id=url.searchParams.get('id');
 if((id&&!/^[a-f0-9-]{36}$/.test(id))||[...url.searchParams.keys()].some(k=>k!=='id'))return NextResponse.json({error:'invalid_request'},{status:400,headers});
 if(method==='POST'&&request.headers.get('origin')!==url.origin)return NextResponse.json({error:'same_origin_required'},{status:403,headers});
 try{
  let body:unknown;
  if(method==='POST'){
   const reader=request.body?.getReader();if(!reader)throw Error('invalid_request');const chunks:Uint8Array[]=[];let size=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000)throw Error('invalid_request');chunks.push(value);}}finally{await reader.cancel().catch(()=>undefined);}
   body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  const result=await workspaceLifecycle(operation as LifecycleOperation,method,id,body);return NextResponse.json(result.data,{status:result.status,headers});
 }catch(error){const code=error instanceof Error?error.message:'';return NextResponse.json({error:code==='invalid_request'?'invalid_request':code==='runtime_unconfigured'?code:'runtime_unavailable',message:'Refresh retained history before retrying an uncertain submission.'},{status:code==='invalid_request'?400:503,headers});}
}
export const GET=handle;
export const POST=handle;
