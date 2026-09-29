/** @jest-environment node */
import {GET} from './route';
import {requireObservatoryOwner} from '@/lib/observatoryServer';
import {readOperations} from '@/lib/operationsServer';
jest.mock('@/lib/observatoryServer',()=>({requireObservatoryOwner:jest.fn()}));
jest.mock('@/lib/operationsServer',()=>({readOperations:jest.fn()}));
it('rejects unauthenticated reads before reading private operational observations',async()=>{jest.mocked(requireObservatoryOwner).mockResolvedValue('signed_out');expect((await GET()).status).toBe(401);expect(readOperations).not.toHaveBeenCalled();});
it('keeps unavailable observations explicit for an authorized owner',async()=>{jest.mocked(requireObservatoryOwner).mockResolvedValue('owner');jest.mocked(readOperations).mockResolvedValue({observedAt:"now",backend:{state:"unavailable",latencyMs:0,revision:null},spending:{state:"unavailable",day:null,dailyReserved:null,monthlyReserved:null,dailyCap:null,monthlyCap:null}});const r=await GET();expect((await r.json()).backend.state).toBe("unavailable");expect(r.headers.get('Cache-Control')).toContain('no-store');});
