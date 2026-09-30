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
it('disables submission on expired authority and explicitly renews through the fixed route',async()=>{
 let active=false;
 global.fetch=jest.fn(async(url:RequestInfo|URL,init?:RequestInit)=>({ok:true,status:200,json:async()=>{
  if(String(url).endsWith('/session')){if(init?.method==='POST')active=true;return {active,status:active?'active':'expired',expires_at:null,renewable:true,provider_enabled:false};}
  if(String(url).endsWith('/approvals'))return {approvals:[]};
  if(String(url).endsWith('/requests'))return {requests:[]};
  return {tasks:[],coverage:{retained:0,returned:0}};
 }})) as unknown as typeof fetch;
 render(<TaskRunner input="Audit capability registry" preview={false}/>);
 const renew=await screen.findByRole('button',{name:'Renew runtime session with Keychain'});
 expect(screen.getByRole('button',{name:'Submit task'})).toBeDisabled();fireEvent.click(renew);
 await waitFor(()=>expect(screen.getByRole('button',{name:'Submit task'})).toBeEnabled());
 expect(fetch).toHaveBeenCalledWith('/api/hq/lifecycle/session',expect.objectContaining({method:'POST',body:'{"confirm":true}'}));
});
it('clears transient polling errors when the next poll reconnects',async()=>{
 jest.useFakeTimers();let unavailable=true;
 global.fetch=jest.fn(async(url:RequestInfo|URL)=>{
  if(unavailable)throw Error('Runtime temporarily unavailable');
  return {ok:true,json:async()=>String(url).endsWith('/session')?{active:true}:String(url).endsWith('/approvals')?{approvals:[]}:String(url).endsWith('/requests')?{requests:[]}:{tasks:[]}};
 }) as unknown as typeof fetch;
 try{
  render(<TaskRunner input="Audit" preview={false}/>);
  await screen.findByRole('alert');unavailable=false;
  await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument(),{timeout:3500});
  expect(screen.getByRole('button',{name:'Submit task'})).toBeEnabled();
 }finally{jest.useRealTimers();}
});

it('shows the rejected edit separately from the later budget stop',async()=>{
 const task={id:'b'.repeat(36),kind:'engineering',state:'request_budget_exhausted',input:'Repair',updated_at:new Date().toISOString(),sequence:1,result:{engineering_mission:{receipts:[{capability_id:'agent.worktree.edit',file:'upload_limits.py',outcome:'rejected_before_effect',summary:'source repository must be clean before worktree edits'}],provider_budget:{requests:1,charged_cost_microusd:70907},progress:{changed_files:[],verification_attempts:0}}}};
 global.fetch=jest.fn(async(url:RequestInfo|URL)=>({ok:true,json:async()=>String(url).includes('tasks?id')?task:String(url).endsWith('/approvals')?{approvals:[]}:String(url).endsWith('/requests')?{requests:[]}:String(url).endsWith('/session')?{active:true}:{tasks:[task]}})) as unknown as typeof fetch;
 render(<TaskRunner input="" preview={false}/>);
 const diagnosis=await screen.findByRole('region',{name:'Execution diagnosis'});
 expect(diagnosis).toHaveTextContent('Edit rejected before any file change:');expect(diagnosis).toHaveTextContent('source repository must be clean');expect(diagnosis).toHaveTextContent('$0.070907');expect(diagnosis).toHaveTextContent('0 edited files');
});

it('renders retained worktree evidence and submits a fresh read for follow-up',async()=>{
 const task={id:'f40d4c78-c265-4649-b5b4-9029f5b2df8e',kind:'worktree_review',state:'completed',input:'Review worktrees',updated_at:new Date().toISOString(),sequence:1,result:{worktree_report:{observed_at:new Date().toISOString(),provider_cost_usd:0,limitations:'Review before deletion.',repositories:[{repo:'agent',available:true,entries:[{path:'/workspace/draft',branch:'draft',head:'abc',state:'preserve_changes',integrated:false,dirty:true,ignored_artifacts:true}]}]}}};
 global.fetch=jest.fn(async(url:RequestInfo|URL,init?:RequestInit)=>({ok:true,json:async()=>init?.method==='POST'?task:String(url).includes('tasks?id')?task:String(url).endsWith('/session')?{active:true}:String(url).endsWith('/approvals')?{approvals:[]}:String(url).endsWith('/requests')?{requests:[]}:{tasks:[task]}})) as unknown as typeof fetch;
 const random=jest.spyOn(crypto,'randomUUID').mockReturnValue('70f75d8e-c4a7-4d95-8f71-dae26d725783');
 try{
  render(<TaskRunner input="" preview={false}/>);
  expect(await screen.findByRole('region',{name:'Worktree review report'})).toHaveTextContent('preserve changes');
  fireEvent.click(screen.getByRole('button',{name:'Recheck worktrees'}));
  await waitFor(()=>expect(fetch).toHaveBeenCalledWith('/api/hq/lifecycle/tasks',expect.objectContaining({method:'POST',body:JSON.stringify({id:'70f75d8e-c4a7-4d95-8f71-dae26d725783',kind:'worktree_review',input:'Recheck repository and worktree status'})})));
 }finally{random.mockRestore();}
});
