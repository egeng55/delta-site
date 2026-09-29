/** @jest-environment node */
import {execFile} from 'node:child_process';
import {readLocalObservation} from './localObservations';
jest.mock('server-only',()=>({}),{virtual:true});
jest.mock('node:child_process',()=>({execFile:jest.fn()}));
afterEach(()=>{delete process.env.DELTA_HQ_LOCAL_WORKSPACE;});
it('does not run a collector without an explicit absolute local workspace',()=>{expect(readLocalObservation('source')).toBeNull();process.env.DELTA_HQ_LOCAL_WORKSPACE='../relative';expect(readLocalObservation('source')).toBeNull();expect(execFile).not.toHaveBeenCalled();});
it('coalesces concurrent observations into one bounded fixed command',async()=>{
 process.env.DELTA_HQ_LOCAL_WORKSPACE='/fixture/delta';
 jest.mocked(execFile).mockImplementation(((_file:unknown,_args:unknown,_options:unknown,callback:(error:unknown,stdout:string)=>void)=>{callback(null,'{"version":1}');}) as never);
 const a=readLocalObservation('engineering'),b=readLocalObservation('engineering');expect(a).toBe(b);expect(await a).toEqual({version:1});expect(execFile).toHaveBeenCalledTimes(1);expect(execFile).toHaveBeenCalledWith(process.execPath,expect.arrayContaining(['engineering','/fixture/delta']),expect.objectContaining({timeout:20000}),expect.any(Function));
});
