/** @jest-environment node */
import {GET} from './route';
import {requireObservatoryOwner} from '@/lib/observatoryServer';
import {readEngineering} from '@/lib/engineeringServer';
jest.mock('@/lib/observatoryServer',()=>({requireObservatoryOwner:jest.fn()}));
jest.mock('@/lib/engineeringServer',()=>({readEngineering:jest.fn()}));
it('rejects unauthenticated reads before reading private Git observations',async()=>{jest.mocked(requireObservatoryOwner).mockResolvedValue('signed_out');expect((await GET()).status).toBe(401);expect(readEngineering).not.toHaveBeenCalled();});
it('keeps unavailable observations explicit for an authorized owner',async()=>{jest.mocked(requireObservatoryOwner).mockResolvedValue('owner');jest.mocked(readEngineering).mockResolvedValue(null);const r=await GET();expect(await r.json()).toEqual({report:null});expect(r.headers.get('Cache-Control')).toContain('no-store');});
