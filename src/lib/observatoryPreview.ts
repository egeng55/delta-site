import type { ObservatoryReport, GraphNode } from './observatory';

// Synthetic design fixture only. The private report validator rejects this marker.
export function observatoryPreview(now = new Date().toISOString()): ObservatoryReport {
  const sha = 'a'.repeat(40);
  const repositories = ['agent', 'backend', 'site', 'mobile', 'jobs'].map((id, i) => ({ id, label: `delta-${id}`, sha, files: 100 + i * 25, testFiles: 20 + i * 3 }));
  const names = ['Governance', 'Reasoning', 'Source evidence', 'Context', 'Verification', 'Health gateway', 'Authentication', 'Read models', 'Owner workspace', 'Public pages', 'Mobile surfaces', 'Career projection'];
  const groups = ['agent', 'agent', 'agent', 'agent', 'agent', 'backend', 'backend', 'backend', 'site', 'site', 'mobile', 'jobs'];
  const nodes: GraphNode[] = [...repositories.map(repo => ({ id: `repo:${repo.id}`, label: repo.label, group: repo.id, kind: 'repository', maturity: 'declared' })), ...names.map((label, index) => ({ id: `system:example_${index}`, label, group: groups[index], kind: 'system', maturity: 'illustrative' }))];
  const links = names.map((_, index) => ({ source: `repo:${groups[index]}`, target: `system:example_${index}`, relation: 'declared owner' }));
  for (let i = 1; i < names.length; i++) links.push({ source: `system:example_${i}`, target: `system:example_${i - 1}`, relation: 'declared dependency' });
  const census = { capabilities: 48, tools: 36, systems: names.length, resolved: 28, ambiguous: 2, unmapped: 18 };
  return { version: 1, generatedAt: now, sourceCommit: sha, architectureVersion: 'preview', synthetic: true, repositories, census, graphs: [{ id: 'systems', sourceCommit: sha, generatedAt: now, nodes, links }, { id: 'capabilities', sourceCommit: sha, generatedAt: now, nodes: nodes.filter(node => node.kind === 'system'), links: links.filter(link => link.source.startsWith('system:')) }], history: [] };
}
