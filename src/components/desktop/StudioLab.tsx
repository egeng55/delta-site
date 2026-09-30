'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Download, FlaskConical, LoaderCircle, Play, Radio, ShieldCheck, TerminalSquare, X } from 'lucide-react';
import { requestJson } from '@/lib/requestJson';
import { classifyProbeFailure, exportStudioSimulations, projectStudioResponse, runStudioScenario, studioEndpoints, studioScenarios, type ProbeResult, type SimulationResult, type StudioEndpointId } from '@/lib/studioLab';
import styles from './StudioLab.module.css';

export default function StudioLab({ preview = false, canInspectRuntime = false }: { preview?: boolean; canInspectRuntime?: boolean }) {
  const [endpointId, setEndpointId] = useState<StudioEndpointId>('workspace');
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [running, setRunning] = useState(false);
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [scenario, setScenario] = useState<(typeof studioScenarios)[number]['id']>('valid_runtime');
  const [exportError, setExportError] = useState('');
  const request = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const mounted = useRef(false);
  const endpoint = studioEndpoints.find(item => item.id === endpointId)!;
  const allowed = canInspectRuntime && !preview;
  const latest = simulations.at(-1);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); };
  }, []);
  useEffect(() => { if (!allowed) request.current?.abort(); }, [allowed]);

  async function inspect() {
    if (!allowed || lock.current) return;
    lock.current = true;
    const controller = new AbortController();
    request.current = controller;
    setRunning(true);
    setProbe(null);
    const started = performance.now();
    let result: ProbeResult;
    try {
      const response = await requestJson(endpoint.path, { method: 'GET', signal: controller.signal }, 12000);
      if (!response.ok) result = { endpoint: endpoint.id, ...classifyProbeFailure(response.status), httpStatus: response.status, durationMs: 0, projection: null };
      else {
        try {
          result = { endpoint: endpoint.id, state: 'observed', summary: 'Response contract checked. Availability is reported in the observation below.', httpStatus: response.status, durationMs: 0, projection: projectStudioResponse(endpoint.id, response.data) };
        } catch {
          result = { endpoint: endpoint.id, state: 'invalid', summary: 'The response did not match the expected contract. Its contents were discarded.', httpStatus: response.status, durationMs: 0, projection: null };
        }
      }
    } catch (error) {
      result = { endpoint: endpoint.id, ...classifyProbeFailure(null, error instanceof Error && /interrupted|cancelled|timeout/.test(error.message)), httpStatus: null, durationMs: 0, projection: null };
    } finally {
      request.current = null;
      lock.current = false;
    }
    if (mounted.current) {
      // A role change discards any observation that was still in flight.
      if (!controller.signal.aborted) setProbe({ ...result, durationMs: performance.now() - started });
      setRunning(false);
    }
  }

  function simulate(all = false) {
    const results = (all ? studioScenarios : studioScenarios.filter(item => item.id === scenario)).map(item => runStudioScenario(item.id));
    setSimulations(previous => [...previous, ...results].slice(-30));
    setExportError('');
  }
  function exportResults() {
    if (!simulations.length) return;
    try {
      const url = URL.createObjectURL(new Blob([exportStudioSimulations(simulations)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'delta-studio-simulations.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch { setExportError('Download unavailable in this environment. Simulation results remain visible below.'); }
  }

  return <div className={styles.lab}>
    <header className={styles.header}>
      <div><span className={styles.eyebrow}><FlaskConical size={14} /> DEVELOPER STUDIO</span><h2>Put Delta to the test.</h2><p>Inspect a real interface, or exercise a contract with a local fixture.</p></div>
      <span className={styles.mode}><span />{allowed ? 'Owner endpoint access' : 'Offline lab available'}</span>
    </header>

    <section className={styles.endpointPanel} aria-label="Endpoint inspector">
      <div className={styles.catalog}>
        <div className={styles.sectionLabel}><Radio size={15} /><h3>Read-only endpoints</h3><span>{studioEndpoints.length}</span></div>
        <div className={styles.endpointList}>{studioEndpoints.map(item => <button key={item.id} type="button" aria-pressed={endpointId === item.id} disabled={running} onClick={() => { setEndpointId(item.id); setProbe(null); }}><span className={styles.get}>GET</span><span>{item.label}</span><ChevronRight size={14} /></button>)}</div>
        <p className={styles.finePrint}>Fixed routes. One request per click. Server permissions remain authoritative.</p>
      </div>
      <div className={styles.requestPane}>
        <div className={styles.requestHeading}><span className={styles.get}>GET</span><code>{endpoint.path}</code><span className={styles.readOnly}><ShieldCheck size={13} /> Read only</span></div>
        <h3>{endpoint.label}</h3><p>{endpoint.description}</p>
        <div className={styles.requestActions}><button className={styles.primary} disabled={!allowed || running} onClick={() => void inspect()}>{running ? <LoaderCircle size={15} className={styles.spinner} /> : <Play size={14} />}{running ? 'Reading endpoint…' : 'Inspect endpoint'}</button><span>12s deadline · no model call</span></div>
        {!allowed && <p className={styles.accessNote}><ShieldCheck size={14} />{preview ? 'Design preview: live requests are disabled.' : 'Live inspection requires owner access. Offline contract checks remain available.'}</p>}
        <section className={styles.response} aria-label="Endpoint response" aria-busy={running}>
          <div className={styles.responseHeader}><span><TerminalSquare size={14} /> Response</span>{probe && <span className={probe.state === 'observed' ? styles.good : styles.warning}>{probe.httpStatus ? `HTTP ${probe.httpStatus} · ` : ''}{probe.state} · {probe.durationMs.toFixed(1)} ms</span>}</div>
          {running ? <p role="status" className={styles.empty}>Reading the selected endpoint. No retry will be sent automatically.</p> : probe && allowed ? <><p role={probe.state === 'observed' ? 'status' : 'alert'}>{probe.summary}</p>{probe.projection && <pre>{JSON.stringify(probe.projection, null, 2)}</pre>}</> : <div className={styles.empty}><TerminalSquare size={25} /><p>Your next observation appears here.</p><small>Only a bounded summary is shown; raw responses are discarded.</small></div>}
        </section>
      </div>
    </section>

    <section className={styles.simulationPanel} aria-label="Offline simulations">
      <div className={styles.simulationHeading}><div><span className={styles.eyebrow}>OFFLINE · PROVIDER FREE</span><h3>Contract simulations</h3><p>Real local assertions against client parsers and error handling. These do not qualify live execution or model intelligence.</p></div><button className={styles.secondary} onClick={() => simulate(true)}><Play size={14} />Run all {studioScenarios.length}</button></div>
      <div className={styles.simulationGrid}><div><label className={styles.fieldLabel} htmlFor="studio-scenario">Scenario</label><select id="studio-scenario" value={scenario} onChange={event => setScenario(event.target.value as typeof scenario)}>{studioScenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><p className={styles.scenarioDescription}>{studioScenarios.find(item => item.id === scenario)!.description}</p><button className={styles.primary} onClick={() => simulate()}><FlaskConical size={15} />Run simulation<ArrowRight size={14} /></button></div>
        <div className={styles.simulationOutput} aria-live="polite"><div className={styles.responseHeader}><span>Latest local result</span><span className={styles.simulationTag}>SIMULATED INPUT</span></div>{latest ? <><div className={styles.resultHeading}><strong>{latest.label}</strong><span className={latest.passed ? styles.good : styles.warning}>{latest.passed ? 'Passed' : 'Failed'} · {latest.durationMs.toFixed(2)} ms</span></div><ul className={styles.assertions}>{latest.assertions.map(assertion => <li key={assertion.label}>{assertion.passed ? <Check size={14} /> : <X size={14} />}<span>{assertion.label}</span></li>)}</ul></> : <p className={styles.empty}>Choose a scenario to see measured assertions, without connecting to a runtime.</p>}</div></div>
      {simulations.length > 0 && <div className={styles.history}><div className={styles.historyHeading}><h4>Session checks <span>{simulations.length}</span></h4><button className={styles.exportButton} onClick={exportResults}><Download size={14} />Export fixture results</button></div><div className={styles.historyRows}>{simulations.map((result, index) => <div key={index}><span className={result.passed ? styles.good : styles.warning}>{result.passed ? 'PASS' : 'FAIL'}</span><span>{result.label}</span><span>{result.assertions.length} assertions</span><code>{result.durationMs.toFixed(2)} ms</code></div>)}</div><p className={styles.finePrint}>Latest 30 runs in this tab. Export contains fixture assertions only. No endpoint responses or credentials.</p></div>}
      {exportError && <p role="alert">{exportError}</p>}
    </section>
  </div>;
}
