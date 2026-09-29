import type {WorktreeObservation} from '@/lib/engineering';
export default function BranchChanges({worktree:w}:{worktree:WorktreeObservation}){
 const b=w.branchReview;
 return <details><summary>Committed branch changes · {b?.total??'unknown'}</summary>{!b?<p>Comparison unavailable. Local main, shared history, or the observation may be missing.</p>:<>
  <p>{b.files.length} of {b.total} changed paths shown{b.truncated?' · partial coverage':''}. Compares the common ancestor with this branch’s recorded tip. Changes exclusive to main and uncommitted edits are excluded.</p>
  <dl><dt>Local main</dt><dd><code>{b.base.slice(0,12)}</code></dd><dt>Branch tip</dt><dd><code>{b.head.slice(0,12)}</code></dd><dt>Common ancestor</dt><dd><code>{b.mergeBase.slice(0,12)}</code></dd></dl>
  {b.files.length?<ul>{b.files.map((f,i)=><li key={i}><code>{f.path}</code><br/><small>{{A:'Added',M:'Modified',D:'Deleted',T:'Type changed',U:'Unmerged',X:'Unknown',B:'Pairing broken'}[f.status]||f.status}</small></li>)}</ul>:<p>No net file changes relative to the common ancestor. This does not prove test success or deployment.</p>}
  <p>Renames appear as additions and deletions. File names only; no patch contents are loaded. This comparison does not establish merge safety.</p>
 </>}</details>;
}
