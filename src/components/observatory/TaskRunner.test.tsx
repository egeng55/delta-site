import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import TaskRunner from './TaskRunner';
const original=global.fetch;
afterEach(()=>{global.fetch=original;});
it('shows the execution surface without calling a runtime in preview',()=>{global.fetch=jest.fn();render(<TaskRunner input="Fix pagination" preview/>);expect(screen.getByRole('button',{name:'Submit task'})).toBeDisabled();expect(screen.getByLabelText('Pending decisions')).toBeInTheDocument();expect(fetch).not.toHaveBeenCalled();});
it('recovers retained history and forwards an exact approval decision',async()=>{
 const task={id:'a'.repeat(36),kind:'engineering',state:'waiting_for_approval',input:'Fix pagination',updated_at:new Date().toISOString(),sequence:1,events:[{sequence:1,at:new Date().toISOString(),type:'approval_required',stage:null}]};
 const approval={id:'decision',task_id:task.id,digest:'bound-digest',request:{action_id:'runtime.outcome.run'},arguments:{daily_cap_usd:0.01}};
 global.fetch=jest.fn(async(url:RequestInfo|URL,init?:RequestInit)=>({ok:true,status:200,json:async()=>String(url).includes('approvals')?{approvals:[approval]}:String(url).includes('requests')?{requests:[]}:String(url).includes('tasks?id')?task:init?.method==='POST'?{status:'accepted'}:{tasks:[task]}})) as unknown as typeof fetch;
 render(<TaskRunner input="" preview={false}/>);await screen.findByRole('button',{name:'Approve this exact action'});await screen.findByText('waiting_for_approval');
 fireEvent.click(screen.getByRole('button',{name:'Approve this exact action'}));await waitFor(()=>expect(fetch).toHaveBeenCalledWith('/api/hq/lifecycle/decision',expect.objectContaining({method:'POST',body:JSON.stringify({id:'decision',digest:'bound-digest',accepted:true})})));
 expect(screen.getByRole('button',{name:'Continue with review'})).toBeDisabled();
});
