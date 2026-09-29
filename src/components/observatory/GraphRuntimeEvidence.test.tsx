import {mappedCapabilities} from './GraphRuntimeEvidence';
import {observatoryPreview} from '@/lib/observatoryPreview';
it('correlates only explicit capability identifiers, never unrelated dependencies',()=>{
 const report=observatoryPreview();report.graphs=[{id:'systems',sourceCommit:'a'.repeat(40),generatedAt:new Date().toISOString(),nodes:[],links:[{source:'repo:agent',target:'system:one',relation:'declared owner'},{source:'system:one',target:'system:two',relation:'declared dependency'}]},{id:'capabilities',sourceCommit:'a'.repeat(40),generatedAt:new Date().toISOString(),nodes:[],links:[{source:'system:one',target:'cap:a',relation:'explicit capability mapping'},{source:'system:two',target:'cap:b',relation:'explicit capability mapping'},{source:'cap:a',target:'tool:0',relation:'registered handler'}]}];
 expect([...mappedCapabilities(report,'repo:agent')]).toEqual(['a']);expect([...mappedCapabilities(report,'tool:0')]).toEqual(['a']);expect([...mappedCapabilities(report,'system:one')]).toEqual(['a']);expect([...mappedCapabilities(report,null)]).toEqual([]);
});
