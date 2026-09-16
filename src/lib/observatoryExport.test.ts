/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { project, writeReport } from '../../scripts/observatory-export.cjs';
import { observatoryPreview } from './observatoryPreview';

let root: string;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-export-')); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });
const report = (date = '2026-09-16T12:00:00.000Z') => ({ ...observatoryPreview(date), synthetic: false });

it('publishes a private, readback-verified snapshot and preserves chronological history', () => {
  const file = path.join(root, 'private', 'report.json');
  expect(writeReport(file, report()).sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(fs.statSync(file).mode & 0o777).toBe(0o600);
  writeReport(file, report('2026-09-17T12:00:00.000Z'));
  expect(JSON.parse(fs.readFileSync(file, 'utf8')).history).toHaveLength(1);
  expect(fs.readdirSync(path.dirname(file))).toEqual(['report.json']);
});
it('rejects invalid or time-regressing exports without destroying the last good report', () => {
  const file = path.join(root, 'report.json'); writeReport(file, report());
  const bytes = fs.readFileSync(file);
  expect(() => writeReport(file, report())).toThrow('report_time_regression');
  const invalid = report('2026-09-17T12:00:00.000Z'); invalid.census.capabilities++;
  expect(() => writeReport(file, invalid)).toThrow();
  expect(fs.readFileSync(file)).toEqual(bytes);
  expect(fs.readdirSync(root)).toEqual(['report.json']);
});
it('does not steal producer locks or overwrite symlinks or publish under public/', () => {
  const file = path.join(root, 'report.json');
  fs.writeFileSync(file + '.lock', 'another producer');
  expect(() => writeReport(file, report())).toThrow();
  expect(fs.readFileSync(file + '.lock', 'utf8')).toBe('another producer');
  fs.unlinkSync(file + '.lock');
  fs.writeFileSync(path.join(root, 'target'), 'preserve'); fs.symlinkSync(path.join(root, 'target'), file);
  expect(() => writeReport(file, report())).toThrow('previous_report_invalid');
  expect(fs.readFileSync(path.join(root, 'target'), 'utf8')).toBe('preserve');
  expect(() => writeReport(path.join(root, 'public', 'report.json'), report())).toThrow('private_output_required');
});
it('reads only committed main registries and ignores dirty files and local branches', () => {
  const git = (directory: string, args: string[]) => execFileSync('git', ['-C', directory, ...args], { stdio: 'pipe' });
  for (const id of ['agent', 'backend', 'site', 'mobile', 'jobs']) {
    const directory = path.join(root, `delta-${id}`); fs.mkdirSync(directory);
    git(directory, ['init', '-b', 'main']);
    git(directory, ['config', 'user.name', 'Fixture']); git(directory, ['config', 'user.email', 'fixture@example.test']);
    fs.writeFileSync(path.join(directory, 'README.md'), 'fixture');
    if (id === 'agent') {
      fs.mkdirSync(path.join(directory, 'config'));
      const save = (name: string, value: unknown) => fs.writeFileSync(path.join(directory, 'config', name), JSON.stringify(value));
      save('workspace-architecture.json', { architecture_version: '1.0.0', repositories: ['agent', 'backend', 'site', 'mobile', 'jobs'].map(id => ({ id, name: `delta-${id}` })), systems: [{ id: 'core', name: 'Core', owner_repo: 'agent', maturity: 'active', capability_ids: ['read'] }] });
      save('capabilities.json', { capabilities: [{ id: 'read' }] });
      save('runtime-tools.json', { tools: [{ handler: 'read', capability_ids: ['read'] }] });
    }
    git(directory, ['add', '.']); git(directory, ['-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'Fixture']);
  }
  const agent = path.join(root, 'delta-agent');
  const before = project({ workspace: root, generatedAt: '2026-09-16T12:00:00.000Z' });
  git(agent, ['switch', '-c', 'unapproved']);
  fs.writeFileSync(path.join(agent, 'config', 'capabilities.json'), '{"private":"not allowed"}');
  fs.writeFileSync(path.join(agent, 'untracked-private.txt'), 'not allowed');
  const after = project({ workspace: root, generatedAt: '2026-09-16T12:00:00.000Z' });
  expect(after).toEqual(before);
  expect(after.census).toMatchObject({ capabilities: 1, resolved: 1 });
});
