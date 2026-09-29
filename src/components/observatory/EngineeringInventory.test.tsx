import {render,screen,fireEvent} from '@testing-library/react';
import EngineeringInventory from './EngineeringInventory';
it('filters real observations and keeps unknown source coverage visible',()=>{
 render(<EngineeringInventory preview initial={{version:1,observedAt:new Date().toISOString(),repositories:[{id:'site',available:true,branches:['main'],branchesTruncated:false,worktrees:[{name:'checkout',branch:'main',head:'a'.repeat(40),tracked:0,untracked:0,ahead:0,behind:0,status:'clean'}],worktreeCount:1,truncated:false},{id:'backend',available:false,branches:[],branchesTruncated:false,worktrees:[],worktreeCount:0,truncated:false}]}}/>);
 expect(screen.getByText('Repository observation unavailable.')).toBeInTheDocument();fireEvent.change(screen.getByLabelText('Repository'),{target:{value:'site'}});expect(screen.queryByText('Repository observation unavailable.')).not.toBeInTheDocument();expect(screen.getByText('0 ahead · 0 behind')).toBeInTheDocument();
});
