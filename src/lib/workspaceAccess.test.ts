import { hasWorkspacePermission, workspaceAccessFor, type WorkspaceRole } from './workspaceAccess';

it.each<WorkspaceRole>(['consumer', 'developer', 'stakeholder', 'admin'])('never grants runtime authority to %s', role => {
  const access = workspaceAccessFor('verified-user', role);
  expect(hasWorkspacePermission(access, 'runtime.execute')).toBe(false);
  expect(hasWorkspacePermission(access, 'runtime.approve')).toBe(false);
  expect(hasWorkspacePermission(access, 'control.owner.read')).toBe(false);
});

it('separates consumer, development and reporting permissions', () => {
  expect(workspaceAccessFor('u', 'consumer').workspaces).toEqual(['personal']);
  expect(workspaceAccessFor('u', 'developer').workspaces).toEqual(['personal', 'studio']);
  expect(workspaceAccessFor('u', 'stakeholder').permissions).toEqual(['control.summary.read']);
  expect(workspaceAccessFor('u', 'owner').permissions).toEqual(expect.arrayContaining(['runtime.execute', 'runtime.approve']));
});

it('does not let one caller mutate the next caller policy', () => {
  const first = workspaceAccessFor('u', 'consumer');
  first.permissions.push('runtime.execute');
  first.workspaces.push('control');
  expect(workspaceAccessFor('v', 'consumer')).toEqual({ userId: 'v', role: 'consumer', workspaces: ['personal'], permissions: ['personal.read'] });
});
