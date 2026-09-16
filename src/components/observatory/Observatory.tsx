"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Database,
  FileCheck2,
  GitBranch,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Network,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import ArchitectureGraph from "./ArchitectureGraph";
import {
  freshness,
  reportReply,
  type GraphNode,
  type ObservatoryReport,
  type Section,
} from "@/lib/observatory";
import { requestJson } from "@/lib/requestJson";
import styles from "./Observatory.module.css";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "census", label: "System census", icon: Layers3 },
  { id: "quality", label: "Quality & trust", icon: ShieldCheck },
] as const;
function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className={styles.clock}>
      <Clock3 size={13} />
      <time>{time || "--:--:--"}</time>
      <span>NEW YORK</span>
    </div>
  );
}
function timestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Observatory({
  initialReport,
  preview = false,
}: {
  initialReport: ObservatoryReport | null;
  preview?: boolean;
}) {
  const [report, setReport] = useState(initialReport);
  const [section, setSection] = useState<Section>("overview");
  const [days, setDays] = useState(30);
  const [graphId, setGraphId] = useState("systems");
  const [repo, setRepo] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [revision, setRevision] = useState(0);
  const [compact, setCompact] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "owner" | "delta"; text: string }[]
  >([]);
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const refreshLock = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  async function refresh() {
    if (preview) {
      setNotice("Synthetic preview. No private report requested.");
      return;
    }
    if (refreshLock.current) return;
    refreshLock.current = true;
    setRefreshing(true);
    try {
      const response = await requestJson("/api/hq/report", {}, 10000);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setReport(null);
          setMessages([]);
        }
        throw new Error("unavailable");
      }
      // Only the authenticated server emits this validated projection.
      const next = response.data as ObservatoryReport;
      if (!next || next.version !== 1 || next.synthetic)
        throw new Error("invalid");
      setNotice(
        next.generatedAt === report?.generatedAt
          ? "No newer snapshot. Source refresh remains a separate export."
          : "Latest published snapshot loaded.",
      );
      setReport(next);
      setSelected(null);
    } catch {
      setNotice(
        "Report refresh unavailable. No source refresh or background action was run.",
      );
    } finally {
      refreshLock.current = false;
      setRefreshing(false);
    }
  }
  function ask(input: string) {
    if (!input.trim() || !report) return;
    const reply = reportReply(input, report);
    setMessages((value) =>
      [
        ...value,
        { role: "owner" as const, text: input.slice(0, 500) },
        { role: "delta" as const, text: reply.text },
      ].slice(-16),
    );
    if (reply.section) setSection(reply.section);
    if (reply.days) setDays(reply.days);
    if (reply.repo) {
      setRepo(reply.repo);
      setGraphId("systems");
      setQuery("");
    }
    if (reply.rebuild) setRevision((value) => value + 1);
    setChatInput("");
  }
  const graph =
    report?.graphs.find((item) => item.id === graphId) || report?.graphs[0];
  const state = report ? freshness(report.generatedAt, now) : "unavailable";
  const snapshots = report
    ? [
        ...report.history,
        {
          generatedAt: report.generatedAt,
          sourceCommit: report.sourceCommit,
          census: report.census,
        },
      ].filter(
        (point) => Date.parse(point.generatedAt) >= now - days * 86400000,
      )
    : [];
  const nodes =
    graph?.nodes.filter(
      (node) =>
        (repo === "all" || node.group === repo) &&
        node.label.toLowerCase().includes(query.toLowerCase()),
    ) || [];
  return (
    <div className={`${styles.shell} ${compact ? styles.compact : ""}`}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>Δ</span> delta
          <span className={styles.brandSuffix}>/ observatory</span>
        </Link>
        <div className={styles.workspace}>
          <span className={styles.avatar}>D</span>
          <div>
            Personal workspace<small>Owner access only</small>
          </div>
          <LockKeyhole size={13} />
        </div>
        <span className={styles.navLabel}>WORKSPACE</span>
        <nav aria-label="Observatory sections">
          {navigation.map((item) => (
            <button
              key={item.id}
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setSection(item.id)}
            >
              <item.icon size={17} />
              {item.label}
              {section === item.id && <span className={styles.navDot} />}
            </button>
          ))}
        </nav>
        <span className={styles.navLabel}>SOURCE REPOSITORIES</span>
        <nav aria-label="Repository focus">
          {["agent", "backend", "site", "mobile", "jobs"].map((id) => (
            <button
              key={id}
              onClick={() => {
                setRepo(id);
                setSection("architecture");
                setGraphId("systems");
              }}
            >
              <GitBranch size={15} />
              delta-{id}
              <ChevronRight size={13} />
            </button>
          ))}
        </nav>
        <div className={styles.sideBottom}>
          <div>
            <ShieldCheck size={16} />
            <span>Read-only by design</span>
          </div>
          <p>No execution authority</p>
          <Link href="/account">
            Account <ArrowRight size={14} />
          </Link>
        </div>
      </aside>
      <div className={styles.body}>
        <header className={styles.topbar}>
          <span>
            <span className={styles.breadcrumb}>Workspace</span>
            <ChevronRight size={13} />
            {navigation.find((item) => item.id === section)?.label}
          </span>
          <Clock />
          <button
            title="Toggle command panel"
            aria-label="Toggle command panel"
            onClick={() => setChatOpen((value) => !value)}
          >
            <Command size={17} />
          </button>
        </header>
        {preview && (
          <div className={styles.preview}>
            SYNTHETIC DESIGN PREVIEW · NOT LIVE DELTA DATA · NO AUTHENTICATION
            BYPASS
          </div>
        )}
        <div
          className={`${styles.contentGrid} ${!chatOpen ? styles.noChat : ""}`}
        >
          <main className={styles.main}>
            <div className={styles.heading}>
              <div>
                <p className={styles.eyebrow}>DELTA INTELLIGENCE OS</p>
                <h1>
                  {section === "overview"
                    ? "Your system, in focus."
                    : navigation.find((item) => item.id === section)?.label}
                </h1>
                <p className={styles.subtitle}>
                  {report
                    ? `Committed source snapshot · ${timestamp(report.generatedAt)} ET`
                    : "Private reporting is not connected yet."}
                </p>
              </div>
              <button
                className={styles.refresh}
                disabled={refreshing}
                onClick={refresh}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? styles.spin : ""}
                />
                {refreshing ? "Loading" : "Refresh report"}
              </button>
            </div>
            {notice && (
              <p className={styles.notice} role="status">
                {notice}
              </p>
            )}
            {!report ? (
              <section className={styles.unavailable}>
                <Database size={32} />
                <h2>No verified report available</h2>
                <p>
                  No architecture, activity, or health values have been
                  substituted. Connect the private snapshot source to begin.
                </p>
                <Link href="/account">
                  Back to account <ArrowRight size={16} />
                </Link>
              </section>
            ) : (
              <>
                <div className={styles.statusLine}>
                  <span
                    className={`${styles.status} ${state !== "recent" ? styles.warn : ""}`}
                  >
                    <span className={styles.dot} />
                    {state === "recent"
                      ? "Recent snapshot"
                      : state === "invalid"
                        ? "Timestamp needs review"
                        : "Snapshot is stale"}
                  </span>
                  <span>
                    Source <code>{report.sourceCommit.slice(0, 8)}</code>
                  </span>
                  <span>Architecture v{report.architectureVersion}</span>
                  <span className={styles.readOnly}>
                    <LockKeyhole size={12} /> PRIVATE
                  </span>
                </div>
                <section className={styles.stats} aria-label="Source census">
                  {[
                    {
                      label: "Repositories",
                      value: report.repositories.length,
                      note: "Committed main branches",
                      icon: GitBranch,
                    },
                    {
                      label: "Systems",
                      value: report.census.systems,
                      note: "Declared architecture",
                      icon: Network,
                    },
                    {
                      label: "Capabilities",
                      value: report.census.capabilities,
                      note: "Registered, not usage",
                      icon: Layers3,
                    },
                    {
                      label: "Runtime tools",
                      value: report.census.tools,
                      note: "Registered handlers",
                      icon: Activity,
                    },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className={styles.statLabel}>
                        {stat.label}
                        <stat.icon size={15} />
                      </div>
                      <strong>{stat.value.toLocaleString()}</strong>
                      <small>{stat.note}</small>
                    </div>
                  ))}
                </section>
                {(section === "overview" || section === "architecture") &&
                  graph && (
                    <section className={styles.graphSection}>
                      <div className={styles.sectionHead}>
                        <div>
                          <h2>System architecture</h2>
                          <p>Explicit relationships. No inferred authority.</p>
                        </div>
                        <button
                          title="Rebuild graph layout"
                          aria-label="Rebuild graph layout"
                          onClick={() => {
                            setRevision((value) => value + 1);
                            setNotice(
                              "Layout rebuilt. Snapshot and source revision are unchanged.",
                            );
                          }}
                        >
                          <RefreshCw size={15} />
                        </button>
                      </div>
                      <div className={styles.graphToolbar}>
                        <div role="tablist" aria-label="Graph layer">
                          {report.graphs.map((item) => (
                            <button
                              role="tab"
                              aria-selected={graph.id === item.id}
                              key={item.id}
                              onClick={() => {
                                setGraphId(item.id);
                                setSelected(null);
                                setQuery("");
                                setRepo("all");
                              }}
                            >
                              {item.id === "modules"
                                ? "Graphify code"
                                : item.id === "systems"
                                  ? "Systems"
                                  : "Capabilities"}
                            </button>
                          ))}
                        </div>
                        <label className={styles.search}>
                          <Search size={14} />
                          <input
                            aria-label="Find a node"
                            placeholder="Find a node..."
                            value={query}
                            onChange={(event) => {
                              setQuery(event.target.value);
                              setSelected(null);
                            }}
                          />
                        </label>
                        <select
                          aria-label="Repository filter"
                          value={repo}
                          onChange={(event) => {
                            setRepo(event.target.value);
                            setSelected(null);
                          }}
                        >
                          <option value="all">All repositories</option>
                          {["agent", "backend", "site", "mobile", "jobs"].map(
                            (id) => (
                              <option key={id}>{id}</option>
                            ),
                          )}
                        </select>
                      </div>
                      <ArchitectureGraph
                        graph={graph}
                        query={query}
                        repo={repo}
                        revision={revision}
                        onSelect={setSelected}
                      />
                      <div className={styles.legend}>
                        {[
                          ["Agent", "agent"],
                          ["Backend", "backend"],
                          ["Site", "site"],
                          ["Mobile", "mobile"],
                          ["Jobs", "jobs"],
                        ].map(([label, group]) => (
                          <span key={group}>
                            <i data-group={group} />
                            {label}
                          </span>
                        ))}
                        <small>
                          {graph.id === "modules"
                            ? "Graphify static AST projection"
                            : "Registry projection · Graphify-compatible"}
                        </small>
                      </div>
                      <div className={styles.provenance}>
                        <FileCheck2 size={14} />
                        <span>
                          Graph source{" "}
                          <code>{graph.sourceCommit.slice(0, 8)}</code> ·{" "}
                          {timestamp(graph.generatedAt)} ET
                          {graph.sourceCommit !== report.sourceCommit
                            ? " · Historical graph; differs from current snapshot"
                            : ""}
                        </span>
                      </div>
                      <details className={styles.nodeList}>
                        <summary>Browse {nodes.length} nodes</summary>
                        <div>
                          {nodes.slice(0, 100).map((node) => (
                            <button
                              key={node.id}
                              onClick={() => setSelected(node)}
                            >
                              {node.label}
                              <ChevronRight size={12} />
                            </button>
                          ))}
                        </div>
                        {nodes.length > 100 && (
                          <p>First 100 shown. Narrow your search.</p>
                        )}
                      </details>
                      {selected && (
                        <div className={styles.detail}>
                          <div>
                            <span className={styles.eyebrow}>
                              {selected.kind}
                            </span>
                            <h3>{selected.label}</h3>
                            <p>
                              Owner group: {selected.group} · Declared maturity:{" "}
                              {selected.maturity}
                            </p>
                            <code>{selected.id}</code>
                          </div>
                          <button
                            title="Close node detail"
                            aria-label="Close node detail"
                            onClick={() => setSelected(null)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                {(section === "overview" || section === "census") && (
                  <section className={styles.censusSection}>
                    <div className={styles.sectionHead}>
                      <div>
                        <h2>Source census</h2>
                        <p>
                          A revision-bound inventory, not a performance score.
                        </p>
                      </div>
                      <select
                        aria-label="History timeframe"
                        value={days}
                        onChange={(event) =>
                          setDays(Number(event.target.value))
                        }
                      >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                      </select>
                    </div>
                    <div className={styles.tableWrap}>
                      <table>
                        <thead>
                          <tr>
                            <th>Repository</th>
                            <th>Source revision</th>
                            <th>Tracked files</th>
                            <th>Test files</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.repositories.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <GitBranch size={14} />
                                {item.label}
                              </td>
                              <td>
                                <code>{item.sha.slice(0, 8)}</code>
                              </td>
                              <td>{item.files.toLocaleString()}</td>
                              <td>{item.testFiles.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.ownership}>
                      <div>
                        <strong>{report.census.resolved}</strong>
                        <span>Single system mapping</span>
                      </div>
                      <div>
                        <strong>{report.census.ambiguous}</strong>
                        <span>Ambiguous mapping</span>
                      </div>
                      <div>
                        <strong>{report.census.unmapped}</strong>
                        <span>No explicit mapping</span>
                      </div>
                    </div>
                    <details className={styles.history}>
                      <summary>
                        {snapshots.length} recorded snapshot
                        {snapshots.length === 1 ? "" : "s"} in this window
                      </summary>
                      {snapshots.map((point) => (
                        <div key={point.generatedAt}>
                          <span>{timestamp(point.generatedAt)}</span>
                          <code>{point.sourceCommit.slice(0, 8)}</code>
                          <span>{point.census.capabilities} capabilities</span>
                        </div>
                      ))}
                      {snapshots.length < 2 && (
                        <p>Not enough recorded history to establish a trend.</p>
                      )}
                    </details>
                  </section>
                )}
                {(section === "overview" || section === "quality") && (
                  <section className={styles.qualitySection}>
                    <div className={styles.sectionHead}>
                      <div>
                        <h2>Trust before totals.</h2>
                        <p>What this report can and cannot prove.</p>
                      </div>
                      <ShieldCheck size={18} />
                    </div>
                    <div className={styles.checks}>
                      {[
                        {
                          title: "Closed-world report validation",
                          detail:
                            "Bounded fields, graph references and provenance checked.",
                          pass: true,
                        },
                        {
                          title: "Source freshness",
                          detail: `${state === "recent" ? "Export is within the 26-hour window." : "A new source export is required."} This is not deployment parity.`,
                          pass: state === "recent",
                        },
                        {
                          title: "CI & deployed revision",
                          detail:
                            "No authenticated CI or deployment evidence supplied.",
                          pass: false,
                        },
                        {
                          title: "Runtime participation & spending",
                          detail:
                            "No runtime events or billing evidence supplied. Unknown, not zero.",
                          pass: false,
                        },
                      ].map((check) => (
                        <div key={check.title}>
                          {check.pass ? (
                            <Check size={17} />
                          ) : (
                            <CircleHelp size={17} />
                          )}
                          <div>
                            <h3>{check.title}</h3>
                            <p>{check.detail}</p>
                          </div>
                          <span>
                            {check.pass ? "Verified" : "Not established"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
            <footer className={styles.footer}>
              <span>Δ · A clearer view of Delta.</span>
              <span>Source evidence ≠ runtime evidence</span>
            </footer>
          </main>
          {chatOpen && (
            <aside
              className={styles.commandPanel}
              aria-label="Report command panel"
            >
              <div className={styles.commandHeader}>
                <span className={styles.commandMark}>
                  <Command size={18} />
                </span>
                <div>
                  <h2>Ask your workspace</h2>
                  <p>Local report commands</p>
                </div>
                <button
                  title="Close command panel"
                  aria-label="Close command panel"
                  onClick={() => setChatOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>
              <div className={styles.chatIntro}>
                <span className={styles.eyebrow}>A LITTLE CLARITY</span>
                <h3>
                  What would you like
                  <br />
                  to look into?
                </h3>
                <p>Explore the report. Keep control.</p>
              </div>
              <div className={styles.suggestions}>
                {[
                  "Show architecture",
                  "Where are the quality gaps?",
                  "Show census for 7 days",
                ].map((text) => (
                  <button
                    key={text}
                    disabled={!report}
                    onClick={() => ask(text)}
                  >
                    {text}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
              <div
                className={styles.messages}
                role="log"
                aria-label="Report conversation"
              >
                {messages.map((message, i) => (
                  <div key={i} data-role={message.role}>
                    <span>{message.role === "owner" ? "YOU" : "DELTA"}</span>
                    <p>{message.text}</p>
                  </div>
                ))}
              </div>
              <form
                className={styles.chatForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  ask(chatInput);
                }}
              >
                <label htmlFor="observatory-command">Report command</label>
                <textarea
                  id="observatory-command"
                  placeholder="Ask about this snapshot..."
                  maxLength={500}
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  rows={2}
                />
                <div>
                  <span>
                    <LockKeyhole size={11} /> No model calls
                  </span>
                  <button
                    title="Send command"
                    aria-label="Send command"
                    disabled={!report || !chatInput.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
              <div className={styles.preferences}>
                <SlidersHorizontal size={14} />
                <label>
                  Compact view
                  <input
                    type="checkbox"
                    checked={compact}
                    onChange={(event) => setCompact(event.target.checked)}
                  />
                </label>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
