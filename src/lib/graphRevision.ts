import type {Graph,ObservatoryReport} from './observatory';
export type GraphChanges={added:string[];removed:string[];changed:string[];linksAdded:string[];linksRemoved:string[]};
export function compareGraphRevisions(before:ObservatoryReport,after:ObservatoryReport,layer:string):GraphChanges {
 const a=before.graphs.find(g=>g.id===layer),b=after.graphs.find(g=>g.id===layer);
 if(!a||!b)throw Error('layer_missing_in_revision');
 const old=new Map(a.nodes.map(n=>[n.id,n])),next=new Map(b.nodes.map(n=>[n.id,n]));
 const key=(e:Graph['links'][number])=>JSON.stringify([e.source,e.relation,e.target]);
 const ae=new Set(a.links.map(key)),be=new Set(b.links.map(key));
 return {added:[...next.keys()].filter(id=>!old.has(id)).sort(),removed:[...old.keys()].filter(id=>!next.has(id)).sort(),changed:[...next.keys()].filter(id=>{const x=old.get(id),y=next.get(id)!;return x&&(x.label!==y.label||x.group!==y.group||x.kind!==y.kind||x.maturity!==y.maturity);}).sort(),linksAdded:[...be].filter(e=>!ae.has(e)).sort(),linksRemoved:[...ae].filter(e=>!be.has(e)).sort()};
}
