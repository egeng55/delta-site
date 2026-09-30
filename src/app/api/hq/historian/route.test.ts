/** @jest-environment node */
import {GET} from './route';
import {requireObservatoryOwner} from '@/lib/observatoryServer';
jest.mock('@/lib/observatoryServer',()=>({requireObservatoryOwner:jest.fn()}));
it.each([['signed_out',401],['denied',403],['unconfigured',503]] as const)('denies %s without historical data',async(state,status)=>{jest.mocked(requireObservatoryOwner).mockResolvedValue(state);const r=await GET();expect(r.status).toBe(status);expect(await r.json()).toEqual({error:'owner_access_required'});});
it('returns source-pinned evidence privately to the owner, without private filesystem refs',async()=>{jest.mocked(requireObservatoryOwner).mockResolvedValue('owner');const r=await GET(),data=await r.json();expect(r.headers.get('Cache-Control')).toBe('private, no-store');expect(data.snapshots).toHaveLength(2);expect(data.milestones).toHaveLength(14);expect(data.sourceCommit).toMatch(/^[a-f0-9]{40}$/);expect(data.provenance).toHaveLength(4);expect(JSON.stringify(data)).not.toMatch(/\/Users\/|memory\.db|Bearer /);expect(new Set(data.milestones.map((m:{id:string})=>m.id)).size).toBe(14);});
