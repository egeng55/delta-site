/** @jest-environment node */
import { POST } from './route';
import { requireObservatoryOwner } from '@/lib/observatoryServer';
import { runWorkspaceAudit } from '@/lib/workspaceTasks';
jest.mock('@/lib/observatoryServer',()=>({requireObservatoryOwner:jest.fn()}));
jest.mock('@/lib/workspaceTasks',()=>({runWorkspaceAudit:jest.fn()}));
beforeEach(()=>jest.clearAllMocks());
it('rejects nonowners before execution',async()=>{jest.mocked(requireObservatoryOwner).mockResolvedValue('denied');expect((await POST(new Request('http://localhost/api/hq/tasks',{method:'POST'}))).status).toBe(403);expect(runWorkspaceAudit).not.toHaveBeenCalled();});
it('rejects cross-origin and authority injection',async()=>{
 jest.mocked(requireObservatoryOwner).mockResolvedValue('owner');
 expect((await POST(new Request('http://localhost/api/hq/tasks',{method:'POST',headers:{Origin:'http://elsewhere'}}))).status).toBe(403);
 expect((await POST(new Request('http://localhost/api/hq/tasks',{method:'POST',headers:{Origin:'http://localhost'},body:JSON.stringify({requestId:'a'.repeat(36),input:'audit',approvals:['yes']})}))).status).toBe(400);expect(runWorkspaceAudit).not.toHaveBeenCalled();
});
