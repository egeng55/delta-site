/* eslint-disable @typescript-eslint/no-require-imports */
// Explicit foreground publisher. Stop with Ctrl-C; no launch agent or public execution API.
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const {loadEnvFile}=require('node:process');
const {project}=require('./observatory-export.cjs');
const {projectEngineering}=require('./engineering-export.cjs');
const {parseOperations}=require('../src/lib/operationsSnapshot.ts');
const {projectRuntime}=require('../src/lib/workspace.ts');
// Node's type stripping does not resolve extensionless TS imports; validate each projection here.
const {parseEngineering}=require('../src/lib/engineering.ts');
try{loadEnvFile(path.join(__dirname,'../.env.local'));}catch{throw Error('local_configuration_required');}
const workspace=process.env.DELTA_HQ_LOCAL_WORKSPACE,owner=process.env.DELTA_HQ_OWNER_USER_ID;
if(!workspace||!path.isAbsolute(workspace)||!/^[-a-f0-9]{36}$/.test(owner||''))throw Error('publisher_configuration_invalid');
const watch=process.argv.includes('--watch');
if(process.argv.slice(2).some(v=>!['--watch','--dry-run'].includes(v)))throw Error('invalid_arguments');
let failures=0;
async function publish(){
 const source=project({workspace});
 let runtime=null;
 const port=process.env.DELTA_HQ_RUNTIME_PORT,token=process.env.DELTA_HQ_RUNTIME_TOKEN;
 if(/^\d{1,5}$/.test(port||'')&&Number(port)>0&&Number(port)<=65535&&/^[a-f0-9]{64}$/.test(token||'')){
  try{const r=await fetch(`http://127.0.0.1:${port}/v1/operator/status`,{headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:AbortSignal.timeout(5000)});
   if(r.ok){const reader=r.body.getReader();let size=0;const chunks=[];try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000)throw Error('runtime_too_large');chunks.push(value);}}finally{await reader.cancel();}runtime=projectRuntime(JSON.parse(Buffer.concat(chunks)));}
  }catch{/* Runtime absence is preserved as null, never a successful probe. */}
 }
 const backendRoot=path.join(workspace,'delta-backend');
 const start=Date.now();let backend={state:'unavailable',latencyMs:0,revision:null};
 try{const r=await fetch('http://127.0.0.1:8000/health',{signal:AbortSignal.timeout(2500),redirect:'error'});const body=await r.json();backend={state:r.ok&&body.status==='ok'&&body.service==='delta-backend'?'healthy':'unavailable',latencyMs:Date.now()-start,revision:/^[a-f0-9]{40}$/.test(body.revision?.commit)?body.revision.commit:null};}catch{}
 let spending={state:'unavailable',day:null,dailyReserved:null,monthlyReserved:null,dailyCap:null,monthlyCap:null};
 try{const s=JSON.parse(execFileSync(path.join(backendRoot,'.venv/bin/python'),[path.join(backendRoot,'scripts/provider_spend_status.py')],{encoding:'utf8',timeout:4000,maxBuffer:16000,stdio:['ignore','pipe','pipe']}));const money=v=>Number.isSafeInteger(v)&&v>=0?v/1000000:null;if(s.version===1&&s.source==='backend_reservations')spending={state:s.state,day:s.day,dailyReserved:money(s.daily_reserved_micro),monthlyReserved:money(s.monthly_reserved_micro),dailyCap:money(s.daily_cap_micro),monthlyCap:money(s.monthly_cap_micro)};}catch{}
 const operations=parseOperations({observedAt:new Date().toISOString(),backend,spending});
 const payload={operations,version:1,observedAt:new Date().toISOString(),source,runtime,engineering:parseEngineering(projectEngineering(workspace))};
 const digest=createHash('sha256').update(JSON.stringify({repositories:source.repositories,graphs:source.graphs.map(({id,sourceCommit,nodes,links})=>({id,sourceCommit,nodes,links}))})).digest('hex');
 if(process.argv.includes('--dry-run')){console.log(JSON.stringify({dryRun:true,repositories:source.repositories.length,runtimeObserved:!!runtime,bytes:Buffer.byteLength(JSON.stringify(payload)),digest}));return;}
 const output=execFileSync(path.join(backendRoot,'.venv/bin/python'),[path.join(backendRoot,'scripts/publish_hq_observation.py')],{input:JSON.stringify({owner,payload,digest}),encoding:'utf8',timeout:30000,maxBuffer:4096,stdio:['pipe','pipe','pipe']});
 console.log(output.trim());
}
(async()=>{const deadline=Date.now()+8*3600000;do{try{await publish();failures=0;}catch{console.error('Observation publication failed; no credentials logged.');if(++failures>=3||!watch){process.exitCode=1;break;}}if(!watch)break;await new Promise(r=>setTimeout(r,30000));}while(Date.now()<deadline);})();
