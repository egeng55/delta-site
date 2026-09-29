'use client';
import { useMemo, useState } from 'react';
import type { ObservatoryReport } from '@/lib/observatory';
import { graphLabel } from '@/lib/graphPresentation';
import { graphNeighborhood } from '@/lib/graphExplore';
import ArchitectureGraph from './ArchitectureGraph';
import styles from './ArchitectureExplorer.module.css';
export default function ArchitectureExplorer({ report, initialRepo = "all" }: { report: ObservatoryReport; initialRepo?: string }) {
 const [dependencies, setDependencies] = useState(true);
 const [layer, setLayer] = useState('systems');
 const [focus, setFocus] = useState<string | null>(null);
 const [query, setQuery] = useState('');
 const [repo, setRepo] = useState(initialRepo);
 const [depth, setDepth] = useState(1);
 const [direction, setDirection] = useState<'both' | 'incoming' | 'outgoing'>('both');
 const [trail, setTrail] = useState<string[]>([]);
 const graph = report.graphs.find(g => g.id === layer) ?? report.graphs[0];
 const selected = graph.nodes.find(n => n.id === focus);
 const visible = useMemo(() => graphNeighborhood(graph, focus, depth, direction), [graph, focus, depth, direction]);
 const displayGraph = !focus && graph.id === 'systems' && !dependencies ? { ...visible, links: visible.links.filter(e => e.relation === 'declared owner') } : visible;
 const matches = graph.nodes.filter(n => (repo === 'all' || n.group === repo) && `${graphLabel(n)} ${n.label} ${n.id} ${n.kind}`.toLowerCase().includes(query.toLowerCase()));
 const ownerships = graph.links.filter(e => e.relation === 'declared owner');
 const dependencyLinks = graph.links.filter(e => e.relation === 'declared dependency');
 const nodeById = new Map(graph.nodes.map(n => [n.id,n]));
 const crossRepo = graph.links.filter(e => nodeById.get(e.source)?.group !== nodeById.get(e.target)?.group);
 const edges = graph.links.filter(e => e.source === focus || e.target === focus);
 function select(id: string) { if (focus && focus !== id) setTrail(t => [...t, focus].slice(-20)); setFocus(id); }
 function changeLayer(id: string) { setLayer(id); setTrail([]); setQuery(''); setRepo('all'); if (!report.graphs.find(g => g.id === id)?.nodes.some(n => n.id === focus)) setFocus(null); }
 return <section aria-label="Architecture explorer" className={styles.explorer}>
   <p>Coverage: {report.repositories.map(r => r.label).join(" · ")}</p>
   <p>Declared structure · {graph.nodes.length} components · {graph.links.length} relationships. No live execution overlay is connected.</p>
   <p>{ownerships.length} ownership links · {dependencyLinks.length} declared dependencies · {crossRepo.length} cross-repository links</p>
   <details><summary>Ownership by repository and complete link inventory ({graph.links.length})</summary>
     {graph.id === 'systems' && <ul>{report.repositories.map(r => <li key={r.id}><strong>{r.label}</strong>: {ownerships.filter(e => e.source === `repo:${r.id}`).map(e => graphLabel(nodeById.get(e.target)!)).join(', ') || 'No ownership declared in this layer'}</li>)}</ul>}
     <div className={styles.linkInventory}><table><thead><tr><th>From</th><th>Relationship</th><th>To</th></tr></thead><tbody>{graph.links.map((edge,index) => <tr key={index}><td><button onClick={() => select(edge.source)}>{graphLabel(nodeById.get(edge.source)!)}</button></td><td>{edge.relation}</td><td><button onClick={() => select(edge.target)}>{graphLabel(nodeById.get(edge.target)!)}</button></td></tr>)}</tbody></table></div>
   </details>
   <div className={styles.toolbar} role="tablist" aria-label="Graph layer">{report.graphs.map(g => <button key={g.id} role="tab" aria-selected={g.id === graph.id} onClick={() => changeLayer(g.id)}>{g.id === 'systems' ? 'Systems' : g.id === 'capabilities' ? 'Capabilities & tools' : 'Graphify code'}</button>)}</div>
   <div className={styles.toolbar}>
     <label>Find a component<input aria-label="Find a component" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, identifier or kind" /></label>
     <label>Repository<select aria-label="Repository filter" value={repo} onChange={e => setRepo(e.target.value)}><option value="all">All repositories</option>{[...new Set(graph.nodes.map(n => n.group))].map(g => <option key={g}>{g}</option>)}</select></label>
     <button disabled={!focus} onClick={() => { setFocus(null); setTrail([]); }}>Show all Delta components</button>
   </div>
   <label><input type="checkbox" checked={dependencies} onChange={e => setDependencies(e.target.checked)} /> Show cross-system dependencies in overview</label><p>Compact groups organize components by repository. Select a component to reveal all its relationships. Full names remain in the evidence panel.</p>
   <div className={styles.layout}>
     <aside aria-label="Component directory"><h2>Components</h2><p>{matches.length} matches{matches.length > 100 ? ' · first 100 shown' : ''}</p>{!matches.length && <p>No matches. Try another name or repository.</p>}<div className={styles.directory}>{matches.slice(0,100).map(n => <button key={n.id} aria-pressed={focus === n.id} onClick={() => select(n.id)} title={n.label}>{graphLabel(n)}<small>{n.kind} · {n.group}</small></button>)}</div></aside>
     <div><div className={styles.toolbar}><button disabled={!trail.length} onClick={() => { setFocus(trail.at(-1) ?? null); setTrail(t => t.slice(0,-1)); }}>Back to previous component</button><label>Neighborhood depth<select aria-label="Neighborhood depth" value={depth} onChange={e => setDepth(Number(e.target.value))}>{[1,2,3].map(n => <option key={n} value={n}>{n} hop{n>1?'s':''}</option>)}</select></label><label>Follow edges<select aria-label="Relationship direction" value={direction} onChange={e => setDirection(e.target.value as typeof direction)}><option value="both">Both directions</option><option value="outgoing">Outgoing</option><option value="incoming">Incoming</option></select></label></div>
     <p role="status">{selected ? `FOCUSED VIEW: ${selected.label} — ${visible.nodes.length} of ${graph.nodes.length} components. Use Show all Delta components to return.` : 'Whole layer — select a component to isolate its neighborhood'}</p>
     <ArchitectureGraph graph={displayGraph} query="" repo="all" revision={0} onSelect={n => { if(n) select(n.id); }} />
     <p>Search filters the directory; the graph keeps relationship context around the selected component.</p></div>
   </div>
   <aside aria-label="Component evidence" className={styles.evidence}>{selected ? <><h2>{graphLabel(selected)}</h2><p>{selected.label}</p><code>{selected.id}</code><p>{selected.kind} · {selected.group} · declared status: {selected.maturity}</p><div className={styles.toolbar}>{report.graphs.filter(g => g.id !== graph.id && g.nodes.some(n => n.id === selected.id)).map(g => <button key={g.id} onClick={() => changeLayer(g.id)}>Explore in {g.id}</button>)}</div><h3>Relationships ({edges.length})</h3>{!edges.length && <p>No declared relationships in this layer.</p>}<ul>{edges.map((e,i) => { const other=e.source===focus?e.target:e.source; return <li key={i}>{e.source===focus?'Outgoing':'Incoming'} · {e.relation} → <button onClick={() => select(other)}>{graph.nodes.find(n=>n.id===other)?.label ?? other}</button></li>; })}</ul></> : <><h2>Inspect a component</h2><p>Select a directory entry or graph node to explore its relationships and provenance.</p></>}
   <p>Source revision <code>{graph.sourceCommit}</code> · observed {graph.generatedAt}{graph.sourceCommit !== report.sourceCommit ? ' · historical extraction' : ''}</p><p>Static relationships do not prove execution, authorization, health or cost. Revision comparison requires a second graph snapshot; none is supplied by this report.</p></aside>
 </section>;
}
