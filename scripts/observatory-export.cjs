/* eslint-disable @typescript-eslint/no-require-imports */
/* Fixed read-only source projection. It never runs repository scripts or Graphify models. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { validateReport } = require('../src/lib/observatory-contract.cjs');

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 8_000_000, timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'] });
}
function project({ workspace, graphify = undefined, generatedAt = new Date().toISOString() }) {
  const repositories = ['agent', 'backend', 'site', 'mobile', 'jobs'].map(id => {
    const root = path.join(workspace, `delta-${id}`);
    const sha = git(root, ['rev-parse', '--verify', 'refs/heads/main']).trim();
    const files = git(root, ['ls-tree', '-r', '--name-only', sha]).trim().split('\n');
    return { id, label: `delta-${id}`, sha, files: files.length, testFiles: files.filter(file => /(^|\/)(tests?|__tests__)\/|\.(test|spec)\./.test(file)).length };
  });
  const sourceCommit = repositories[0].sha;
  const read = file => JSON.parse(git(path.join(workspace, 'delta-agent'), ['show', `${sourceCommit}:${file}`]));
  const architecture = read('config/workspace-architecture.json');
  const caps = read('config/capabilities.json').capabilities;
  const tools = read('config/runtime-tools.json').tools;
  const systems = { id: 'systems', sourceCommit, generatedAt, nodes: [], links: [] };
  const node = (id, label, group, kind, maturity = 'declared') => ({ id, label, group, kind, maturity });
  for (const repo of architecture.repositories) systems.nodes.push(node(`repo:${repo.id}`, repo.name, repo.id, 'repository'));
  for (const system of architecture.systems) {
    systems.nodes.push(node(`system:${system.id}`, system.name, system.owner_repo, 'system', system.maturity));
    systems.links.push({ source: `repo:${system.owner_repo}`, target: `system:${system.id}`, relation: 'declared owner' });
    for (const dependency of system.dependencies || []) systems.links.push({ source: `system:${system.id}`, target: `system:${dependency}`, relation: 'declared dependency' });
  }
  const capabilityGraph = { id: 'capabilities', sourceCommit, generatedAt, nodes: [], links: [] };
  const owners = new Map(caps.map(cap => [cap.id, []]));
  for (const system of architecture.systems) for (const id of system.capability_ids || []) if (owners.has(id)) owners.get(id).push(system);
  for (const cap of caps) {
    const mapped = owners.get(cap.id);
    capabilityGraph.nodes.push(node(`cap:${cap.id}`, cap.id, mapped.length === 1 ? mapped[0].owner_repo : 'unmapped', 'capability', mapped.length > 1 ? 'ambiguous' : mapped.length === 1 ? 'mapped' : 'unmapped'));
  }
  for (const system of architecture.systems) {
    const mapped = (system.capability_ids || []).filter(id => owners.has(id));
    if (mapped.length) capabilityGraph.nodes.push(node(`system:${system.id}`, system.name, system.owner_repo, 'system', system.maturity));
    for (const id of mapped) capabilityGraph.links.push({ source: `system:${system.id}`, target: `cap:${id}`, relation: 'explicit capability mapping' });
  }
  tools.forEach((tool, index) => {
    capabilityGraph.nodes.push(node(`tool:${index}`, tool.handler, 'runtime', 'handler'));
    for (const id of tool.capability_ids || []) if (owners.has(id)) capabilityGraph.links.push({ source: `cap:${id}`, target: `tool:${index}`, relation: 'registered handler' });
  });
  const lengths = [...owners.values()].map(value => value.length);
  const census = { capabilities: caps.length, tools: tools.length, systems: architecture.systems.length, resolved: lengths.filter(n => n === 1).length, ambiguous: lengths.filter(n => n > 1).length, unmapped: lengths.filter(n => !n).length };
  const graphs = [systems, capabilityGraph];
  if (graphify) {
    const file = path.join(graphify, 'graphify-out/modules.json');
    if (fs.statSync(file).size > 2_000_000) throw new Error('graphify_input_too_large');
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(graphify, 'manifest.json'), 'utf8'));
    if (raw.graph.source_commit !== manifest.source_commit || manifest.provider_calls !== 0 || raw.graph.observed_execution !== false) throw new Error('graphify_provenance_invalid');
    const allowed = value => typeof value === 'string' && /^(src|scripts)\/[a-zA-Z0-9_./-]+\.(mjs|cjs|js|ts|tsx)$/.test(value) && !value.includes('..');
    if (!raw.nodes.every(item => allowed(item.id))) throw new Error('graphify_path_rejected');
    graphs.push({ id: 'modules', sourceCommit: manifest.source_commit, generatedAt: new Date(manifest.generated_at).toISOString(), nodes: raw.nodes.map(item => node(item.id, item.id, 'agent', 'module', 'static')), links: raw.links.map(item => ({ source: item.source, target: item.target, relation: 'static relationship' })) });
  }
  return validateReport({ version: 1, generatedAt, sourceCommit, architectureVersion: architecture.architecture_version, synthetic: false, repositories, census, graphs, history: [] });
}

function writeReport(filename, report) {
  const destination = path.resolve(filename);
  if (destination.split(path.sep).some(part => ['public', '.next', 'node_modules'].includes(part))) throw new Error('private_output_required');
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  // An exclusive producer lock prevents two daily exports from losing history.
  const lock = destination + '.lock';
  const fd = fs.openSync(lock, 'wx', 0o600);
  let temporary;
  try {
    if (fs.existsSync(destination)) {
      if (fs.lstatSync(destination).isSymbolicLink() || fs.statSync(destination).size > 2_000_000) throw new Error('previous_report_invalid');
      const previous = validateReport(JSON.parse(fs.readFileSync(destination, 'utf8')));
      if (previous.generatedAt >= report.generatedAt) throw new Error('report_time_regression');
      report.history = [...previous.history, { generatedAt: previous.generatedAt, sourceCommit: previous.sourceCommit, census: previous.census }].slice(-90);
    }
    validateReport(report);
    const bytes = JSON.stringify(report);
    temporary = destination + '.' + crypto.randomUUID() + '.tmp';
    const output = fs.openSync(temporary, 'wx', 0o600);
    try { fs.writeFileSync(output, bytes); fs.fsyncSync(output); } finally { fs.closeSync(output); }
    fs.renameSync(temporary, destination); temporary = null;
    const directory = fs.openSync(path.dirname(destination), 'r');
    try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
    const readback = fs.readFileSync(destination);
    if (!readback.equals(Buffer.from(bytes))) throw new Error('report_readback_failed');
    return { sha256: crypto.createHash('sha256').update(readback).digest('hex'), repositories: report.repositories.length, census: report.census, sourceCommit: report.sourceCommit };
  } finally {
    if (temporary) fs.unlinkSync(temporary);
    fs.closeSync(fd); fs.unlinkSync(lock);
  }
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2); const options = {};
    for (let index = 0; index < args.length; index += 2) {
      if (!['--workspace', '--graphify', '--out'].includes(args[index]) || !args[index + 1] || options[args[index]]) throw new Error('invalid_arguments');
      options[args[index]] = args[index + 1];
    }
    if (!options['--workspace'] || !options['--out']) throw new Error('arguments_required');
    console.log(JSON.stringify(writeReport(options['--out'], project({ workspace: path.resolve(options['--workspace']), graphify: options['--graphify'] && path.resolve(options['--graphify']) }))));
  } catch { console.error('observatory_export_failed'); process.exitCode = 1; }
}
module.exports = { project, writeReport };
