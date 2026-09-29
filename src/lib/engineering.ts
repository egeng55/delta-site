export type WorktreeObservation={name:string;branch:string;head:string|null;tracked:number|null;untracked:number|null;ahead:number|null;behind:number|null;status:'clean'|'dirty'|'unavailable'};
export type EngineeringReport={version:1;observedAt:string;repositories:{id:string;available:boolean;branches:string[];branchesTruncated:boolean;worktrees:WorktreeObservation[];worktreeCount:number;truncated:boolean}[]};
export function parseEngineering(value:unknown):EngineeringReport {
 if(!value||typeof value!=='object')throw Error('invalid_report');const r=value as EngineeringReport;
 const text=(v:unknown)=>typeof v==='string'&&v.length<=500;
 const count=(v:unknown)=>v===null||typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
 if(r.version!==1||!Number.isFinite(Date.parse(r.observedAt))||!Array.isArray(r.repositories)||r.repositories.length>5)throw Error('invalid_report');
 const ids=new Set<string>();for(const repo of r.repositories){if(!['agent','backend','site','mobile','jobs'].includes(repo.id)||ids.has(repo.id)||typeof repo.available!=='boolean'||typeof repo.truncated!=='boolean'||typeof repo.branchesTruncated!=='boolean'||!Number.isSafeInteger(repo.worktreeCount)||repo.worktreeCount<0||!Array.isArray(repo.branches)||repo.branches.length>100||!repo.branches.every(text)||!Array.isArray(repo.worktrees)||repo.worktrees.length>30)throw Error('invalid_report');ids.add(repo.id);
 for(const w of repo.worktrees)if(!text(w.name)||!text(w.branch)||!(w.head===null||typeof w.head==='string'&&/^[a-f0-9]{40,64}$/.test(w.head))||![w.tracked,w.untracked,w.ahead,w.behind].every(count)||!['clean','dirty','unavailable'].includes(w.status))throw Error('invalid_report');}
 // Pick known fields so unpublished producer data cannot leak through the adapter.
 return {version:1,observedAt:r.observedAt,repositories:r.repositories.map(p=>({id:p.id,available:p.available,branches:p.branches,branchesTruncated:p.branchesTruncated,worktreeCount:p.worktreeCount,truncated:p.truncated,worktrees:p.worktrees.map(w=>({name:w.name,branch:w.branch,head:w.head,tracked:w.tracked,untracked:w.untracked,ahead:w.ahead,behind:w.behind,status:w.status}))}))};
}
