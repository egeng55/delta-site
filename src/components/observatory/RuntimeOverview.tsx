'use client';
import { useEffect, useState } from 'react';
import { requestJson } from '@/lib/requestJson';
import styles from './RuntimeOverview.module.css';
import {recordedTaskCharges} from '@/lib/workspace';
import type { Workspace } from '@/lib/workspace';

export default function RuntimeOverview({ preview = false }: { preview?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  const [data, setData] = useState<Workspace | null>(null);
  const [state, setState] = useState('Loading runtime observations…');
  useEffect(() => {
    if (preview) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      setNow(Date.now());
      try {
        const response = await requestJson('/api/hq/workspace', { signal: controller.signal }, 8000);
        if (disposed) return;
        if (!response.ok) {
          setData(null);
          setState(response.status === 401 || response.status === 403 ? 'Owner session required.' : 'Workspace unavailable.');
        } else {
          const next = response.data as Workspace;
          if (next?.version !== 1) throw new Error('invalid_workspace');
          setData(next);
          setState(next.connection === 'snapshot' ? 'Hosted observation feed · read-only · updated within 2 minutes' : next.connection === 'stale' ? 'Observation feed stale · last known state, not live health' : next.connection === 'connected' ? 'Connected to local runtime' : next.connection === 'unconfigured' ? 'Runtime connector not configured.' : 'Runtime disconnected.');
        }
      } catch { if (!disposed) { setData(null); setState('Runtime unavailable.'); } }
      if (!disposed) timer = setTimeout(refresh, 10000);
    }
    void refresh();
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [preview]);
  const runtime = data?.runtime;
  const charges=recordedTaskCharges(runtime?.tasks);
  const source = data?.source;
  const sourceAge = source ? now - Date.parse(source.generatedAt) : null;
  const sourceStale = sourceAge !== null && (!Number.isFinite(sourceAge) || sourceAge < -5000 || sourceAge > 26 * 60 * 60 * 1000);
  const stale = runtime && (now - Date.parse(runtime.observedAt) > 30000 || Date.parse(runtime.observedAt) > now + 5000);
  const commands = runtime?.commands ?? [];
  const passed = commands.filter(c => c.verification === 'passed').length;
  return <section aria-label="Runtime observations" className={styles.panel}>
    <h2>Runtime observations</h2>
    <p role="status">{preview ? 'Design preview — live runtime is not connected.' : state}{stale ? ' · Observations are stale or clock-skewed.' : ''}</p>
    <p>Live runtime observations and recorded task charges. Provider invoices remain a separate, unconnected source.</p>
    {!preview && data && <details><summary>Source revisions · {source ? sourceStale ? 'stale or clock-skewed' : 'recent snapshot' : 'unavailable'}</summary>
      {source ? <><p>Observed {source.generatedAt}. Committed main revisions; running and deployed revisions are not established.</p><ul>{source.repositories.map(repo => <li key={repo.id}>{repo.label}: <code>{repo.sha}</code></li>)}</ul></> : <p>No validated source report is connected.</p>}
    </details>}
    {!runtime && <div className={styles.empty}><div><h3>Waiting for a runtime connection</h3><p>Task activity, verification and capability readiness will appear here once connected. Missing observations are not zero activity.</p></div><a href="#settings">View connection details →</a></div>}
    {runtime && <>
      <p>Runtime uptime: {runtime.uptimeMs===undefined?'unknown':`${Math.floor(runtime.uptimeMs/60000)} minutes`} · owner session {runtime.ownerActive?'active':'inactive'}{runtime.ownerExpiresAt?` · expires ${new Date(runtime.ownerExpiresAt).toLocaleTimeString()}`:''}</p>
      <p>Startup revision: <code>{runtime.revision??'unknown'}</code>. Local edits after startup are not included in this identity.</p>
      <dl className={styles.metrics}>
        <div><dt>Retained commands</dt><dd>{runtime.retained}</dd></div>
        <div><dt>Capability observations</dt><dd>{runtime.capabilities.length}</dd></div>
        <div><dt>Verification passed</dt><dd>{passed} / {commands.length}</dd></div>
        <div><dt>Durable tasks</dt><dd>{runtime.taskCount??0}</dd></div>
        <div><dt>Recorded task charges</dt><dd>{charges===null?'Unknown':`$${charges.toFixed(4)}`}</dd></div>
      </dl>
      {commands.length>0&&<figure aria-label="Verification distribution"><div className={styles.bars} aria-hidden="true"><span style={{flex:passed,display:passed?'block':'none'}}/><span style={{flex:commands.filter(c=>c.verification==='failed').length,display:commands.some(c=>c.verification==='failed')?'block':'none'}}/><span style={{flex:commands.filter(c=>!['passed','failed'].includes(c.verification)).length,display:commands.some(c=>!['passed','failed'].includes(c.verification))?'block':'none'}}/></div><figcaption className={styles.legend}><span>{passed} passed</span><span>{commands.filter(c=>c.verification==='failed').length} failed</span><span>{commands.filter(c=>!['passed','failed'].includes(c.verification)).length} unknown</span></figcaption></figure>}
      <label>Verification in retained commands <meter min={0} max={Math.max(1, commands.length)} value={passed}>{passed}</meter></label>
      <p>This process only · {runtime.evicted} records evicted · Observed {runtime.observedAt}. Verification is not proof of a real-world outcome.</p>
      <details><summary>Durable task activity and cost coverage</summary><p>Latest {runtime.tasks?.length??0} of {runtime.taskCount??0} retained tasks. Charges are recorded outcome accounting, not invoices; missing or uncertain usage is not zero cost.</p><ul>{runtime.tasks?.map(t=><li key={t.id}><a href={`?task=${t.id}#work`}>{t.id}</a> · {t.kind} · {t.state} · {t.chargedMicrousd===null?'cost unavailable':`$${(t.chargedMicrousd/1000000).toFixed(4)}`}{t.unknownUsage?' · usage uncertain':''}</li>)}</ul></details>
      {!commands.length ? <p>No commands observed in this process.</p> : <details><summary>Recent command evidence</summary><ul>{commands.slice(-20).reverse().map(c => <li key={c.id}><code>{c.id}</code> · {c.capability ?? 'Unresolved capability'} · {c.state} · verification {c.verification} · tokens {c.tokens ?? 'unknown'}</li>)}</ul></details>}
      <details><summary>Capability readiness</summary><ul>{runtime.capabilities.map(c => <li key={c.id}><code>{c.id}</code> · {c.binding} · {c.readiness} · approval {c.approvalRequired === null ? 'unknown' : c.approvalRequired ? 'required' : 'not required by risk class'}</li>)}</ul><p>This endpoint may return a partial capability inventory. Binding does not grant authority or prove credentials and dependencies are ready.</p></details>
    </>}
  </section>;
}
