import {parseHostedObservation,observationFreshness} from './hostedObservation';
import {observatoryPreview} from './observatoryPreview';
import {compareGraphRevisions} from './graphRevision';
import {parseInvoice} from './providerInvoices';
const source=()=>({...observatoryPreview(),synthetic:false});
it('projects snapshots without leaking unrelated fields and rejects synthetic reports',()=>{
 const raw={version:1,observedAt:new Date().toISOString(),source:source(),runtime:null,engineering:null,privateToken:'secret'};
 expect(JSON.stringify(parseHostedObservation(raw))).not.toContain('secret');
 expect(()=>parseHostedObservation({...raw,source:observatoryPreview()})).toThrow();
});
it('marks old, invalid and future-dated observations stale',()=>{
 const now=Date.now();expect(observationFreshness(new Date(now-119000).toISOString(),now)).toBe('fresh');
 for(const s of [new Date(now-121000).toISOString(),new Date(now+31000).toISOString(),'invalid'])expect(observationFreshness(s,now)).toBe('stale');
});
it('compares structure independent of ordering and observation time',()=>{
 const a=source(),b=source();b.graphs[0].nodes.reverse();b.graphs[0].links.reverse();b.graphs[0].generatedAt='2030-01-01T00:00:00.000Z';
 expect(compareGraphRevisions(a,b,'systems')).toEqual({added:[],removed:[],changed:[],linksAdded:[],linksRemoved:[]});
 const node=b.graphs[0].nodes[0];node.group='changed-owner';b.graphs[0].links.pop();
 const diff=compareGraphRevisions(a,b,'systems');expect(diff.changed).toEqual([node.id]);expect(diff.linksRemoved).toHaveLength(1);
 expect(()=>compareGraphRevisions(a,b,'missing')).toThrow('layer_missing');
});
const invoice=()=>({provider:'openai',invoiceId:'inv_123',scope:'organization',periodStart:'2026-09-01',periodEnd:'2026-10-01',currency:'usd',subtotalCents:1000,taxCents:100,creditCents:50,totalCents:1050,evidenceSha256:'a'.repeat(64)});
it('accepts exact invoice accounting and rejects mismatch, unknown fields, invalid dates or missing provenance',()=>{
 expect(parseInvoice(invoice()).totalCents).toBe(1050);
 for(const patch of [{totalCents:1000},{token:'secret'},{periodStart:'2026-02-30'},{periodEnd:'2026-08-01'},{evidenceSha256:''},{subtotalCents:0.1}])expect(()=>parseInvoice({...invoice(),...patch})).toThrow();
});
