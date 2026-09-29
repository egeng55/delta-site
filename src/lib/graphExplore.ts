import type { Graph } from './observatory';
export function graphNeighborhood(graph: Graph, focus: string | null, depth: number, direction: 'both' | 'outgoing' | 'incoming') {
  if (!focus || !graph.nodes.some(n => n.id === focus)) return graph;
  const ids = new Set([focus]);
  for (let step = 0; step < Math.min(3, Math.max(1, depth)); step++) {
    const frontier = new Set(ids);
    for (const edge of graph.links) {
      if (direction !== 'incoming' && frontier.has(edge.source)) ids.add(edge.target);
      if (direction !== 'outgoing' && frontier.has(edge.target)) ids.add(edge.source);
    }
  }
  return { ...graph, nodes: graph.nodes.filter(n => ids.has(n.id)), links: graph.links.filter(e => ids.has(e.source) && ids.has(e.target)) };
}
