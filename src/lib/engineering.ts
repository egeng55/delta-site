export type BranchReview={base:string;head:string;mergeBase:string;files:{status:string;path:string}[];total:number;truncated:boolean};
export type FileChange={path:string;code:string;previousPath?:string;staged:boolean;unstaged:boolean};
export type WorktreeObservation={name:string;branch:string;head:string|null;tracked:number|null;untracked:number|null;ahead:number|null;behind:number|null;status:'clean'|'dirty'|'unavailable';changes?:FileChange[]|null;changeCount?:number|null;changesTruncated?:boolean;branchReview?:BranchReview|null};
export type EngineeringReport={version:1;observedAt:string;repositories:{id:string;available:boolean;branches:string[];branchesTruncated:boolean;worktrees:WorktreeObservation[];worktreeCount:number;truncated:boolean}[]};
export function parseEngineering(value:unknown):EngineeringReport {
 if(!value||typeof value!=='object')throw Error('invalid_report');const r=value as EngineeringReport;
 const text=(v:unknown)=>typeof v==='string'&&v.length<=500;
 const count=(v:unknown)=>v===null||typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
 if(r.version!==1||!Number.isFinite(Date.parse(r.observedAt))||!Array.isArray(r.repositories)||r.repositories.length>5)throw Error('invalid_report');
 const ids=new Set<string>();for(const repo of r.repositories){if(!['agent','backend','site','mobile','jobs'].includes(repo.id)||ids.has(repo.id)||typeof repo.available!=='boolean'||typeof repo.truncated!=='boolean'||typeof repo.branchesTruncated!=='boolean'||!Number.isSafeInteger(repo.worktreeCount)||repo.worktreeCount<0||!Array.isArray(repo.branches)||repo.branches.length>100||!repo.branches.every(text)||!Array.isArray(repo.worktrees)||repo.worktrees.length>30)throw Error('invalid_report');ids.add(repo.id);
 for(const w of repo.worktrees)if(!text(w.name)||!text(w.branch)||!(w.head===null||typeof w.head==='string'&&/^[a-f0-9]{40,64}$/.test(w.head))||![w.tracked,w.untracked,w.ahead,w.behind].every(count)||!['clean','dirty','unavailable'].includes(w.status))throw Error('invalid_report');}
 for(const repo of r.repositories)for(const w of repo.worktrees){
  if(w.branchReview){const b=w.branchReview;if(![b.base,b.head,b.mergeBase].every(x=>typeof x==='string'&&/^[a-f0-9]{40,64}$/.test(x))||!Array.isArray(b.files)||b.files.length>50||!Number.isSafeInteger(b.total)||b.total<b.files.length||typeof b.truncated!=='boolean')throw Error('invalid_branch_review');for(const f of b.files)if(!text(f.path)||!f.path||!['A','M','D','T','U','X','B'].includes(f.status))throw Error('invalid_branch_review');}
  if(w.changes!==undefined&&w.changes!==null){if(!Array.isArray(w.changes)||w.changes.length>50||!Number.isSafeInteger(w.changeCount)||(w.changeCount??-1)<w.changes.length||typeof w.changesTruncated!=='boolean')throw Error('invalid_changes');
   for(const c of w.changes)if(!text(c.path)||!c.path||!text(c.code)||!/^([ MADRCTU?!]{2})$/.test(c.code)||typeof c.staged!=='boolean'||typeof c.unstaged!=='boolean'||(c.previousPath!==undefined&&!text(c.previousPath)))throw Error('invalid_changes');
  }
 }
 // Pick known fields so unpublished producer data cannot leak through the adapter.
 return {version:1,observedAt:r.observedAt,repositories:r.repositories.map(p=>({id:p.id,available:p.available,branches:p.branches,branchesTruncated:p.branchesTruncated,worktreeCount:p.worktreeCount,truncated:p.truncated,worktrees:p.worktrees.map(w=>({name:w.name,branch:w.branch,head:w.head,tracked:w.tracked,untracked:w.untracked,ahead:w.ahead,behind:w.behind,status:w.status,...(w.branchReview===undefined?{}:{branchReview:w.branchReview?{base:w.branchReview.base,head:w.branchReview.head,mergeBase:w.branchReview.mergeBase,total:w.branchReview.total,truncated:w.branchReview.truncated,files:w.branchReview.files.map(f=>({path:f.path,status:f.status}))}:null}),...(w.changes===undefined?{}:{changes:w.changes?.map(c=>({path:c.path,code:c.code,staged:c.staged,unstaged:c.unstaged,...(c.previousPath?{previousPath:c.previousPath}:{})}))??null,changeCount:w.changeCount,changesTruncated:w.changesTruncated})}))}))};
}

export function worktreeOverlaps(worktrees:WorktreeObservation[]) {
 const paths=new Map<string,Set<number>>();
 worktrees.forEach((w,i)=>w.changes?.forEach(c=>{for(const file of [c.path,c.previousPath].filter((v):v is string=>Boolean(v))){const owners=paths.get(file)||new Set<number>();owners.add(i);paths.set(file,owners);}}));
 return [...paths.entries()].filter(([,owners])=>owners.size>1).map(([path,owners])=>({path,worktrees:[...owners].map(i=>worktrees[i].name)}));
}
