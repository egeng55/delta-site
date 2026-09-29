import type { GraphNode } from './observatory';
const names: Record<string, string> = {
 'Deterministic governance kernel': 'Governance',
 'Local Intelligence runtime': 'Local runtime',
 'Shared persistent LLM agent runtime': 'Agent runtime',
 'Agent Event Bus and lifecycle manager': 'Event bus',
 'Organizational Observability': 'Observability',
 'Authenticated local owner session': 'Owner sessions',
 'Push-to-talk voice transport': 'Voice',
 'Authenticated foreground operator daemon': 'Operator',
 'Consented continuity memory': 'Memory',
 'Shared architecture and context control plane': 'Architecture & context',
 'Bounded engineering mission orchestrator': 'Engineering',
 'Backend API and persistence plane': 'API & storage',
 'Personal Intelligence read bridge': 'Personal context API',
 'Personal Intelligence context brief': 'Daily brief',
 'Intelligence capability composition layer': 'Capability composition',
 'WHOOP connector and ChatGPT MCP surface': 'WHOOP connector',
 'Web and Electron operator surfaces': 'Web & desktop',
 'Mobile client and bounded offline state': 'Mobile & offline',
 'External Perception v1 shared contracts': 'External perception',
 'Durable Daily AI Capability Intelligence Orchestrator V1': 'AI research',
 'Prospect Intelligence and automation-opportunity analysis V1': 'Prospect research',
 'Web monitoring agent': 'Web monitoring',
 'Job discovery and application agent': 'Job discovery',
 'System State Reconciliation': 'System reconciliation',
 'Time-aware product scheduler': 'Scheduler',
 'Shared calendar Google connector adapter': 'Google Calendar',
 'Shared calendar Apple population adapter': 'Apple Calendar',
 'Shared calendar daily sync orchestrator': 'Calendar sync',
};
export function graphLabel(node: GraphNode) {
 if (node.kind === 'repository') return node.label.replace(/^delta-/, '');
 if (names[node.label]) return names[node.label];
 const label = node.label.includes('/') ? node.label.split('/').at(-1)! : node.label;
 const short = label.length > 32 && label.includes('.') ? label.split('.').slice(-2).join(' · ') : label;
 return short.length > 32 ? short.slice(0,29) + '…' : short;
}
export function graphPositions(nodes: GraphNode[]) {
 const groups = [...new Set(nodes.map(n => n.group))].sort((a,b) => {
  const order=['agent','backend','site','mobile','jobs','runtime','unmapped'];
  return order.indexOf(a)-order.indexOf(b) || a.localeCompare(b);
 });
 const positions = new Map<string,{x:number;y:number}>();
 let offset = 0;
 groups.forEach(group => {
  const members=nodes.filter(n=>n.group===group).sort((a,b)=>graphLabel(a).localeCompare(graphLabel(b)));
  const roots=members.filter(n=>n.kind==='repository');
  const children=members.filter(n=>n.kind!=='repository');
  const columns=Math.max(1,Math.ceil(children.length/7));
  roots.forEach(n=>positions.set(n.id,{x:offset+(columns-1)*150,y:0}));
  children.forEach((n,index)=>positions.set(n.id,{x:offset+Math.floor(index/7)*300,y:100+(index%7)*90}));
  offset += columns*300+90;
 });
 return positions;
}
