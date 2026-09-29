/** @jest-environment node */
import {parseEngineering} from './engineering';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {projectEngineering}=require('../../scripts/engineering-export.cjs');
it('exports true checkout facts without mutating or claiming missing repositories are clean',()=>{
 const root=realpathSync(mkdtempSync(path.join(tmpdir(),'delta-git-view-'))),repo=path.join(root,'delta-site');mkdirSync(repo);const git=(...args:string[])=>execFileSync('git',args,{cwd:repo,encoding:'utf8'});
 try{git('init','-q','-b','main');writeFileSync(path.join(repo,'a.txt'),'a');git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','initial');git('checkout','-qb','feature');writeFileSync(path.join(repo,'a.txt'),'changed');writeFileSync(path.join(repo,'new.txt'),'new');const before=git('status','--porcelain');const report=parseEngineering(projectEngineering(root));const site=report.repositories.find(r=>r.id==='site')!;expect(site.worktrees[0]).toMatchObject({branch:'feature',status:'dirty',tracked:1,untracked:1,ahead:0,behind:0});expect(report.repositories.find(r=>r.id==='backend')?.available).toBe(false);expect(git('status','--porcelain')).toBe(before);}finally{rmSync(root,{recursive:true,force:true});}
});
it('rejects malformed or duplicate repository observations',()=>{expect(()=>parseEngineering({version:1,observedAt:'bad',repositories:[]})).toThrow();const r={id:'site',available:true,branches:[],branchesTruncated:false,worktrees:[],worktreeCount:0,truncated:false};expect(()=>parseEngineering({version:1,observedAt:new Date().toISOString(),repositories:[r,r]})).toThrow();});
it('preserves staged renames and unusual file names in NUL-delimited status',()=>{
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const {parseChanges}=require('../../scripts/engineering-export.cjs');
 expect(parseChanges('R  new name\0old name\0 M line\nbreak\0?? new.txt\0')).toEqual([{path:'new name',previousPath:'old name',code:'R ',staged:true,unstaged:false},{path:'line\nbreak',code:' M',staged:false,unstaged:true},{path:'new.txt',code:'??',staged:false,unstaged:false}]);
});
it('compares a diverged branch against its common ancestor, excluding main-only and dirty edits',()=>{
 const root=realpathSync(mkdtempSync(path.join(tmpdir(),'delta-branch-view-'))),repo=path.join(root,'delta-site');mkdirSync(repo);const git=(...args:string[])=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const commit=()=>{git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture');};
 try{git('init','-q','-b','main');writeFileSync(path.join(repo,'base'),'base');commit();git('checkout','-qb','feature');writeFileSync(path.join(repo,'feature file'),'feature');commit();git('checkout','-q','main');writeFileSync(path.join(repo,'main-only'),'main');commit();git('checkout','-q','feature');writeFileSync(path.join(repo,'dirty-only'),'dirty');const before=git('status','--porcelain');const r=parseEngineering(projectEngineering(root));const w=r.repositories.find(x=>x.id==='site')!.worktrees[0];expect(w).toMatchObject({ahead:1,behind:1});expect(w.branchReview?.files).toEqual([{path:'feature file',status:'A'}]);expect(w.changes?.some(c=>c.path==='dirty-only')).toBe(true);expect(git('status','--porcelain')).toBe(before);}finally{rmSync(root,{recursive:true,force:true});}
});
