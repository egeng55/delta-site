/** @jest-environment node */
import { GET } from './route';
import { requireObservatoryOwner } from '@/lib/observatoryServer';
import { readWorkspace } from '@/lib/workspaceServer';
jest.mock('@/lib/observatoryServer', () => ({ requireObservatoryOwner: jest.fn() }));
jest.mock('@/lib/workspaceServer', () => ({ readWorkspace: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it.each([['denied',403],['signed_out',401],['unconfigured',503]] as const)('blocks %s before connecting', async (state, code) => {
 jest.mocked(requireObservatoryOwner).mockResolvedValue(state); expect((await GET()).status).toBe(code); expect(readWorkspace).not.toHaveBeenCalled();
});
it('serves private owner data without caching', async () => {
 jest.mocked(requireObservatoryOwner).mockResolvedValue('owner'); jest.mocked(readWorkspace).mockResolvedValue({ version: 1 } as never);
 const result = await GET(); expect(await result.json()).toEqual({ version: 1 }); expect(result.headers.get('cache-control')).toContain('no-store');
});
