/** @jest-environment node */
import {NextRequest} from 'next/server';
import {POST,GET} from './route';
import {observationClient} from '@/lib/hostedObservationServer';
jest.mock('@/lib/hostedObservationServer',()=>({observationClient:jest.fn()}));
const invoice={provider:'openai',invoiceId:'inv_test',scope:'organization',periodStart:'2026-09-01',periodEnd:'2026-10-01',currency:'usd',subtotalCents:10,taxCents:0,creditCents:0,totalCents:10,evidenceSha256:'a'.repeat(64)};
const req=(origin='https://delta.test',body:unknown=invoice)=>new NextRequest('https://delta.test/api/hq/invoices',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>jest.clearAllMocks());
it('denies cross-origin writes before opening the owner data connection',async()=>{expect((await POST(req('https://evil.test'))).status).toBe(403);expect(observationClient).not.toHaveBeenCalled();});
it('denies unauthenticated reads and imports',async()=>{jest.mocked(observationClient).mockResolvedValue(null);expect((await GET()).status).toBe(403);expect((await POST(req())).status).toBe(403);});
it('binds owner server-side and preserves duplicate protection',async()=>{const insert=jest.fn().mockResolvedValue({error:{code:'23505'}});jest.mocked(observationClient).mockResolvedValue({owner:'verified-owner',client:{from:()=>({insert})}} as never);expect((await POST(req())).status).toBe(409);expect(insert).toHaveBeenCalledWith(expect.objectContaining({owner_id:'verified-owner',invoice_id:'inv_test'}));expect((await POST(req('https://delta.test',{...invoice,owner_id:'attacker'}))).status).toBe(400);expect(insert).toHaveBeenCalledTimes(1);});
