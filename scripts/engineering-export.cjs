/* eslint-disable @typescript-eslint/no-require-imports */
// Read-only companion to observatory-export. No fetch, checkout, hooks or mutations.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
function parseChanges(raw) {
 const records=raw.split('\0'),result=[];
 for(let i=0;i<records.length;i++){
  const entry=records[i];if(!entry)continue;const code=entry.slice(0,2),file=entry.slice(3);
  const renamed=/[RC]/.test(code),previous=renamed?records[++i]:undefined;
  result.push({path:file,code,...(previous?{previousPath:previous}:{}),staged:code!=='??'&&code[0]!==' ',unstaged:code!=='??'&&code[1]!==' '});
 }
 return result;
}
function projectEngineering(workspace) {
 const deadline=Date.now()+15000;
 const git=(root,args)=>{if(Date.now()>deadline)throw Error('deadline');return execFileSync('git',['--no-optional-locks','-c','core.fsmonitor=false','-C',root,...args],{encoding:'utf8',timeout:1500,maxBuffer:1000000,stdio:['ignore','pipe','ignore']}).trimEnd();};
 const repositories=['agent','backend','site','mobile','jobs'].map(id=>{
  const root=path.join(workspace,`delta-${id}`);
  try {
   const refs=git(root,['for-each-ref','--count=101','--format=%(refname:short)','refs/heads']).split('\n').filter(Boolean);
   const records=git(root,['worktree','list','--porcelain','-z']).split('\0\0').filter(Boolean);
   const worktrees=records.slice(0,30).map(raw=>{
    const lines=raw.split('\0'),location=lines.find(l=>l.startsWith('worktree '))?.slice(9),head=lines.find(l=>l.startsWith('HEAD '))?.slice(5),branch=lines.find(l=>l.startsWith('branch '))?.slice(7).replace(/^refs\/heads\//,'')||'Detached HEAD';
    const row={name:location?path.basename(location):'Unavailable',branch,head:head||null,tracked:null,untracked:null,ahead:null,behind:null,status:'unavailable',changes:null,changeCount:null,changesTruncated:false};
    if(!location)return row;
    // Only inspect registered worktrees inside the configured Delta workspace.
    try{const real=fs.realpathSync(location);if(!real.startsWith(fs.realpathSync(workspace)+path.sep))return row;
     const changes=parseChanges(git(real,['status','--porcelain=v1','-z','--untracked-files=normal']));row.tracked=changes.filter(x=>x.code!=='??').length;row.untracked=changes.filter(x=>x.code==='??').length;row.status=changes.length?'dirty':'clean';
     row.changeCount=changes.length;row.changes=changes.filter(c=>c.path.length<=500&&(!c.previousPath||c.previousPath.length<=500)).slice(0,50);row.changesTruncated=row.changes.length<changes.length;
     try{const [behind,ahead]=git(real,['rev-list','--left-right','--count','refs/heads/main...HEAD']).split(/\s+/).map(Number);row.ahead=ahead;row.behind=behind;}catch{/* missing main stays unknown */}
    }catch{/* inaccessible worktrees stay unavailable */}return row;
   });
   return {id,available:true,branches:refs.slice(0,100),branchesTruncated:refs.length>100,worktrees,worktreeCount:records.length,truncated:records.length>30};
  }catch{return {id,available:false,branches:[],branchesTruncated:false,worktrees:[],worktreeCount:0,truncated:false};}
 });
 return {version:1,observedAt:new Date().toISOString(),repositories};
}
module.exports={projectEngineering,parseChanges};
if(require.main===module){const [workspace,out]=process.argv.slice(2);if(!workspace||!out)throw Error('workspace and output required');const report=projectEngineering(path.resolve(workspace));fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});const temporary=out+'.tmp';fs.writeFileSync(temporary,JSON.stringify(report),{mode:0o600});fs.renameSync(temporary,out);console.log(JSON.stringify({repositories:report.repositories.length,available:report.repositories.filter(r=>r.available).length}));}
