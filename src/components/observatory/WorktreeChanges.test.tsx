import {render,screen} from '@testing-library/react';
import WorktreeChanges from './WorktreeChanges';
import {worktreeOverlaps,type WorktreeObservation} from '@/lib/engineering';
const base:WorktreeObservation={name:'one',branch:'feature',head:null,status:'dirty',tracked:1,untracked:0,ahead:1,behind:0,changeCount:1,changesTruncated:false,changes:[{path:'new.ts',previousPath:'old.ts',code:'RM',staged:true,unstaged:true}]};
it('shows both staged and unstaged states and rename provenance',()=>{render(<WorktreeChanges worktree={base}/>);expect(screen.getByText('old.ts → new.ts')).toBeInTheDocument();expect(screen.getByText(/Staged \+ Unstaged/)).toBeInTheDocument();});
it('matches rename sources without confusing same-worktree entries with overlap',()=>{expect(worktreeOverlaps([base])).toEqual([]);expect(worktreeOverlaps([base,{...base,name:'two',changes:[{path:'old.ts',code:' M',staged:false,unstaged:true}]}])).toEqual([{path:'old.ts',worktrees:['one','two']}]);});
