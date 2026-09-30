'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowDownToLine,ArrowUpRight,BarChart3,RefreshCw,ShieldCheck} from 'lucide-react';
import {requestJson} from '@/lib/requestJson';
import type {WorkspaceSummary} from '@/lib/workspaceSummary';
import styles from './WorkspacePanels.module.css';

export default function ControlSummary({preview=false,reportMode=false}:{preview?:boolean;reportMode?:boolean}){
  const [summary,setSummary]=useState<WorkspaceSummary|null>(null);
  const [status,setStatus]=useState(preview?'Preview — no source report connected.':'Reading permitted summary…');
  const [busy,setBusy]=useState(false);
  const [revision,setRevision]=useState(0);
  const lock=useRef(false);
  useEffect(()=>{
    if(preview)return;
    const controller=new AbortController();let alive=true;lock.current=true;
    async function read(){
      setBusy(true);
      try{
        const response=await requestJson('/api/workspace/summary',{signal:controller.signal});
        if(!response.ok)throw Error(response.status===401||response.status===403?'Your session cannot read this report.':'The report source is unavailable.');
        const next=(response.data as {summary?:WorkspaceSummary})?.summary;
        if(!next||typeof next.available!=='boolean'||!next.statuses||!['recent','stale','unavailable'].includes(next.statuses.snapshot)||next.statuses.runtime!=='not_observed'||next.statuses.deployment!=='not_observed')throw Error('Report format unavailable.');
        const keys=['capabilities','tools','systems','repositories','sourceFiles','testFiles','mappedCapabilities','ambiguousCapabilities','unmappedCapabilities'] as const;
        if(next.available&&(!next.counts||typeof next.observedAt!=='string'||!Number.isFinite(Date.parse(next.observedAt))||keys.some(key=>!Number.isSafeInteger(next.counts![key])||next.counts![key]<0)))throw Error('Report format unavailable.');
        if(!next.available&&(next.counts!==null||next.observedAt!==null))throw Error('Report format unavailable.');
        if(alive){setSummary(next);setStatus(next.available?`${next.statuses.snapshot==='stale'?'Stale source snapshot':'Source snapshot'} · ${new Date(next.observedAt!).toLocaleString()}`:'No permitted source snapshot is connected.');}
      }catch(e){if(alive){setSummary(null);setStatus(e instanceof Error?e.message:'Summary unavailable.');}}
      finally{if(alive){lock.current=false;setBusy(false);}}
    }
    void read();return()=>{alive=false;controller.abort();};
  },[preview,revision]);
  function download(){if(!summary?.available)return;const blob=new Blob([JSON.stringify({report:'Delta source summary',exportedAt:new Date().toISOString(),summary,limitations:['Source declarations do not establish runtime readiness, customer usage or deployment.']},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='delta-source-summary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const counts=summary?.counts;
  const rows=[['Explicit mapping',counts?.mappedCapabilities],['Multiple mappings',counts?.ambiguousCapabilities],['Without mapping',counts?.unmappedCapabilities]] as const;
  const total=rows.reduce((n,[,v])=>n+(v??0),0);
  return <section className={styles.report} aria-label="Workspace summary">
    <div className={styles.toolbar}><span role="status">{status}</span><div><button disabled={preview||busy} onClick={()=>{if(lock.current)return;lock.current=true;setRevision(v=>v+1);}}><RefreshCw size={14} className={busy?styles.spin:''}/>{busy?'Reading…':'Refresh'}</button><button disabled={!summary?.available} onClick={download}><ArrowDownToLine size={14}/>Export report</button></div></div>
    <div className={styles.metrics}>{[{label:'Registered capabilities',value:counts?.capabilities,note:'Source declarations'},{label:'Connected system definitions',value:counts?.systems,note:'Architecture snapshot'},{label:'Repositories in snapshot',value:counts?.repositories,note:'Reported source coverage'}].map(x=><article key={x.label}><span>{x.label}</span><strong>{x.value?.toLocaleString()??'—'}</strong><small>{x.note}</small></article>)}</div>
    <div className={styles.reportGrid}><section className={styles.card}><div className={styles.cardTitle}><div><span className={styles.eyebrow}>STRUCTURAL COVERAGE</span><h2>How capabilities connect</h2></div><BarChart3 size={20}/></div>{counts?<div className={styles.chart} aria-label="Capability mapping counts">{rows.map(([label,value],i)=><div className={styles.chartRow} key={label}><span>{label}</span><div className={styles.track}><span style={{width:`${total?(value??0)/total*100:0}%`,opacity:1-i*.25}}/></div><b>{value}</b></div>)}</div>:<div className={styles.blankChart}><div/><div/><div/><p>No source measurements available</p></div>}<p className={styles.note}>Mappings describe the source architecture. They do not measure execution success.</p></section><section className={styles.card}><span className={styles.eyebrow}>TRUST & FRESHNESS</span><h2>Know what you’re looking at.</h2><dl className={styles.facts}><div><dt>Source snapshot</dt><dd>{summary?.statuses.snapshot??'Unavailable'}</dd></div><div><dt>Runtime health</dt><dd>Not observed by this report</dd></div><div><dt>Deployment</dt><dd>Not observed by this report</dd></div><div><dt>Customer activity</dt><dd>Not connected</dd></div><div><dt>Private task content</dt><dd>Excluded</dd></div></dl></section></div>
    {reportMode&&<section className={styles.card}><div className={styles.cardTitle}><h2>Report contents</h2><ArrowUpRight size={20}/></div><dl className={styles.facts}><div><dt>Source files</dt><dd>{counts?.sourceFiles.toLocaleString()??'Unknown'}</dd></div><div><dt>Test files</dt><dd>{counts?.testFiles.toLocaleString()??'Unknown'}</dd></div><div><dt>Registered tools</dt><dd>{counts?.tools.toLocaleString()??'Unknown'}</dd></div></dl><p className={styles.note}>The JSON export contains this permitted summary, observation time, and limitations. Missing business metrics stay unknown.</p></section>}
    <div className={styles.reportFoot}><ShieldCheck size={15}/><span>Read-only projection. Refreshing does not run agents or change the platform.</span></div>
  </section>;
}
