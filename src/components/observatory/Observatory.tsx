"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquare,
  Network,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import ArchitectureGraph from "./ArchitectureGraph";
import RuntimeOverview from "./RuntimeOverview";
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
  { id: "quality", label: "Activity & quality", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
function readSection(): Section {
  const hash = window.location.hash.slice(1);
  return ["overview", "architecture", "census", "quality", "settings"].includes(
    hash,
  )
    ? (hash as Section)
    : "overview";
}
function navigate(section: Section) {
  if (readSection() === section) return;
  window.history.pushState(null, "", "#" + section);
  window.dispatchEvent(new PopStateEvent("popstate"));
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
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className={styles.clock}>
      <Clock3 size={14} />
      <time>{time || "--:--:--"}</time>
      <span>ET</span>
    </div>
  );
}
export default function Observatory({
  initialReport,
  preview = false,
}: {
  initialReport: ObservatoryReport | null;
  preview?: boolean;
}) {
  const [report, setReport] = useState(initialReport);
  const section = useSyncExternalStore(
    subscribe,
    readSection,
    () => "overview" as Section,
  );
  const [days, setDays] = useState(30);
  const [graphId, setGraphId] = useState("systems");
  const [repo, setRepo] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [revision, setRevision] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "owner" | "delta"; text: string }[]
  >([]);
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const refreshLock = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const chatField = useRef<HTMLTextAreaElement>(null);
  const chatToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (chatOpen) chatField.current?.focus();
  }, [chatOpen]);
  function closeChat() {
    setChatOpen(false);
    chatToggle.current?.focus();
  }
  async function refresh() {
    if (preview || refreshLock.current) return;
    refreshLock.current = true;
    setRefreshing(true);
    setNotice("");
    try {
      const response = await requestJson("/api/hq/report", {}, 10000);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setReport(null);
          setMessages([]);
          setSelected(null);
        }
        throw new Error("unavailable");
      }
      const next = response.data as ObservatoryReport;
      if (!next || next.version !== 1 || next.synthetic)
        throw new Error("invalid");
      setNotice(
        next.generatedAt === report?.generatedAt
          ? "You have the latest published snapshot."
          : "Snapshot updated.",
      );
      setReport(next);
      setSelected(null);
    } catch {
      setNotice("Could not load the report. Check your session and try again.");
    } finally {
      refreshLock.current = false;
      setRefreshing(false);
    }
  }
  async function signOut() {
    if (signingOut || preview) return;
    setSigningOut(true);
    setReport(null);
    setSelected(null);
    setMessages([]);
    try {
      const response = await requestJson(
        "/api/hq/signout",
        { method: "POST" },
        10000,
      );
      if (!response.ok) throw new Error("unavailable");
      window.location.replace("/login?redirect=%2Fhq");
    } catch {
      setNotice(
        "Sign-out could not be confirmed. Your report has been cleared. Please retry.",
      );
      setSigningOut(false);
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
    if (reply.section) navigate(reply.section);
    if (reply.days) setDays(reply.days);
    if (reply.repo) {
      setRepo(reply.repo);
      setGraphId("systems");
      setQuery("");
      setSelected(null);
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
        (node.label + " " + node.kind)
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) || [];
  const links =
    graph?.links.filter(
      (link) => link.source === selected?.id || link.target === selected?.id,
    ) || [];
  const activity = section === "quality" || section === "census";
  const title =
    section === "overview"
      ? "Your system, at a glance."
      : section === "architecture"
        ? "Architecture"
        : activity
          ? "Activity & quality"
          : "Workspace settings";
  const previous = report?.history.at(-1);
  const delta =
    report && previous
      ? report.census.capabilities - previous.census.capabilities
      : null;
  return (
    <div className={styles.shell}>
      <a href="#workspace-content" className={styles.skip}>
        Skip to workspace
      </a>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/delta-logo.svg"
            alt="Delta"
            width={38}
            height={38}
            priority
          />
          <span>
            Delta<small>Owner workspace</small>
          </span>
        </Link>
        <nav aria-label="Workspace navigation">
          {navigation.map((item, index) => (
            <a
              key={item.id}
              href={"#" + item.id}
              aria-current={
                section === item.id ||
                (item.id === "quality" && section === "census")
                  ? "page"
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                navigate(item.id);
              }}
            >
              <span className={styles.navIndex} aria-hidden="true">
                0{index + 1}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className={styles.sideBottom}>
          <span>
            <LockKeyhole size={14} />
            {preview ? "Design sandbox" : "Private workspace"}
          </span>
          <Link href="/">
            Delta website <ArrowUpRight size={15} />
          </Link>
          {preview ? (
            <Link href="/login?redirect=%2Fhq">
              Sign in <ArrowRight size={15} />
            </Link>
          ) : (
            <button onClick={signOut} disabled={signingOut}>
              <LogOut size={15} />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          )}
        </div>
      </aside>
      <div className={styles.body}>
        <header className={styles.topbar}>
          <span>
            Workspace <ChevronRight size={14} />
            <strong>
              {activity
                ? "Activity & quality"
                : navigation.find((n) => n.id === section)?.label}
            </strong>
          </span>
          <Clock />
          <button
            ref={chatToggle}
            title="Ask Delta"
            aria-label="Ask Delta"
            aria-expanded={chatOpen}
            onClick={() => setChatOpen((value) => !value)}
          >
            <MessageSquare size={17} />
            <span>Ask Delta</span>
          </button>
        </header>
        {preview && (
          <div className={styles.preview}>
            <span>Synthetic design sandbox. Not your live system.</span>
            <Link href="/hq">
              Open private workspace <ArrowRight size={14} />
            </Link>
          </div>
        )}
        <main key={section} id="workspace-content" className={styles.main}>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>
                DELTA /{" "}
                {section === "architecture" ? "SYSTEM MAP" : "INTELLIGENCE OS"}
              </p>
              <h1>{title}</h1>
              <p>
                {report
                  ? "Snapshot " + timestamp(report.generatedAt) + " ET"
                  : "No published snapshot available."}
              </p>
            </div>
            <button
              className={styles.refresh}
              title={
                preview
                  ? "Report refresh requires the authenticated workspace"
                  : "Load the latest published report"
              }
              disabled={preview || refreshing}
              onClick={refresh}
            >
              <RefreshCw size={15} className={refreshing ? styles.spin : ""} />
              {refreshing ? "Refreshing..." : "Refresh report"}
            </button>
          </div>
          {notice && (
            <p role="status" className={styles.notice}>
              {notice}
            </p>
          )}
          {(section === "overview" || section === "quality") && <RuntimeOverview preview={preview} />}
          {section === "settings" ? (
            <section className={styles.settings}>
              <h2>Access & data</h2>
              <dl>
                <div>
                  <dt>Access</dt>
                  <dd>
                    {preview
                      ? "Synthetic preview. No authenticated session."
                      : "Server-verified owner only"}
                  </dd>
                </div>
                <div>
                  <dt>Snapshot source</dt>
                  <dd>
                    {report && !preview
                      ? "Private committed-source projection"
                      : "Not connected in this preview"}
                  </dd>
                </div>
                <div>
                  <dt>Daily delivery</dt>
                  <dd>Not activated</dd>
                </div>
                <div>
                  <dt>Freshness window</dt>
                  <dd>26 hours</dd>
                </div>
                <div>
                  <dt>Display timezone</dt>
                  <dd>America/New_York</dd>
                </div>
                <div>
                  <dt>Chat</dt>
                  <dd>
                    Local report commands. No model access or system changes.
                  </dd>
                </div>
              </dl>
              <div className={styles.settingsActions}>
                {preview ? (
                  <Link className={styles.primary} href="/login?redirect=%2Fhq">
                    Sign in to Delta <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link href="/account">
                      Account details <ArrowUpRight size={15} />
                    </Link>
                    <button onClick={signOut} disabled={signingOut}>
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </section>
          ) : !report ? (
            <section className={styles.empty}>
              <ShieldCheck size={32} />
              <h2>No verified report available</h2>
              <p>
                {notice
                  ? "Your session or report source needs attention."
                  : "The private report source has not been connected. No example values have been substituted."}
              </p>
              <Link className={styles.primary} href="/login?redirect=%2Fhq">
                Sign in to the workspace <ArrowRight size={16} />
              </Link>
            </section>
          ) : (
            <>
              <div className={styles.statusLine}>
                <span
                  className={state === "recent" ? styles.status : styles.warn}
                >
                  <i />
                  {preview
                    ? "Synthetic snapshot"
                    : state === "recent"
                      ? "Recent source snapshot"
                      : state === "stale"
                        ? "Stale source snapshot"
                        : "Timestamp needs review"}
                </span>
                <code>{report.sourceCommit.slice(0, 8)}</code>
                <span>Architecture {report.architectureVersion}</span>
                <span className={styles.scopeNote}>
                  Source evidence, not runtime activity
                </span>
              </div>
              {section === "overview" && (
                <>
                  <section className={styles.stats} aria-label="Source census">
                    {[
                      [
                        "Repositories",
                        report.repositories.length,
                        "Source roots",
                      ],
                      ["Systems", report.census.systems, "Declared systems"],
                      [
                        "Capabilities",
                        report.census.capabilities,
                        "Registered capabilities",
                      ],
                      [
                        "Runtime tools",
                        report.census.tools,
                        "Registered handlers",
                      ],
                    ].map(([label, value, detail]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong>{Number(value).toLocaleString()}</strong>
                        <small>{detail}</small>
                      </div>
                    ))}
                  </section>
                  <section className={styles.overviewGrid}>
                    <div>
                      <div className={styles.sectionHead}>
                        <h2>Needs attention</h2>
                        <button onClick={() => navigate("quality")}>
                          View quality <ArrowRight size={15} />
                        </button>
                      </div>
                      <div className={styles.attention}>
                        <span className={styles.number}>01</span>
                        <div>
                          <h3>
                            {report.census.unmapped} capabilities without an
                            explicit system mapping
                          </h3>
                          <p>
                            {report.census.ambiguous} have multiple mappings.
                            Registration alone does not establish execution
                            authority.
                          </p>
                        </div>
                      </div>
                      <div className={styles.attention}>
                        <span className={styles.number}>02</span>
                        <div>
                          <h3>Runtime health is not established</h3>
                          <p>
                            CI, deployed revisions, execution events and spend
                            are not connected to this report.
                          </p>
                        </div>
                      </div>
                      <div className={styles.changeSummary}>
                        <span className={styles.eyebrow}>
                          SINCE THE PREVIOUS SNAPSHOT
                        </span>
                        <strong>
                          {delta === null
                            ? "--"
                            : (delta > 0 ? "+" : "") + delta}
                        </strong>
                        <p>
                          {delta === null
                            ? "One snapshot. No change history yet."
                            : "Net change in registered capabilities."}
                        </p>
                        <button onClick={() => navigate("quality")}>
                          Open history <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.overviewMap}>
                      <div className={styles.sectionHead}>
                        <div>
                          <p className={styles.eyebrow}>
                            01 / CONNECTED STRUCTURE
                          </p>
                          <h2>Inside Delta</h2>
                        </div>
                        <button
                          title="Open architecture map"
                          aria-label="Open architecture map"
                          onClick={() => {
                            setRepo("all");
                            navigate("architecture");
                          }}
                        >
                          <ArrowUpRight size={20} />
                        </button>
                      </div>
                      <ArchitectureGraph
                        graph={
                          report.graphs.find((item) => item.id === "systems") ||
                          report.graphs[0]
                        }
                        query=""
                        repo="all"
                        revision={revision}
                        onSelect={(node) => {
                          setSelected(node);
                          setGraphId("systems");
                          setRepo("all");
                          setQuery("");
                          navigate("architecture");
                        }}
                      />
                      <p className={styles.mapNote}>
                        Declared relationships ·{" "}
                        {preview
                          ? "Synthetic preview"
                          : "Committed source snapshot"}
                      </p>
                    </div>
                  </section>
                  <div className={styles.sectionHead}>
                    <div>
                      <h2>System directory</h2>
                      <p>
                        {report.repositories.length} repositories in the source
                        snapshot
                      </p>
                    </div>
                    <button
                      className={styles.primary}
                      onClick={() => {
                        setRepo("all");
                        navigate("architecture");
                      }}
                    >
                      Explore architecture <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className={styles.repoList}>
                    {report.repositories.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setRepo(item.id);
                          setQuery("");
                          setSelected(null);
                          setGraphId("systems");
                          navigate("architecture");
                        }}
                      >
                        <span className={styles.repoIcon} data-repo={item.id}>
                          <GitBranch size={18} />
                        </span>
                        <span>
                          <strong>{item.label}</strong>
                          <small>
                            {item.files.toLocaleString()} tracked files ·{" "}
                            {item.testFiles} test files
                          </small>
                        </span>
                        <code>{item.sha.slice(0, 8)}</code>
                        <ArrowUpRight size={18} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {section === "architecture" && graph && (
                <>
                  <div className={styles.graphToolbar}>
                    <div role="tablist" aria-label="Graph layer">
                      {report.graphs.map((item) => (
                        <button
                          key={item.id}
                          role="tab"
                          aria-selected={graph.id === item.id}
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
                      <Search size={16} />
                      <input
                        aria-label="Find a node"
                        placeholder="Find a node"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setSelected(null);
                        }}
                      />
                      {query && (
                        <button
                          aria-label="Clear search"
                          onClick={() => setQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <select
                      aria-label="Repository filter"
                      value={repo}
                      onChange={(e) => {
                        setRepo(e.target.value);
                        setSelected(null);
                      }}
                    >
                      <option value="all">All repositories</option>
                      {report.repositories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <button
                      title="Rebuild layout from the same snapshot"
                      aria-label="Rebuild graph layout"
                      onClick={() => {
                        setRevision((value) => value + 1);
                        setNotice("Layout rebuilt. Source data is unchanged.");
                      }}
                    >
                      <RefreshCw size={17} />
                    </button>
                  </div>
                  <div className={styles.mapWorkspace}>
                    <ArchitectureGraph
                      graph={graph}
                      query={query}
                      repo={repo}
                      revision={revision}
                      onSelect={setSelected}
                    />
                    <aside
                      className={styles.inspector}
                      aria-label="Node inspector"
                    >
                      <div className={styles.sectionHead}>
                        <h2>{selected ? "Selected node" : "Nodes"}</h2>
                        {selected && (
                          <button
                            aria-label="Close node detail"
                            onClick={() => setSelected(null)}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {selected ? (
                        <>
                          <span className={styles.eyebrow}>
                            {selected.kind}
                          </span>
                          <h3>{selected.label}</h3>
                          <dl>
                            <dt>Repository group</dt>
                            <dd>{selected.group}</dd>
                            <dt>Declared status</dt>
                            <dd>{selected.maturity}</dd>
                          </dl>
                          <code>{selected.id}</code>
                          <h4>Relationships ({links.length})</h4>
                          <ul>
                            {links.map((link, i) => {
                              const id =
                                link.source === selected.id
                                  ? link.target
                                  : link.source;
                              const related = graph.nodes.find(
                                (node) => node.id === id,
                              );
                              return (
                                <li key={i}>
                                  <span>{link.relation}</span>
                                  <button
                                    onClick={() => setSelected(related || null)}
                                  >
                                    {related?.label || id}
                                    <ChevronRight size={14} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        <>
                          <p>{nodes.length} matching nodes</p>
                          <div className={styles.nodeList}>
                            {nodes.slice(0, 100).map((node) => (
                              <button
                                key={node.id}
                                onClick={() => setSelected(node)}
                              >
                                <span>
                                  {node.label}
                                  <small>{node.kind}</small>
                                </span>
                                <ChevronRight size={14} />
                              </button>
                            ))}
                          </div>
                          {nodes.length > 100 && (
                            <p>First 100 shown. Narrow the search.</p>
                          )}
                        </>
                      )}
                    </aside>
                  </div>
                  <div className={styles.provenance}>
                    <span>
                      {graph.id === "modules"
                        ? "Graphify · static code relationships"
                        : "Architecture registry · explicit relationships"}
                    </span>
                    <span>
                      {timestamp(graph.generatedAt)} ET ·{" "}
                      <code>{graph.sourceCommit.slice(0, 8)}</code>
                      {graph.sourceCommit !== report.sourceCommit &&
                        " · Historical extraction"}
                    </span>
                  </div>
                </>
              )}
              {activity && (
                <>
                  <div className={styles.sectionHead}>
                    <h2>Snapshot history</h2>
                    <select
                      aria-label="History timeframe"
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
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
                          <th>Observed</th>
                          <th>Source revision</th>
                          <th>Capabilities</th>
                          <th>Tools</th>
                          <th>Unmapped</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...snapshots].reverse().map((point) => (
                          <tr key={point.generatedAt}>
                            <td>{timestamp(point.generatedAt)} ET</td>
                            <td>
                              <code>{point.sourceCommit.slice(0, 8)}</code>
                            </td>
                            <td>{point.census.capabilities}</td>
                            <td>{point.census.tools}</td>
                            <td>{point.census.unmapped}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {snapshots.length < 2 && (
                    <p className={styles.muted}>
                      Not enough recorded history to establish a trend.
                    </p>
                  )}
                  <div className={styles.sectionHead}>
                    <h2>Evidence quality</h2>
                    <ShieldCheck size={18} />
                  </div>
                  <div className={styles.checks}>
                    {[
                      {
                        title: "Report contract",
                        detail:
                          "Closed fields, source revisions and graph references validated.",
                        pass: true,
                      },
                      {
                        title: "Source freshness",
                        detail:
                          state === "recent"
                            ? "Within the 26-hour source window. Not a deployment check."
                            : "A fresh source export is required.",
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
                          "No runtime events or billing evidence supplied.",
                        pass: false,
                      },
                    ].map((check) => (
                      <div key={check.title}>
                        <span
                          className={
                            check.pass ? styles.passIcon : styles.unknownIcon
                          }
                        >
                          {check.pass ? <Check size={16} /> : <span>?</span>}
                        </span>
                        <div>
                          <h3>{check.title}</h3>
                          <p>{check.detail}</p>
                        </div>
                        <span>{check.pass ? "Verified" : "Not connected"}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.sectionHead}>
                    <h2>Source census</h2>
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
                            <td>{item.label}</td>
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
                </>
              )}
            </>
          )}
        </main>
      </div>
      {chatOpen && (
        <aside
          className={styles.commandPanel}
          aria-label="Report command panel"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeChat();
          }}
        >
          <div className={styles.sectionHead}>
            <h2>
              <MessageSquare size={18} />
              Ask Delta
            </h2>
            <button
              title="Close chat"
              aria-label="Close command panel"
              onClick={closeChat}
            >
              <X size={18} />
            </button>
          </div>
          <p className={styles.muted}>
            This snapshot only. Local commands, no model calls.
          </p>
          <div className={styles.suggestions}>
            {[
              "Show architecture",
              "Where are the quality gaps?",
              "Show census for 7 days",
            ].map((text) => (
              <button key={text} disabled={!report} onClick={() => ask(text)}>
                {text}
                <ArrowRight size={15} />
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
            onSubmit={(e) => {
              e.preventDefault();
              ask(chatInput);
            }}
          >
            <label htmlFor="report-command">Report command</label>
            <textarea
              ref={chatField}
              id="report-command"
              rows={3}
              maxLength={500}
              placeholder="Ask about this snapshot..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              className={styles.primary}
              aria-label="Send command"
              disabled={!report || !chatInput.trim()}
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}
