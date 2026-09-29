'use client';
import {useEffect,useMemo,useState} from 'react';
import type {ObservatoryReport} from '@/lib/observatory';
import type {Workspace} from '@/lib/workspace';
export function mappedCapabilities(report:ObservatoryReport,focus:string|null):Set<string>{
 const graph=report.graphs.find(g=>g.id==='capabilities');const ids=new Set<string>();
 if(!focus||!graph)return ids;
 if(focus.startsWith('cap:'))ids.add(focus.slice(4));
 const systems=focus.startsWith('repo:')?new Set(report.graphs.find(g=>g.id==='systems')?.links.filter(e=>e.source===focus&&e.relation==='declared owner').map(e=>e.target)):new Set([focus]);
 for(const edge of graph.links){if(systems.has(edge.source)&&edge.target.startsWith('cap:'))ids.add(edge.target.slice(4));if(edge.target===focus&&edge.source.startsWith('cap:'))ids.add(edge.source.slice(4));}
 return ids;
}
export default function GraphRuntimeEvidence({report,focus,preview}:{report:ObservatoryReport;focus:string|null;preview:boolean}){
 const [runtime,setRuntime]=useState<Workspace['runtime']>(null);
 useEffect(()=>{if(preview)return;let active=true,timer:ReturnType<typeof setTimeout>;const controller=new AbortController();async function poll(){try{const r=await fetch('/api/hq/workspace',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});if(!r.ok)throw Error();const d=await r.json();if(active)setRuntime(d.runtime??null);}catch{if(active)setRuntime(null);}if(active)timer=setTimeout(poll,10000);}void poll();return()=>{active=false;controller.abort();clearTimeout(timer);};},[preview]);
 const capabilities=useMemo(()=>mappedCapabilities(report,focus),[report,focus]);
 const commands=runtime?.commands.filter(c=>c.capability&&capabilities.has(c.capability))??[];
 return <section aria-label="Component runtime evidence"><h3>Observed execution</h3><p>{preview?'Preview has no live execution connection.':!runtime?'Runtime observations unavailable.':`Observed ${new Date(runtime.observedAt).toLocaleTimeString()} · this process only · refreshes every 10 seconds`}</p>{focus&&runtime?<><p>{capabilities.size} explicitly mapped capabilities · {commands.length} matching retained commands.</p><ul>{commands.map(c=><li key={c.id}><code>{c.id}</code> · {c.capability} · {c.state} · verification {c.verification} · tokens {c.tokens??'unknown'}</li>)}</ul>{!commands.length&&<p>No matching execution observed. This does not imply the component is unused or healthy.</p>}</>:<p>Select a component to correlate commands by exact capability identifier.</p>}<p>Declared edges remain structural. A matching capability does not prove every dependency executed; task history and results are in <a href="#work">Work</a>.</p></section>;
}
