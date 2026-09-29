import 'server-only';
// Process-local duplicate protection. Retain ambiguous outcomes; never automatically replay.
const requests = new Map<string, { input: string; result: Promise<TaskResult> }>();
export type TaskResult = { state: string; message: string; verification: 'passed' | 'failed' | 'unknown'; session: string | null };
export function runWorkspaceAudit(requestId: string, input: string): Promise<TaskResult> {
 const prior=requests.get(requestId);
 if(prior) { if(prior.input!==input) throw new Error('request_conflict'); return prior.result; }
 const port=process.env.DELTA_HQ_RUNTIME_PORT, token=process.env.DELTA_HQ_RUNTIME_TOKEN;
 if(!port || !/^\d{1,5}$/.test(port) || Number(port)<1 || Number(port)>65535 || !token || !/^[a-f0-9]{64}$/.test(token)) throw new Error('runtime_unconfigured');
 if(requests.size>=100) throw new Error('request_capacity');
 const result=(async ():Promise<TaskResult> => {
  try {
   const response=await fetch(`http://127.0.0.1:${Number(port)}/v1/commands`, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'}, body:JSON.stringify({input,capability_id:'agent.capability.audit',tool_arguments:{}}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(30000)});
   if(!response.ok || !response.body) throw new Error('upstream_failed');
   const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
   try { for(;;) {const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1_000_000)throw new Error('too_large');chunks.push(value);} } finally {await reader.cancel().catch(()=>undefined);}
   const report=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(typeof report.status!=='string' || typeof report.final_message!=='string') throw new Error('invalid_result');
   return {state:report.status,message:report.final_message.slice(0,4000),verification:report.verification?.ok===true?'passed':report.verification?.ok===false?'failed':'unknown',session:typeof report.session_id==='string'?report.session_id:null};
  } catch { return {state:'outcome_unknown',message:'The request outcome could not be confirmed. Inspect runtime history before starting another request.',verification:'unknown',session:null}; }
 })();requests.set(requestId,{input,result});return result;
}
