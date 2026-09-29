import {render,screen} from '@testing-library/react';
import BranchChanges from './BranchChanges';
import type {WorktreeObservation} from '@/lib/engineering';
const w:WorktreeObservation={name:'fixture',branch:'feature',head:'a'.repeat(40),tracked:0,untracked:0,ahead:1,behind:0,status:'clean'};
it('does not report unavailable comparison as zero changes',()=>{render(<BranchChanges worktree={w}/>);expect(screen.getByText(/Comparison unavailable/)).toBeInTheDocument();expect(screen.queryByText(/No net file changes/)).not.toBeInTheDocument();});
it('shows pinned references and discloses truncation',()=>{render(<BranchChanges worktree={{...w,branchReview:{head:'a'.repeat(40),base:'b'.repeat(40),mergeBase:'c'.repeat(40),total:60,truncated:true,files:[{path:'feature.ts',status:'A'}]}}}/>);expect(screen.getByText(/1 of 60 changed paths shown/)).toHaveTextContent('partial coverage');expect(screen.getByText('feature.ts')).toBeInTheDocument();expect(screen.getByText('bbbbbbbbbbbb')).toBeInTheDocument();});
