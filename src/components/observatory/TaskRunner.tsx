'use client';
import { useRef,useState } from 'react';
import { requestJson } from '@/lib/requestJson';
import type { TaskResult } from '@/lib/workspaceTasks';
export default function TaskRunner({input,preview}:{input:string;preview:boolean}) {
 const lock=useRef(false);const [busy,setBusy]=useState(false);const [result,setResult]=useState<TaskResult|null>(null);const [notice,setNotice]=useState('');
 async function run(){if(lock.current||!input.trim()||preview)return;lock.current=true;setBusy(true);setResult(null);setNotice('Submitted read-only capability audit. Waiting for runtime verification…');
 try{const response=await requestJson('/api/hq/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),input})},35000);
 if(!response.ok){setNotice(response.status===503?'Runtime connection unavailable.':response.status===401||response.status===403?'Owner session required.':'Request rejected. Check runtime history before retrying.');return;}
 const value=response.data as TaskResult;setResult(value);setNotice('Runtime response received.');
 }catch{setNotice('Outcome unknown. Inspect runtime history before submitting again.');}finally{setBusy(false);lock.current=false;}}
 return <section aria-label="Bounded task execution"><p>First connected workflow: read-only capability audit. Your text provides context; this action only audits registered capabilities. No edits or model calls.</p><button disabled={preview||busy||!input.trim()} onClick={run}>{preview?'Execution connection pending':busy?'Audit running…':'Run capability audit'}</button><p role="status">{notice}</p>{result&&<article><h3>Result · {result.state}</h3><p>{result.message}</p><p>Verification: {result.verification}</p>{result.session&&<p>Runtime session: <code>{result.session}</code></p>}</article>}<p>Approval decisions and engineering continuation are not enabled in this workflow. Duplicate protection lasts for this site-server process.</p></section>;
}
