/** @jest-environment node */
import {readProviderCosts} from './providerCostsServer';
import {parseCostPage} from './providerCosts';
jest.mock('server-only',()=>({}),{virtual:true});
const env=process.env,originalFetch=global.fetch;
let sequence=0;
beforeEach(()=>{process.env={...env,OPENAI_ADMIN_KEY:`test-${++sequence}`,OPENAI_PROJECT_ID:'proj_delta'};global.fetch=jest.fn();});
afterEach(()=>{process.env=env;global.fetch=originalFetch;});
const page=(more=false)=>({data:[{start_time:Math.floor(new Date(new Date().toISOString().slice(0,10)).getTime()/1000),results:[{object:'organization.costs.result',amount:{value:0.125,currency:'usd'},project_id:'proj_delta'}]}],has_more:more,next_page:more?'next':null});
it('makes no provider request without an admin credential',async()=>{delete process.env.OPENAI_ADMIN_KEY;expect((await readProviderCosts()).state).toBe('unconfigured');expect(fetch).not.toHaveBeenCalled();});
it('reads provider totals with explicit project scope, fixed endpoint and shared bounded cache',async()=>{
 jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(page())));
 const [a,b]=await Promise.all([readProviderCosts(),readProviderCosts()]);expect(a.usd).toBe(0.125);expect(b).toEqual(a);expect(fetch).toHaveBeenCalledTimes(1);
 const [url,options]=jest.mocked(fetch).mock.calls[0];expect(String(url)).toContain('https://api.openai.com/v1/organization/costs?');expect(String(url)).toContain('project_ids%5B%5D=proj_delta');expect(options?.redirect).toBe('error');
});
it('does not turn partial pagination or failed billing reads into a total',async()=>{
 jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(page(true)))).mockResolvedValueOnce(new Response('private provider detail',{status:403}));
 const result=await readProviderCosts();expect(result.state).toBe('unavailable');expect(result.usd).toBeNull();expect(result.days).toEqual([]);expect(JSON.stringify(result)).not.toContain('private provider detail');
});
it('rejects currency and project mismatches but permits provider credits',()=>{
 const value=page();value.data[0].results[0].amount.value=-0.5;expect(parseCostPage(value,'proj_delta').days[0].usd).toBe(-0.5);
 value.data[0].results[0].project_id='proj_other';expect(()=>parseCostPage(value,'proj_delta')).toThrow();
 value.data[0].results[0].project_id='proj_delta';value.data[0].results[0].amount.currency='eur';expect(()=>parseCostPage(value,'proj_delta')).toThrow();
});
