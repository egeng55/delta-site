import 'server-only';
import {parseCostPage,type ProviderCosts} from './providerCosts';
let cached:{key:string;until:number;promise:Promise<ProviderCosts>}|null=null;
export async function readProviderCosts():Promise<ProviderCosts>{
 const key=process.env.OPENAI_ADMIN_KEY,project=process.env.OPENAI_PROJECT_ID??null;
 const now=new Date(),start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
 const base:ProviderCosts={provider:'openai',state:'unconfigured',scope:project?`project:${project}`:'organization',periodStart:start.toISOString(),periodEnd:now.toISOString(),observedAt:now.toISOString(),usd:null,days:[],invoiceState:'not_connected'};
 if(!key)return base;
 if(project&&!/^proj_[a-zA-Z0-9_-]{1,150}$/.test(project))return {...base,state:'unavailable'};
 const cacheKey=`${key}:${project}:${start.toISOString()}`;
 if(cached?.key===cacheKey&&cached.until>Date.now())return cached.promise;
 const promise=(async()=>{try{
  let cursor:string|null=null;const seen=new Set<string>(),days:ProviderCosts['days']=[];
  const signal=AbortSignal.timeout(6000);
  for(let page=0;page<3;page++){
   const url=new URL('https://api.openai.com/v1/organization/costs');
   url.searchParams.set('start_time',String(start.getTime()/1000));url.searchParams.set('end_time',String(Math.floor(now.getTime()/1000)));url.searchParams.set('limit','31');url.searchParams.append('group_by[]','project_id');
   if(project)url.searchParams.append('project_ids[]',project);if(cursor)url.searchParams.set('page',cursor);
   const r=await fetch(url,{headers:{Authorization:`Bearer ${key}`},cache:'no-store',redirect:'error',signal});
   if(!r.ok||!r.body)throw Error('costs_unavailable');
   const reader=r.body.getReader(),chunks:Uint8Array[]=[];let size=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>500000)throw Error('costs_too_large');chunks.push(value);}}finally{await reader.cancel().catch(()=>undefined);}
   const parsed=parseCostPage(JSON.parse(Buffer.concat(chunks).toString('utf8')),project);
   for(const day of parsed.days){if(day.day<base.periodStart.slice(0,10)||day.day>base.periodEnd.slice(0,10)||days.some(d=>d.day===day.day))throw Error('invalid_period');days.push(day);}
   cursor=parsed.next;if(!cursor)return {...base,state:'available' as const,usd:days.reduce((sum,d)=>sum+d.usd,0),days};
   if(seen.has(cursor))throw Error('repeated_cursor');seen.add(cursor);
  }
  return {...base,state:'incomplete' as const};
 }catch{return {...base,state:'unavailable' as const};}})();
 cached={key:cacheKey,until:Date.now()+300000,promise};return promise;
}
