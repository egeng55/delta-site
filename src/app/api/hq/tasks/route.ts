import { NextResponse } from 'next/server';
import { requireObservatoryOwner } from '@/lib/observatoryServer';
import { runWorkspaceAudit } from '@/lib/workspaceTasks';
export const dynamic='force-dynamic';
export async function POST(request: Request) {
 const headers={'Cache-Control':'private, no-store','Vary':'Cookie'};
 const owner=await requireObservatoryOwner();
 if(owner!=='owner')return NextResponse.json({error:'owner_access_required'},{status:owner==='unconfigured'?503:owner==='signed_out'?401:403,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'same_origin_required'},{status:403,headers});
 try {
  const reader=request.body?.getReader(); if(!reader)throw Error();let size=0;const chunks:Uint8Array[]=[];
  try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000)throw Error();chunks.push(value);}}finally{await reader.cancel().catch(()=>undefined);}
  const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!body || Object.keys(body).some(k=>!['requestId','input'].includes(k)) || !/^[a-f0-9-]{36}$/.test(body.requestId) || typeof body.input!=='string' || !body.input.trim() || body.input.length>4000)throw Error();
  if(request.headers.get('accept')?.includes('application/x-ndjson')) {
   const encoder=new TextEncoder();let detached=false;
   const stream=new ReadableStream({start(controller){
    const send=(value:unknown)=>{if(!detached)try{controller.enqueue(encoder.encode(JSON.stringify(value)+'\n'));}catch{detached=true;}};
    void (async()=>{try{send({type:'progress',stage:'Submitting audit'});const result=await runWorkspaceAudit(body.requestId,body.input.trim(),send);send({type:'result',data:result});}catch{send({type:'error',message:'Request unavailable. Inspect runtime history before retrying.'});}finally{if(!detached)controller.close();}})();
   },cancel(){detached=true;}});
   return new Response(stream,{headers:{...headers,'Content-Type':'application/x-ndjson','X-Content-Type-Options':'nosniff'}});
  }
  const result=await runWorkspaceAudit(body.requestId,body.input.trim());return NextResponse.json(result,{headers});
 }catch(error){const code=error instanceof Error?error.message:'';return NextResponse.json({error:['runtime_unconfigured','request_capacity','request_conflict'].includes(code)?code:'invalid_request'},{status:code==='runtime_unconfigured'?503:code==='request_capacity'?429:code==='request_conflict'?409:400,headers});}
}
