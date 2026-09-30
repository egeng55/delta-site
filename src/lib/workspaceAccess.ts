export type WorkspaceRole = 'owner' | 'consumer' | 'developer' | 'stakeholder' | 'admin';
export type WorkspaceName = 'personal' | 'studio' | 'control';

export interface WorkspaceAccess {
  userId: string;
  role: WorkspaceRole;
  workspaces: WorkspaceName[];
  permissions: string[];
}

export type WorkspaceAccessResult =
  | { status: 'authenticated'; access: WorkspaceAccess }
  | { status: 'signed_out' | 'denied' | 'unconfigured' };

const rolePolicy: Record<WorkspaceRole, { workspaces: WorkspaceName[]; permissions: string[] }> = {
  consumer: { workspaces: ['personal'], permissions: ['personal.read'] },
  developer: {
    workspaces: ['personal', 'studio'],
    permissions: ['personal.read', 'studio.catalog.read', 'studio.simulate'],
  },
  stakeholder: { workspaces: ['control'], permissions: ['control.summary.read'] },
  admin: {
    workspaces: ['personal', 'studio', 'control'],
    permissions: ['personal.read', 'studio.catalog.read', 'studio.simulate', 'control.summary.read'],
  },
  owner: {
    workspaces: ['personal', 'studio', 'control'],
    permissions: [
      'personal.read', 'studio.catalog.read', 'studio.simulate', 'control.summary.read',
      'control.owner.read', 'runtime.execute', 'runtime.approve',
    ],
  },
};

// Presentation policy only. Servers must resolve identity before using this helper.
// Studio simulation is fixture-only; runtime authority remains owner-only.
export function workspaceAccessFor(userId: string, role: WorkspaceRole): WorkspaceAccess {
  const policy = rolePolicy[role];
  return { userId, role, workspaces: [...policy.workspaces], permissions: [...policy.permissions] };
}

export function hasWorkspacePermission(access: WorkspaceAccess, permission: string): boolean {
  return access.permissions.includes(permission);
}
