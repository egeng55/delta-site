/** @jest-environment node */
import { runWorkspaceAudit } from './workspaceTasks';
jest.mock('server-only',()=>({}),{virtual:true});
const old=global.fetch, env=process.env;
afterEach(()=>{global.fetch=old;process.env=env;});
it('executes one fixed read-only action for duplicate request IDs and rejects conflicting input',async()=>{
 process.env={...env,DELTA_HQ_RUNTIME_PORT:'4318',DELTA_HQ_RUNTIME_TOKEN:'a'.repeat(64)};
 global.fetch=jest.fn().mockResolvedValue(new Response(JSON.stringify({status:'completed',final_message:'Audit complete',verification:{ok:true},session_id:'session-1'})));
 const [a,b]=await Promise.all([runWorkspaceAudit('duplicate-test','Audit'),runWorkspaceAudit('duplicate-test','Audit')]);
 expect(a).toEqual(b);expect(a.verification).toBe('passed');expect(fetch).toHaveBeenCalledTimes(1);
 expect(JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual({input:'Audit',capability_id:'agent.capability.audit',tool_arguments:{}});
 expect(()=>runWorkspaceAudit('duplicate-test','Different')).toThrow('request_conflict');
});
it('retains ambiguous outcomes without automatically retrying',async()=>{
 process.env={...env,DELTA_HQ_RUNTIME_PORT:'4318',DELTA_HQ_RUNTIME_TOKEN:'a'.repeat(64)};global.fetch=jest.fn().mockRejectedValue(new Error('timeout'));
 expect((await runWorkspaceAudit('unknown-test','Audit')).state).toBe('outcome_unknown');await runWorkspaceAudit('unknown-test','Audit');expect(fetch).toHaveBeenCalledTimes(1);
});
