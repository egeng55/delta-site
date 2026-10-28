"use client";
import type { HistorianArchive } from '@/lib/historian';
import { historianNumber } from '@/lib/historian';
import styles from './HistorianHistory.module.css';

const xml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
export function growthGraphic(data: HistorianArchive) {
  const metric = data.comparison.metrics.find(m => m.metric_id === 'source_loc');
  const value = metric?.current == null ? 'Not measured' : historianNumber(metric.current);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#071b2d"/><circle cx="1070" cy="400" r="320" fill="none" stroke="#315a70"/><circle cx="1070" cy="400" r="240" fill="none" stroke="#315a70"/><g fill="#e8f1ee" font-family="Georgia,serif"><text x="80" y="100" font-size="22">DELTA / RECORDED EVOLUTION</text><text x="80" y="250" font-size="96">${xml(value)}</text><text x="80" y="310" font-size="30">nonblank source lines · recorded local checkpoint</text><text x="80" y="415" font-size="24">${xml(data.snapshots.at(-1)?.date.slice(0, 10) ?? 'Date unavailable')}</text><text x="80" y="470" font-size="18">Methodology ${xml(data.comparison.methodology)}</text><text x="80" y="510" font-size="18">Structural scale, not intelligence quality or production qualification.</text><text x="80" y="570" font-size="14">${xml(data.comparison.id)}</text></g></svg>`;
}
export default function GrowthArchive({ data, onSelect }: { data: HistorianArchive; onSelect: (id: string) => void }) {
  const archive = data.growthArchive;
  if (!archive?.comparisons.length) return null;
  const points = [...new Map(archive.comparisons.filter(e => e.comparison.methodology === data.comparison.methodology).flatMap(e => {
    const m = e.comparison.metrics.find(m => m.metric_id === 'source_loc');
    return e.snapshots.map((s, i) => ({ id: s.id, date: s.date, value: i === 0 ? m?.previous : m?.current }));
  }).map(p => [p.id, p])).values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const max = Math.max(1, ...points.map(p => p.value ?? 0));
  return <section className={styles.panel} aria-label="Growth archive">
    <span className={styles.eyebrow}>THE RECORD / CHECKPOINTS</span>
    <h3>Growth, kept in time.</h3>
    <p>{archive.checkpoints.length} preserved checkpoints. Select a comparison to inspect its measurements and evidence. Gaps are not interpolated.</p>
    <label>Recorded comparison <select value={data.comparison.id} onChange={e => onSelect(e.target.value)}>
      {archive.comparisons.map(e => <option key={e.comparison.id} value={e.comparison.id}>{e.snapshots[0]?.date.slice(0, 10)} to {e.snapshots.at(-1)?.date.slice(0, 10)}</option>)}
    </select></label>
    <div className={styles.metricChart} aria-label="Source LOC by recorded checkpoint">
      {points.map(p => <div className={styles.barRow} key={p.id}><span>{p.date.slice(0, 10)}</span><div className={styles.track}><div className={styles.bar} style={{ width: `${(p.value ?? 0) / max * 100}%` }}/></div><strong>{historianNumber(p.value ?? null)}</strong></div>)}
    </div>
    <p className={styles.footnote}>Same-methodology source LOC, zero baseline. Static measurements do not establish live capability or qualification.</p>
    <a download={`delta-growth-${data.snapshots.at(-1)?.date.slice(0, 10)}.svg`} href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(growthGraphic(data))}`}>Download checkpoint graphic (SVG)</a>
    <span> · </span><a download="delta-history-feed.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`}>Download publication data</a>
  </section>;
}
