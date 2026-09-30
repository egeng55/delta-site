"use client";
import { useEffect, useRef, useState } from "react";
import {
  historianNumber as number,
  historyTracks,
  type HistorianArchive,
} from "@/lib/historian";
import styles from "./HistorianHistory.module.css";
const date = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
const chapters = [
  {
    name: "The first signal",
    zone: "Surface",
    period: "December 2025",
    range: [0, 1],
    headline: "An idea becomes a system.",
    copy: "Delta began with a simple ambition: turn everyday health events into understanding. One signal. One state. A foundation to build upon.",
  },
  {
    name: "Learning to remember",
    zone: "Sunlight",
    period: "January 2026",
    range: [1, 4],
    headline: "Memory changes everything.",
    copy: "Durable memory, conversation, and inference transform isolated observations into continuity. The architecture starts carrying context forward.",
  },
  {
    name: "A different kind of OS",
    zone: "Twilight",
    period: "June 2026",
    range: [4, 8],
    headline: "The boundaries move.",
    copy: "Behavioral intelligence meets agent supervision. Shared substrate becomes the architectural direction: a larger system, with more responsibilities and deeper connections.",
  },
  {
    name: "The shared engine",
    zone: "Midnight",
    period: "July – August 2026",
    range: [8, 12],
    headline: "Many agents. One runtime.",
    copy: "The engineering system takes shape around shared execution, Mission Control, and a bounded Historian dependency. Separate efforts begin to operate on common foundations.",
  },
  {
    name: "A coordinated system",
    zone: "Abyss",
    period: "August 2026",
    range: [12, 14],
    headline: "Specialists join the current.",
    copy: "Failure triage and architecture review enter the historical qualification record. Coordination and verification become part of the system’s structure.",
  },
  {
    name: "The measured depths",
    zone: "Seafloor",
    period: "August 7 → 12, 2026",
    range: [14, 14],
    headline: "186,730 lines below the surface.",
    copy: "Two comparable censuses reveal the scale beneath the story: five repositories, 4,623 additional source lines, and 1,823 additional test lines in this recorded window.",
  },
];
const systems = ["Agent", "Backend", "Site", "Mobile", "Jobs"];
function CodeReef({ stage }: { stage: number }) {
  return (
    <svg className={styles.reef} viewBox="0 0 800 800" aria-hidden="true">
      <defs>
        <radialGradient id="reef-glow">
          <stop stopColor="#5d9af5" stopOpacity=".2" />
          <stop offset="1" stopColor="#5d9af5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="400" cy="400" r="340" fill="url(#reef-glow)" />
      {[125, 230, 330].map((r) => (
        <circle key={r} cx="400" cy="400" r={r} className={styles.orbit} />
      ))}
      {systems.map((name, group) => {
        const a = (group * Math.PI * 2) / 5 - Math.PI / 2,
          cx = 400 + Math.cos(a) * 220,
          cy = 400 + Math.sin(a) * 220;
        return (
          <g
            key={name}
            className={styles.cluster}
            style={{ opacity: stage === 0 ? 0.22 : 1 }}
          >
            <path
              d={`M400 400 Q${cx} 400 ${cx} ${cy}`}
              className={styles.connection}
            />
            {Array.from({ length: 18 }, (_, i) => {
              const t = i * 2.3999,
                r = 24 + Math.sqrt(i) * 21,
                x = cx + Math.cos(t) * r,
                y = cy + Math.sin(t) * r;
              return (
                <g key={i} style={{ opacity: i < 3 + stage * 3 ? 1 : 0.035 }}>
                  <path d={`M${cx} ${cy} L${x} ${y}`} className={styles.twig} />
                  <rect
                    x={x - 12}
                    y={y - 7}
                    width="24"
                    height="14"
                    rx="2"
                    className={styles.module}
                  />
                  <path
                    d={`M${x - 7} ${y - 2}h9 m-9 4h14`}
                    className={styles.codeLine}
                  />
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r="26" className={styles.hub} />
            <text x={cx} y={cy + 4} textAnchor="middle">
              {name}
            </text>
          </g>
        );
      })}
      <circle cx="400" cy="400" r="42" className={styles.core} />
      <text x="400" y="406" textAnchor="middle" className={styles.coreLabel}>
        DELTA
      </text>
    </svg>
  );
}
function Ocean({ data }: { data: HistorianArchive }) {
  const root = useRef<HTMLDivElement>(null),
    [stage, setStage] = useState(0);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = Array.from(
        element.querySelectorAll<HTMLElement>("[data-depth]"),
      );
      let index = 0;
      sections.forEach((node, i) => {
        if (node.getBoundingClientRect().top <= window.innerHeight * 0.55)
          index = i;
      });
      const bounds = element.getBoundingClientRect(),
        progress = Math.max(
          0,
          Math.min(
            1,
            -bounds.top / Math.max(1, bounds.height - window.innerHeight),
          ),
        );
      element.style.setProperty("--descent", String(progress));
      element.style.setProperty("--reef-scale", String(0.38 + progress * 0.85));
      setStage((previous) => (previous === index ? previous : index));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(element);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);
  const jump = (index: number) =>
    root.current
      ?.querySelector<HTMLElement>(`[data-depth="${index}"]`)
      ?.scrollIntoView({
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
          .matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  return (
    <div className={styles.ocean} ref={root}>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.rays} />
        <div className={styles.particles} />
        <div className={styles.waterline} />
        <div className={styles.reefPosition}>
          <CodeReef stage={stage} />
        </div>
        <span className={styles.visualNote}>
          CODEBASE REEF / ILLUSTRATIVE STRUCTURE
        </span>
      </div>
      <nav className={styles.depthNav} aria-label="Ocean chapters">
        {chapters.map((chapter, i) => (
          <button
            key={chapter.zone}
            aria-label={`Go to ${chapter.name}`}
            aria-current={stage === i ? "step" : undefined}
            onClick={() => jump(i)}
          >
            <span className={styles.depthDot} />
            <span>{chapter.zone}</span>
          </button>
        ))}
      </nav>
      <div className={styles.story}>
        {chapters.map((chapter, index) => (
          <section
            key={chapter.zone}
            data-depth={index}
            className={styles.chapter}
            aria-label={chapter.name}
          >
            <div className={styles.chapterContent}>
              <span className={styles.eyebrow}>
                0{index + 1} / {chapter.zone} <span> {chapter.period}</span>
              </span>
              {index === 0 && (
                <p className={styles.kicker}>
                  THE HISTORIAN / AN EXPEDITION THROUGH DELTA
                </p>
              )}
              {index === 0 ? (
                <h1>{chapter.headline}</h1>
              ) : (
                <h2>{chapter.headline}</h2>
              )}
              <p className={styles.chapterCopy}>{chapter.copy}</p>
              {index === 0 && (
                <>
                  <p className={styles.archiveLine}>
                    {data.milestones.length} milestones ·{" "}
                    {data.snapshots.length} censuses · 5 repositories
                  </p>
                  <button className={styles.descend} onClick={() => jump(1)}>
                    Scroll to descend <span>↓</span>
                  </button>
                  <p className={styles.disclaimer}>
                    Depth and the growing reef tell the story visually. Measured
                    code size appears at the seafloor.
                  </p>
                </>
              )}
              {index > 0 && index < 5 && (
                <p className={styles.shift}>
                  ARCHITECTURE SHIFT <span>{chapter.name}</span>
                </p>
              )}
              {data.milestones
                .slice(...(chapter.range as [number, number]))
                .map((m) => (
                  <details className={styles.milestone} key={m.id}>
                    <summary>
                      <span>{date(m.date)}</span>
                      {m.title}
                      <b>+</b>
                    </summary>
                    <div className={styles.evidence}>
                      <p>{m.description}</p>
                      <h3>What changed</h3>
                      <p>{m.gained}</p>
                      <p className={styles.footnote}>
                        {m.confidence} confidence · {m.significance} ·{" "}
                        {m.tracks.map((t) => historyTracks[t] ?? t).join(" / ")}
                      </p>
                      <h3>Source evidence</h3>
                      {m.evidence.map((e) => (
                        <div key={e.ref}>
                          <p>{e.summary}</p>
                          <code>{e.ref}</code>
                        </div>
                      ))}
                      {m.omittedEvidence > 0 && (
                        <p>
                          {m.omittedEvidence} additional private local
                          references are retained in the original archive.
                        </p>
                      )}
                    </div>
                  </details>
                ))}
              {index === 5 && (
                <>
                  <div className={styles.censusStat}>
                    <span>182,107</span>
                    <b>→</b>
                    <strong>186,730</strong>
                    <small>source lines · +2.54%</small>
                  </div>
                  <button
                    className={styles.explore}
                    onClick={() =>
                      document
                        .getElementById("history-measurements")
                        ?.scrollIntoView({ block: "start" })
                    }
                  >
                    Explore the census evidence ↓
                  </button>
                  <p className={styles.disclaimer}>
                    Historical assessments, not present-day qualification. No
                    code-size estimates are interpolated between milestones.
                  </p>
                </>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
export default function HistorianHistory({
  preview = false,
}: {
  preview?: boolean;
}) {
  const [data, setData] = useState<HistorianArchive | null>(null),
    [error, setError] = useState(false),
    [reload, setReload] = useState(0),
    [metricId, setMetricId] = useState("source_loc");
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    fetch("/api/hq/historian", {
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value);
          setError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setData(null);
          setError(true);
        }
      });
    return () => controller.abort();
  }, [preview, reload]);
  if (!data)
    return (
      <section className={styles.panel} aria-label="Historian archive">
        <h2>Delta through time</h2>
        <p role="status">
          {preview
            ? "Sign in to the private workspace to explore the real Historian archive."
            : error
              ? "The Historian archive could not be loaded."
              : "Loading the Historian archive…"}
        </p>
        {error && (
          <button
            onClick={() => {
              setError(false);
              setReload((n) => n + 1);
            }}
          >
            Retry history
          </button>
        )}
      </section>
    );
  const metric =
      data.comparison.metrics.find((m) => m.metric_id === metricId) ??
      data.comparison.metrics[0],
    max = Math.max(metric.previous ?? 0, metric.current ?? 0, 1);
  return (
    <section className={styles.history} aria-label="Historian archive">
      <Ocean data={data} />
      <div className={styles.measurements} id="history-measurements">
        <header className={styles.measurementHeader}>
          <span className={styles.eyebrow}>
            THE SEAFLOOR / RECOVERED EVIDENCE
          </span>
          <h2>What lies beneath.</h2>
          <p>
            Two structural censuses. The original measurements, interpretations,
            and source trail.
          </p>
        </header>
        <div className={styles.grid}>
          <section
            className={styles.panel}
            aria-label="Census comparison chart"
          >
            <h3>The census, measured</h3>
            <div className={styles.toolbar}>
              <label>
                Census metric
                <select
                  value={metricId}
                  onChange={(e) => setMetricId(e.target.value)}
                >
                  {data.comparison.metrics.map((m) => (
                    <option value={m.metric_id} key={m.metric_id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div
              className={styles.metricChart}
              role="img"
              aria-label={`${metric.title}: ${number(metric.previous, metric.unit)} to ${number(metric.current, metric.unit)}`}
            >
              {[metric.previous, metric.current].map((value, i) => (
                <div className={styles.barRow} key={i}>
                  <span>
                    {date(data.snapshots[i].date).replace(", 2026", "")}
                  </span>
                  <div className={styles.track}>
                    <div
                      className={`${styles.bar} ${i === 0 ? styles.prior : ""}`}
                      style={{
                        width: `${value === null ? 0 : (value / max) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{number(value, metric.unit)}</strong>
                </div>
              ))}
            </div>
            <p className={styles.change}>
              {metric.absolute_change === null
                ? "Not comparable"
                : `${metric.absolute_change > 0 ? "+" : ""}${number(metric.absolute_change, metric.unit)}`}{" "}
              <small>
                {metric.percentage_change === null
                  ? "percentage unavailable"
                  : `${metric.percentage_change > 0 ? "+" : ""}${metric.percentage_change.toFixed(2)}%`}{" "}
                · recorded change
              </small>
            </p>
            <p className={styles.footnote}>
              Bars start at zero. Values and deltas come from the existing
              comparison report; gaps between censuses are not estimated.
            </p>
            {metricId === "unique_tests" && (
              <p>
                Counted tests cover the agent’s Node test definitions, not every
                repository’s test suite or passing test runs.
              </p>
            )}
            {metricId === "historian_milestones" && (
              <p>
                This metric counts the milestone files found by that census (5 →
                6). The separate origin-backfill timeline above contains 14
                entries and uses a different scope.
              </p>
            )}
          </section>
          <section
            className={styles.panel}
            aria-label="Historian interpretation"
          >
            <h3>What the growth meant</h3>
            <span className={styles.badge}>
              Recorded interpretation · {date(data.comparison.recordedAt)}
            </span>
            <p>{data.comparison.interpretation.summary}</p>
            <p>
              {data.comparison.interpretation.product_capability_assessment}
            </p>
            <p>
              {
                data.comparison.interpretation
                  .infrastructure_governance_assessment
              }
            </p>
            <p className={styles.footnote}>
              Structural growth is not a measure of intelligence or present-day
              reliability. Qualified-agent totals were not measured in either
              census.
            </p>
          </section>
        </div>
        <section className={styles.panel} aria-label="Repository census growth">
          <h3>Where the work happened</h3>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Source lines added</th>
                  <th>Test lines added</th>
                  <th>Documentation lines added</th>
                  <th>Commits</th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.repositories.map((r) => (
                  <tr key={r.repo}>
                    <th>{r.repo}</th>
                    <td>{number(r.metrics.source_loc.absolute_change)}</td>
                    <td>{number(r.metrics.test_loc.absolute_change)}</td>
                    <td>
                      {number(r.metrics.documentation_loc.absolute_change)}
                    </td>
                    <td>{r.commit_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>All recorded census measurements</summary>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>{date(data.snapshots[0].date)}</th>
                    <th>{date(data.snapshots[1].date)}</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {data.comparison.metrics.map((m) => (
                    <tr key={m.metric_id}>
                      <th>{m.title}</th>
                      <td>{number(m.previous, m.unit)}</td>
                      <td>{number(m.current, m.unit)}</td>
                      <td>{number(m.absolute_change, m.unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
        <section className={styles.panel}>
          <details>
            <summary>Archive provenance and measurement limits</summary>
            <p>
              Methodology: <code>{data.comparison.methodology}</code>. Source
              repository: delta-agent, committed revision{" "}
              <code>{data.sourceCommit}</code>.
            </p>
            <ul>
              {data.comparison.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
              <li>
                Some architecture and qualification fields were partial or
                missing even though the aggregate census was marked complete.
              </li>
              <li>
                The current live source census uses a different projection. It
                is not appended to this historical series as if it were the same
                measurement.
              </li>
            </ul>
            <ul>
              {data.provenance.map((p) => (
                <li key={p.path}>
                  <code>{p.path}</code>
                  <br />
                  <code>SHA-256 {p.sha256}</code>
                </li>
              ))}
            </ul>
          </details>
        </section>{" "}
      </div>
    </section>
  );
}
