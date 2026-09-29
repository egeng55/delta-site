/** @jest-environment node */
import {isHqOrigin} from './hqOrigin';
afterEach(()=>{delete process.env.DELTA_HQ_SITE_ORIGIN;});
it('accepts the served loopback origin despite internal hostname normalization',()=>{expect(isHqOrigin(new Request('http://localhost:4330/api/hq/tasks',{headers:{host:'127.0.0.1:4330',origin:'http://127.0.0.1:4330'}}))).toBe(true);});
it('rejects foreign, absent and forwarded origins',()=>{for(const origin of ['', 'https://foreign.invalid'])expect(isHqOrigin(new Request('http://localhost:4330/api/hq/tasks',{headers:{host:'127.0.0.1:4330',origin,'x-forwarded-host':'foreign.invalid'}}))).toBe(false);});
it('honors only the explicit configured origin when supplied',()=>{process.env.DELTA_HQ_SITE_ORIGIN='http://127.0.0.1:4330';expect(isHqOrigin(new Request('http://localhost:4330/api/hq/tasks',{headers:{host:'foreign.invalid',origin:'https://foreign.invalid'}}))).toBe(false);});
