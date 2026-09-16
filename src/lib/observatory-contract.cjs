/* Pure, closed projection shared by the offline exporter and owner-only reader. */
const MAX_BYTES = 2_000_000;
const ids = ['agent', 'backend', 'site', 'mobile', 'jobs'];
function fail() { throw new Error('observatory_invalid_report'); }
function shape(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(value, key))) fail();
}
function text(value, max = 140) {
  if (typeof value !== 'string' || !value.length || value.length > max || /[<>\x00-\x1f]|https?:|@|bearer\s|sk-[a-z0-9]/i.test(value)) fail();
}
function integer(value) { if (!Number.isSafeInteger(value) || value < 0 || value > 10_000_000) fail(); }
function date(value) { if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) fail(); }
function sha(value) { if (typeof value !== 'string' || !/^[a-f0-9]{40}$/.test(value)) fail(); }
function counts(value) {
  shape(value, ['capabilities', 'tools', 'systems', 'resolved', 'ambiguous', 'unmapped']);
  Object.values(value).forEach(integer);
  if (value.resolved + value.ambiguous + value.unmapped !== value.capabilities) fail();
}
function validateReport(value, { synthetic = false } = {}) {
  if (Buffer.byteLength(JSON.stringify(value)) > MAX_BYTES) fail();
  shape(value, ['version', 'generatedAt', 'sourceCommit', 'architectureVersion', 'synthetic', 'repositories', 'census', 'graphs', 'history']);
  if (value.version !== 1 || value.synthetic !== synthetic) fail();
  date(value.generatedAt); sha(value.sourceCommit); text(value.architectureVersion, 40); counts(value.census);
  if (!Array.isArray(value.repositories) || value.repositories.length !== 5) fail();
  const repos = new Set();
  value.repositories.forEach(repo => {
    shape(repo, ['id', 'label', 'sha', 'files', 'testFiles']);
    if (!ids.includes(repo.id) || repos.has(repo.id)) fail();
    repos.add(repo.id); text(repo.label, 60); sha(repo.sha); integer(repo.files); integer(repo.testFiles);
  });
  if (value.repositories.find(repo => repo.id === 'agent').sha !== value.sourceCommit) fail();
  if (!Array.isArray(value.graphs) || value.graphs.length < 2 || value.graphs.length > 3) fail();
  const graphIds = new Set();
  value.graphs.forEach(graph => {
    shape(graph, ['id', 'sourceCommit', 'generatedAt', 'nodes', 'links']);
    if (!['systems', 'capabilities', 'modules'].includes(graph.id) || graphIds.has(graph.id)) fail();
    graphIds.add(graph.id); sha(graph.sourceCommit); date(graph.generatedAt);
    if (graph.id !== 'modules' && graph.sourceCommit !== value.sourceCommit) fail();
    if (!Array.isArray(graph.nodes) || graph.nodes.length > 2000 || !Array.isArray(graph.links) || graph.links.length > 10000) fail();
    const nodes = new Set();
    graph.nodes.forEach(node => {
      shape(node, ['id', 'label', 'group', 'kind', 'maturity']);
      text(node.id, 240); text(node.label, 180); text(node.group, 80); text(node.kind, 60); text(node.maturity, 60);
      if (nodes.has(node.id)) fail();
      nodes.add(node.id);
    });
    graph.links.forEach(link => {
      shape(link, ['source', 'target', 'relation']);
      if (!nodes.has(link.source) || !nodes.has(link.target)) fail();
      if (!['declared owner', 'declared dependency', 'explicit capability mapping', 'registered handler', 'static relationship'].includes(link.relation)) fail();
    });
  });
  if (!graphIds.has('systems') || !graphIds.has('capabilities')) fail();
  if (!Array.isArray(value.history) || value.history.length > 90) fail();
  let previous = '';
  value.history.forEach(point => {
    shape(point, ['generatedAt', 'sourceCommit', 'census']);
    date(point.generatedAt); sha(point.sourceCommit); counts(point.census);
    if (point.generatedAt <= previous || point.generatedAt > value.generatedAt) fail();
    previous = point.generatedAt;
  });
  return value;
}
module.exports = { validateReport, MAX_BYTES };
