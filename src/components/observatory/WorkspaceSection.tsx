'use client';
import type { ObservatoryReport } from '@/lib/observatory';
import styles from './WorkspaceSection.module.css';
export default function WorkspaceSection({ section, report, draft, setDraft }: { section: 'work' | 'engineering'; report: ObservatoryReport | null; draft: string; setDraft: (value: string) => void }) {
  if (section === 'work') return <section className={styles.panel} aria-label="Task workspace">
    <p className={styles.eyebrow}>REQUEST → EXECUTION → VERIFICATION → RESULT</p>
    <h2>What should Delta work on?</h2>
    <label htmlFor="task-draft">Task draft</label>
    <textarea id="task-draft" value={draft} maxLength={4000} onChange={event => setDraft(event.target.value)} placeholder="Describe the result you want and how we should verify it." />
    <p>{draft.length} / 4000 characters · Draft stays in this page until reload.</p>
    <button disabled>Execution connection pending</button>
    <p>The site can observe runtime activity. Submitting, approving and continuing tasks will use the authenticated execution connection in the live-workflow phase.</p>
    <div className={styles.grid}>
      <article><h3>Active work</h3><p>See retained command observations below when connected. Durable task history is not connected yet.</p></article>
      <article><h3>Needs your decision</h3><p>Approval decisions are not available here yet. An empty view does not mean there are no pending approvals.</p></article>
      <article><h3>Results & continuation</h3><p>Verified artifacts and continuation controls will appear when their task references are connected.</p></article>
    </div>
  </section>;
  return <section className={styles.panel} aria-label="Engineering workspace">
    <p className={styles.eyebrow}>SOURCE → BRANCH → WORKTREE → VERIFICATION</p>
    <h2>Engineering inventory</h2>
    <p>Committed source snapshots are separate from local edits, running builds and deployments.</p>
    {report ? <div className={styles.grid}>{report.repositories.map(repo => <article key={repo.id}><h3>{repo.label}</h3><code>{repo.sha}</code><p>{repo.files} tracked files · {repo.testFiles} test files</p><p>Test-file count does not establish passing tests.</p></article>)}</div> : <p>No validated source report is connected.</p>}
    <div className={styles.grid}>
      <article><h3>Branches & worktrees</h3><p>Integration-graph connection pending. No branch status is inferred from the source snapshot.</p></article>
      <article><h3>Checks & changes</h3><p>Task-linked diffs and verification evidence are not connected yet.</p></article>
      <article><h3>Running & deployed</h3><p>Revision identity unavailable. These source commits are not deployment evidence.</p></article>
    </div>
    <a href="#architecture">Explore system relationships →</a>
  </section>;
}
