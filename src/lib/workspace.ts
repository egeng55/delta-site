import type { ObservatoryReport } from './observatory';

export type Workspace = {
  version: 1;
  observedAt: string;
  source: ObservatoryReport | null;
  runtime: null | {
    observedAt: string;
    scope: 'this_process_only';
    revision: null;
    retained: number;
    evicted: number;
    commands: { id: string; capability: string | null; state: string; verification: string; tokens: number | null }[];
    capabilities: { id: string; binding: string; readiness: string; approvalRequired: boolean | null }[];
  };
  connection: 'connected' | 'unconfigured' | 'unavailable';
  billing: { state: 'unknown'; usd: null };
};
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('invalid_runtime');
  return v as Record<string, unknown>;
};
const id = (v: unknown) => {
  if (typeof v !== 'string' || !/^[a-zA-Z0-9_.:-]{1,160}$/.test(v)) throw new Error('invalid_runtime');
  return v;
};
const count = (v: unknown) => {
  if (!Number.isSafeInteger(v) || (v as number) < 0) throw new Error('invalid_runtime');
  return v as number;
};
const choice = (v: unknown, values: string[]) => {
  if (typeof v !== 'string' || !values.includes(v)) throw new Error('invalid_runtime_state');
  return v;
};
const states = ['queued', 'running', 'waiting_for_approval', 'completed', 'review_ready', 'failed', 'completed_with_tool_failure', 'provider_failed', 'provider_unavailable', 'provider_approval_required', 'policy_rejected', 'approval_required', 'iteration_limit', 'needs_clarification', 'plan_only', 'cancelled', 'unknown'];
export function projectRuntime(value: unknown): NonNullable<Workspace['runtime']> {
  const root = object(value), visibility = object(root.operational_visibility);
  if (root.status !== 'ok' || root.runtime !== 'delta-agent' || visibility.scope !== 'this_process_only') throw new Error('invalid_runtime');
  const stamp = visibility.observed_at;
  if (typeof stamp !== 'string' || !Number.isFinite(Date.parse(stamp))) throw new Error('invalid_runtime');
  if (!Array.isArray(visibility.commands) || visibility.commands.length > 100 || !Array.isArray(root.capability_availability) || root.capability_availability.length > 2000) throw new Error('invalid_runtime');
  const commands = visibility.commands.map(v => {
    const row = object(v), usage = object(row.usage);
    return { id: id(row.command_id), capability: row.capability_id === null ? null : id(row.capability_id), state: choice(row.state, states), verification: choice(row.verification, ['passed', 'failed', 'unknown']), tokens: usage.total_tokens === null ? null : count(usage.total_tokens) };
  });
  const capabilities = root.capability_availability.map(v => {
    const row = object(v);
    if (row.approval_required !== null && typeof row.approval_required !== 'boolean') throw new Error('invalid_runtime');
    return { id: id(row.capability_id), binding: choice(row.runtime_binding, ['bound', 'not_bound']), readiness: choice(row.readiness, ['not_probed', 'unavailable']), approvalRequired: row.approval_required as boolean | null };
  });
  if (new Set(commands.map(c => c.id)).size !== commands.length || new Set(capabilities.map(c => c.id)).size !== capabilities.length) throw new Error('duplicate_runtime_id');
  return { observedAt: stamp, scope: 'this_process_only', revision: null, retained: commands.length, evicted: count(visibility.records_evicted), commands, capabilities };
}
