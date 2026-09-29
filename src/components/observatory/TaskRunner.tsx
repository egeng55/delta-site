'use client';
import { useRef,useState } from 'react';
import type { TaskResult } from '@/lib/workspaceTasks';
export default function TaskRunner({input,preview}:{input:string;preview:boolean}) {
 const lock=useRef(false);const [busy,setBusy]=useState(false);const [result,setResult]=useState<TaskResult|null>(null);const [notice,setNotice]=useState('');const [events,setEvents]=useState<string[]>([]);const request=useRef<{id:string;input:string}|null>(null);
 async function run(){if(lock.current||!input.trim()||preview)return;lock.current=true;setBusy(true);setResult(null);setEvents([]);setNotice('Submitted read-only capability audit. Waiting for runtime verification…');
 if(!request.current || request.current.input!==input)request.current={id:crypto.randomUUID(),input};
 try{const response=await fetch('/api/hq/tasks',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify({requestId:request.current.id,input}),signal:AbortSignal.timeout(35000)});
 if(!response.ok||!response.body){setNotice(response.status===503?'Runtime connection unavailable.':response.status===401||response.status===403?'Owner session required.':'Request rejected. Check runtime history before retrying.');return;}
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',size=0,confirmed=false;
 function line(raw:string){if(!raw.trim())return;const event=JSON.parse(raw);if(event.type==='progress'&&typeof event.stage==='string')setEvents(old=>[...old,event.stage].slice(-100));if(event.type==='error')throw new Error('stream_error');if(event.type==='result'){setResult(event.data as TaskResult);confirmed=true;}}
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1_000_000)throw new Error('too_large');buffer+=decoder.decode(value,{stream:true});let cut;while((cut=buffer.indexOf('\n'))>=0){line(buffer.slice(0,cut));buffer=buffer.slice(cut+1);}}buffer+=decoder.decode();line(buffer);}finally{await reader.cancel().catch(()=>undefined);}
 if(!confirmed)throw new Error('missing_result');setNotice('Runtime response received.');
 }catch{setNotice('Outcome unknown. Inspect runtime history before submitting again.');}finally{setBusy(false);lock.current=false;}}
 return <section aria-label="Bounded task execution"><p>First connected workflow: read-only capability audit. Your text provides context; this action only audits registered capabilities. No edits or model calls.</p><button disabled={preview||busy||!input.trim()} onClick={run}>{preview?'Execution connection pending':busy?'Audit running…':'Run capability audit'}</button><p role="status">{notice}</p><ol aria-label="Task progress">{events.map((event,index)=><li key={index}>{event}</li>)}</ol>{result&&<article><h3>Result · {result.state}</h3><p>{result.message}</p><p>Verification: {result.verification}</p>{result.session&&<p>Runtime session: <code>{result.session}</code></p>}</article>}<p>Approval decisions and engineering continuation are not enabled in this workflow. Duplicate protection lasts for this site-server process.</p></section>;
}
