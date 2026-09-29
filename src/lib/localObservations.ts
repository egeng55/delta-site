import 'server-only';
import {execFile} from 'node:child_process';
import path from 'node:path';
const cache = new Map<string,{expires:number;promise:Promise<unknown>}>();
// Explicit server-only opt-in. Browser input never controls executable, workspace or arguments.
export function readLocalObservation(kind:'source'|'engineering'):Promise<unknown>|null {
 const workspace=process.env.DELTA_HQ_LOCAL_WORKSPACE;
 if(!workspace||!path.isAbsolute(workspace))return null;
 const key=workspace+':'+kind,previous=cache.get(key);
 if(previous&&previous.expires>Date.now())return previous.promise;
 const promise=new Promise<unknown>((resolve,reject)=>{
  execFile(process.execPath,[path.join(process.cwd(),'scripts/local-observations.cjs'),kind,workspace],{timeout:20000,maxBuffer:8_000_000,encoding:'utf8',env:{NODE_ENV:process.env.NODE_ENV,PATH:process.env.PATH,HOME:process.env.HOME}},(error,stdout)=>{
   if(error)return reject(Error('local_observation_unavailable'));
   try{resolve(JSON.parse(stdout));}catch{reject(Error('invalid_local_observation'));}
  });
 });
 cache.set(key,{expires:Date.now()+(kind==='source'?60000:30000),promise});
 // Failed collectors have a short cooldown, so polling cannot create a retry storm.
 void promise.catch(()=>{const current=cache.get(key);if(current?.promise===promise)current.expires=Date.now()+10000;});
 return promise;
}
