import 'server-only';
import {execFile} from 'node:child_process';
import path from 'node:path';
export type Operations={observedAt:string;backend:{state:string;latencyMs:number;revision:string|null};spending:{state:string;day:string|null;dailyReserved:number|null;monthlyReserved:number|null;dailyCap:number|null;monthlyCap:number|null}};
const emptySpending:Operations['spending']={state:'unavailable',day:null,dailyReserved:null,monthlyReserved:null,dailyCap:null,monthlyCap:null};
const money=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v/1000000:null;
let cached:{until:number;promise:Promise<Operations>}|null=null;
export function readOperations():Promise<Operations>{
 if(cached&&cached.until>Date.now())return cached.promise;
 const promise=(async()=>{
 const start=Date.now();const workspace=process.env.DELTA_HQ_LOCAL_WORKSPACE;
 const backendPromise=(async()=>{try{const r=await fetch('http://127.0.0.1:8000/health',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(2500)});const text=await r.text();if(text.length>16000)throw Error();const body=JSON.parse(text);return {state:r.ok&&body.status==='ok'&&body.service==='delta-backend'?'healthy':'unavailable',latencyMs:Date.now()-start,revision:/^[a-f0-9]{40}$/.test(body.revision?.commit)?body.revision.commit:null};}catch{return {state:'unavailable',latencyMs:Date.now()-start,revision:null};}})();
 const spendPromise=new Promise<Operations['spending']>(resolve=>{
 if(!workspace||!path.isAbsolute(workspace)){resolve(emptySpending);return;}
 const root=path.join(workspace,'delta-backend');
 execFile(path.join(root,'.venv/bin/python'),[path.join(root,'scripts/provider_spend_status.py')],{timeout:4000,maxBuffer:16000,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:process.env.PATH,HOME:process.env.HOME}},(error,stdout)=>{try{if(error)throw error;const s=JSON.parse(stdout);if(s.version!==1||s.source!=='backend_reservations')throw Error();resolve({state:s.state==='available'?'available':'unavailable',day:typeof s.day==='string'?s.day:null,dailyReserved:money(s.daily_reserved_micro),monthlyReserved:money(s.monthly_reserved_micro),dailyCap:money(s.daily_cap_micro),monthlyCap:money(s.monthly_cap_micro)});}catch{resolve(emptySpending);}});
 });
 const [backend,spending]=await Promise.all([backendPromise,spendPromise]);return {observedAt:new Date().toISOString(),backend,spending};})();
 cached={until:Date.now()+10000,promise};return promise;
}
