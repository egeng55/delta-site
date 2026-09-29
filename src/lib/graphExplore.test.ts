import { graphNeighborhood } from './graphExplore';
import type { Graph } from './observatory';
const graph: Graph = { id:'systems', sourceCommit:'a'.repeat(40), generatedAt:new Date().toISOString(), nodes:['a','b','c','d'].map(id=>({id,label:id,group:'agent',kind:'system',maturity:'declared'})),links:[{source:'a',target:'b',relation:'depends'},{source:'b',target:'c',relation:'depends'},{source:'d',target:'a',relation:'depends'}] };
it('bounds outgoing traversal and includes only closed edges',()=>{ const result=graphNeighborhood(graph,'a',1,'outgoing'); expect(result.nodes.map(n=>n.id)).toEqual(['a','b']); expect(result.links).toHaveLength(1); expect(graphNeighborhood(graph,'a',2,'outgoing').nodes.map(n=>n.id)).toEqual(['a','b','c']); });
it('traces reverse dependencies without unrelated successors',()=>{ expect(graphNeighborhood(graph,'a',1,'incoming').nodes.map(n=>n.id)).toEqual(['a','d']); });
