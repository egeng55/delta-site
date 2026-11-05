"use client";
import { useState } from "react";
import type { HistorianArchive } from "@/lib/historian";
import { historianNumber as number } from "@/lib/historian";
import { censusMetrics, censusTimeline } from "@/lib/censusTimeline";
import styles from "./CensusTimeline.module.css";

const date = (value: string) => new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/New_York" });
const delta = (value: number | null) => value === null ? "Not comparable" : `${value > 0 ? "+" : ""}${number(value)}`;

export default function CensusTimeline({ data }: { data: HistorianArchive }) {
  const [metric, setMetric] = useState("source_loc");
  const [selection, setSelection] = useState("");
  const timeline = censusTimeline(data, metric);
  const selected = timeline.points.find(p => p.id === selection) ?? timeline.latest;
  const max = Math.max(1, ...timeline.points.map(p => p.value ?? 0));
  const index = timeline.points.findIndex(p => p.id === selected?.id);
  const milestones = data.milestones.filter(m => selected && Date.parse(m.date) <= Date.parse(selected.date)
    && (index < 1 || Date.parse(m.date) > Date.parse(timeline.points[index - 1].date)));
  return <section className={styles.root} aria-label="Complete census timeline">
    <header className={styles.heading}>
      <div><p className={styles.kicker}>DELTA / THE COMPLETE RETAINED RECORD</p><h2>Progress through time.</h2>
        <p>{timeline.points.length} retained censuses{timeline.points[0] && timeline.latest ? ` · ${date(timeline.points[0].date)} to ${date(timeline.latest.date)}` : ""}</p></div>
      <label>Measurement<select value={metric} onChange={e => setMetric(e.target.value)}>{censusMetrics.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
    </header>
    <div className={styles.totals}>
      <div><span>Latest recorded</span><strong>{number(timeline.latest?.value ?? null)}</strong><small>{censusMetrics.find(m => m.id === metric)?.label}</small></div>
      <div><span>Since first comparable census</span><strong>{delta(timeline.totalChange)}</strong><small>{timeline.first ? date(timeline.first.date) : "Matching scope and methodology required"}</small></div>
      <div><span>Since previous comparable census</span><strong>{delta(timeline.recentChange)}</strong><small>{timeline.previous ? date(timeline.previous.date) : "No comparable predecessor"}</small></div>
    </div>
    <div className={styles.timeline}>
      <ol aria-label="Census checkpoints">{timeline.points.map(p => <li key={p.id}>
        <button type="button" aria-pressed={selected?.id === p.id} onClick={() => setSelection(p.id)}>
          <time dateTime={p.date}>{date(p.date)}</time>
          <span className={styles.track} aria-hidden="true"><span style={{ width: `${(p.value ?? 0) / max * 100}%` }} /></span>
          <strong>{p.conflicting ? "Conflicting records" : number(p.value)}</strong>
          <small>{p.methodology} · {p.quality}{p.scope !== timeline.latest?.scope ? " · different scope" : ""}</small>
        </button>
      </li>)}</ol>
      {selected ? <aside aria-live="polite" aria-label="Selected census">
        <p className={styles.kicker}>RECORDED CHECKPOINT</p><h3>{date(selected.date)}</h3>
        <p>{selected.quality} · methodology {selected.methodology}</p>
        <p className={styles.identity}>{selected.id}</p>
        <h4>Milestones recorded in this interval</h4>
        {milestones.length ? <ul>{milestones.map(m => <li key={m.id}><strong>{m.title}</strong><p>{m.gained || m.description}</p></li>)}</ul> : <p>No milestone is recorded in this interval.</p>}
        <details><summary>Measurement & provenance</summary>
          <p>Scope: {selected.scope || "Not recorded; comparison unavailable"}</p>
          <p>{selected.missingQualification ? "Agent qualification was not measured." : "Structural measurements do not establish current runtime qualification."}</p>
          {selected.evidence ? <p className={styles.identity}>{selected.evidence.path}<br />SHA-256: {selected.evidence.sha256}</p> : <p>Source references are retained in the comparison evidence below.</p>}
        </details>
      </aside> : <p>No valid census checkpoints are available.</p>}
    </div>
    <p className={styles.note}>Structural scale, not an intelligence score. Snapshots are never summed. Missing measurements remain unknown; gaps are not estimated. Changes compare complete records with matching methodology and repository scope. This is the retained archive, not a claim that every historical census was preserved.</p>
  </section>;
}
