import 'server-only';
// Process-local duplicate protection. Retain ambiguous outcomes; never automatically replay.
export type TaskProgress = { type: 'progress'; stage: string };
const requests = new Map<string, { input: string; result: Promise<TaskResult>; events: TaskProgress[]; listeners: Set<(event: TaskProgress) => void> }>();
export type TaskResult = { state: string; message: string; verification: 'passed' | 'failed' | 'unknown'; session: string | null };
export function runWorkspaceAudit(requestId: string, input: string, onProgress?: (event: TaskProgress) => void): Promise<TaskResult> {
 const prior=requests.get(requestId);
 if(prior) { if(prior.input!==input) throw new Error('request_conflict'); if(onProgress) { prior.events.forEach(event => onProgress(event)); prior.listeners.add(onProgress); } return prior.result.finally(()=>{if(onProgress)prior.listeners.delete(onProgress);}); }
 const port=process.env.DELTA_HQ_RUNTIME_PORT, token=process.env.DELTA_HQ_RUNTIME_TOKEN;
 if(!port || !/^\d{1,5}$/.test(port) || Number(port)<1 || Number(port)>65535 || !token || !/^[a-f0-9]{64}$/.test(token)) throw new Error('runtime_unconfigured');
 if(requests.size>=100) throw new Error('request_capacity');
 const events: TaskProgress[]=[];const listeners=new Set<(event: TaskProgress)=>void>();if(onProgress)listeners.add(onProgress);
 const publish=(stage:string)=>{const event:TaskProgress={type:'progress',stage};if(events.length<100)events.push(event);for(const listener of listeners) {try{listener(event);}catch{listeners.delete(listener);}}};
 const result=(async ():Promise<TaskResult> => {
  try {
   const response=await fetch(`http://127.0.0.1:${Number(port)}/v1/commands`, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/x-ndjson'}, body:JSON.stringify({input,capability_id:'agent.capability.audit',tool_arguments:{}}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(30000)});
   if(!response.ok || !response.body) throw new Error('upstream_failed');
   const reader=response.body.getReader();let size=0;let buffer='';let report: Record<string, unknown> | null=null;const decoder=new TextDecoder();
   const stages:Record<string,string>={instruction_received:'Request received',reasoning_started:'Routing request',governance_decision:'Governance checked',tool_started:'Tool running',tool_completed:'Tool completed',verification_completed:'Verification completed',owner_approval_requested:'Waiting for owner approval',approval_required:'Approval required'};
   function line(raw:string){if(!raw.trim())return;const event=JSON.parse(raw);if(event.type==='result')report=event.data;else if(stages[event.type])publish(stages[event.type]);}
   try { for(;;) {const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1_000_000)throw new Error('too_large');buffer+=decoder.decode(value,{stream:true});let cut;while((cut=buffer.indexOf('\n'))>=0){line(buffer.slice(0,cut));buffer=buffer.slice(cut+1);}}buffer+=decoder.decode();line(buffer); } finally {await reader.cancel().catch(()=>undefined);}
   if(!report)throw new Error('missing_result');
   const final = report as {status?:unknown;final_message?:unknown;verification?:{ok?:boolean};session_id?:unknown};
   if(typeof final.status!=='string' || typeof final.final_message!=='string') throw new Error('invalid_result');
   return {state:final.status,message:final.final_message.slice(0,4000),verification:final.verification?.ok===true?'passed':final.verification?.ok===false?'failed':'unknown',session:typeof final.session_id==='string'?final.session_id:null};
  } catch { return {state:'outcome_unknown',message:'The request outcome could not be confirmed. Inspect runtime history before starting another request.',verification:'unknown',session:null}; }
 })();requests.set(requestId,{input,result,events,listeners});return result.finally(()=>listeners.clear());
}
