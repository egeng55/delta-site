import 'server-only';
export const lifecycleOperations = ['tasks','requests','approvals','review','control','decision'] as const;
export type LifecycleOperation = typeof lifecycleOperations[number];
// Fixed destination, fixed route vocabulary. Browser callers cannot set credentials or paths.
export async function workspaceLifecycle(operation: LifecycleOperation, method: 'GET'|'POST', id?: string|null, body?: unknown) {
 const port=process.env.DELTA_HQ_RUNTIME_PORT,token=process.env.DELTA_HQ_RUNTIME_TOKEN;
 if(!port||!/^\d{1,5}$/.test(port)||+port<1||+port>65535||!token||!/^[a-f0-9]{64}$/.test(token))throw Error('runtime_unconfigured');
 const response=await fetch(`http://127.0.0.1:${+port}/v1/workspace/${operation}${id?`?id=${encodeURIComponent(id)}`:''}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(5000)});
 const reader=response.body?.getReader();if(!reader)throw Error('runtime_unavailable');const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1_000_000)throw Error('response_limit');chunks.push(value);}}finally{await reader.cancel().catch(()=>undefined);}
 const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 return {status:response.status,data};
}
