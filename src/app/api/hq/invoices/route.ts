import {NextRequest,NextResponse} from 'next/server';
import {observationClient} from '@/lib/hostedObservationServer';
import {parseInvoice} from '@/lib/providerInvoices';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff'};
export async function GET(){
 const auth=await observationClient();if(!auth)return NextResponse.json({error:'owner_access_required'},{status:403,headers});
 const {data,error}=await auth.client.from('hq_provider_invoices').select('document,imported_at').eq('owner_id',auth.owner).order('imported_at',{ascending:false}).limit(50);
 if(error)return NextResponse.json({error:'invoice_storage_unavailable'},{status:503,headers});
 try{return NextResponse.json({source:'owner_imported',verifiedByProvider:false,limit:50,invoices:(data??[]).map(row=>({invoice:parseInvoice(row.document),importedAt:row.imported_at}))},{headers});}catch{return NextResponse.json({error:'invalid_stored_invoice'},{status:503,headers});}
}
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)return NextResponse.json({error:'same_origin_required'},{status:403,headers});
 const auth=await observationClient();if(!auth)return NextResponse.json({error:'owner_access_required'},{status:403,headers});
 try{
  if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>8000)return NextResponse.json({error:'invalid_invoice_body'},{status:413,headers});
  const reader=request.body?.getReader();if(!reader)throw Error();let size=0;const chunks:Uint8Array[]=[];
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000)throw Error();chunks.push(value);}}finally{await reader.cancel().catch(()=>undefined);}
  const invoice=parseInvoice(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  const {error}=await auth.client.from('hq_provider_invoices').insert({owner_id:auth.owner,provider:invoice.provider,invoice_id:invoice.invoiceId,document:invoice});
  if(error)return NextResponse.json({error:error.code==='23505'?'invoice_already_imported':'invoice_storage_unavailable'},{status:error.code==='23505'?409:503,headers});
  return NextResponse.json({imported:true,source:'owner_imported',verifiedByProvider:false},{status:201,headers});
 }catch{return NextResponse.json({error:'invalid_invoice_document'},{status:400,headers});}
}
