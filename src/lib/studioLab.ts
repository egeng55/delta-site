import { parseEngineering } from './engineering';
import { parseOperations } from './operationsSnapshot';
import { projectRuntime, recordedTaskCharges } from './workspace';

export const studioEndpoints = [
  { id: 'workspace', label: 'Runtime observation', path: '/api/hq/workspace', description: 'Connection, retained activity and capability coverage.' },
  { id: 'report', label: 'Architecture report', path: '/api/hq/report', description: 'Source revision and registered system counts.' },
  { id: 'engineering', label: 'Engineering inventory', path: '/api/hq/engineering', description: 'Repository and worktree observation coverage.' },
  { id: 'operations', label: 'Backend & budget', path: '/api/hq/operations', description: 'Backend reachability and recorded budget reservations.' },
  { id: 'session', label: 'Owner session', path: '/api/hq/lifecycle/session', description: 'Session readiness without renewing or approving actions.' },
] as const;
export type StudioEndpointId = (typeof studioEndpoints)[number]['id'];
export type ProbeState = 'observed' | 'denied' | 'unavailable' | 'interrupted' | 'invalid';
export type ProbeResult = { endpoint: StudioEndpointId; state: ProbeState; httpStatus: number | null; durationMs: number; summary: string; projection: Record<string, unknown> | null };
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('invalid_response');
  return value as Record<string, unknown>;
};
const count = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw Error('invalid_response');
  return value as number;
};
const stamp = (value: unknown): string => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw Error('invalid_response');
  return new Date(value).toISOString();
};
const choice = (value: unknown, choices: readonly string[]): string => {
  if (typeof value !== 'string' || !choices.includes(value)) throw Error('invalid_response');
  return value;
};
const bool = (value: unknown): boolean => {
  if (typeof value !== 'boolean') throw Error('invalid_response');
  return value;
};
const revision = (value: unknown): string => {
  if (typeof value !== 'string' || !/^[a-f0-9]{7,40}$/.test(value)) throw Error('invalid_response');
  return value;
};

// Only this allowlisted projection is displayed. Raw endpoint payloads, headers,
// task text, local paths and credentials are never retained by the lab.
export function projectStudioResponse(endpoint: StudioEndpointId, value: unknown): Record<string, unknown> {
  const data = object(value);
  switch (endpoint) {
    case 'workspace': {
      if (data.version !== 1) throw Error('invalid_response');
      const runtime = data.runtime === null ? null : object(data.runtime);
      if (runtime && (!Array.isArray(runtime.commands) || !Array.isArray(runtime.capabilities))) throw Error('invalid_response');
      return {
        observedAt: stamp(data.observedAt),
        connection: choice(data.connection, ['connected', 'unconfigured', 'unavailable', 'snapshot', 'stale']),
        runtime: runtime ? { retained: count(runtime.retained), evicted: count(runtime.evicted), commandCoverage: runtime.commands instanceof Array ? runtime.commands.length : 0, capabilityCoverage: runtime.capabilities instanceof Array ? runtime.capabilities.length : 0 } : null,
      };
    }
    case 'report': {
      if (data.version !== 1 || data.synthetic !== false) throw Error('invalid_response');
      const census = object(data.census);
      return { generatedAt: stamp(data.generatedAt), sourceCommit: revision(data.sourceCommit), census: Object.fromEntries(['capabilities', 'tools', 'systems', 'resolved', 'ambiguous', 'unmapped'].map(key => [key, count(census[key])])) };
    }
    case 'engineering': {
      if (data.report === null) return { report: null, availability: 'unavailable' };
      const report = parseEngineering(data.report);
      return { observedAt: report.observedAt, repositories: report.repositories.length, availableRepositories: report.repositories.filter(repo => repo.available).length, observedWorktrees: report.repositories.reduce((total, repo) => total + repo.worktrees.length, 0), truncated: report.repositories.some(repo => repo.truncated || repo.branchesTruncated) };
    }
    case 'operations': {
      const report = parseOperations(value);
      return { observedAt: report.observedAt, backend: { state: report.backend.state, latencyMs: report.backend.latencyMs }, spending: { ...report.spending }, source: data.source === 'hosted' ? 'hosted' : 'local', stale: data.stale === true };
    }
    case 'session':
      return { active: bool(data.active), expiresAt: data.expires_at === null ? null : stamp(data.expires_at), renewable: bool(data.renewable), providerEnabled: bool(data.provider_enabled) };
  }
}

export function classifyProbeFailure(status: number | null, interrupted = false): Pick<ProbeResult, 'state' | 'summary'> {
  if (status === 401 || status === 403) return { state: 'denied', summary: 'The server denied access. No runtime authority was granted.' };
  if (interrupted) return { state: 'interrupted', summary: 'The read was interrupted or timed out. No automatic retry was made.' };
  return { state: 'unavailable', summary: 'The observation could not be read. Missing data is not a healthy result.' };
}

export const studioScenarios = [
  { id: 'valid_runtime', label: 'Valid runtime observation', description: 'Accept a bounded runtime payload using the existing production parser.' },
  { id: 'timeout', label: 'Request timeout', description: 'Keep an interrupted read distinct from a successful observation.' },
  { id: 'denied', label: 'Access denied', description: 'Classify unauthenticated and forbidden requests without retrying.' },
  { id: 'budget_stop', label: 'Budget-stop accounting', description: 'Keep recorded charges after a budget stop; preserve missing cost coverage.' },
  { id: 'duplicate_event', label: 'Duplicate command', description: 'Reject repeated command identifiers in a runtime observation.' },
  { id: 'malformed_response', label: 'Malformed response', description: 'Reject invalid budget data and omit unexpected sensitive fields.' },
] as const;
export type StudioScenarioId = (typeof studioScenarios)[number]['id'];
export type SimulationAssertion = { label: string; passed: boolean };
export type SimulationResult = { scenario: StudioScenarioId; label: string; mode: 'offline_simulation'; passed: boolean; assertions: SimulationAssertion[]; durationMs: number };

function runtimeFixture() {
  return { status: 'ok', runtime: 'delta-agent', operational_visibility: { scope: 'this_process_only', observed_at: '2026-09-30T12:00:00.000Z', records_evicted: 0, commands: [{ command_id: 'fixture-command', capability_id: 'repo.status', state: 'completed', verification: 'passed', usage: { total_tokens: null } }] }, capability_availability: [{ capability_id: 'repo.status', runtime_binding: 'bound', readiness: 'not_probed', approval_required: false }] };
}
const rejects = (work: () => unknown): boolean => { try { work(); return false; } catch { return true; } };

// Deliberately local and provider-free. These exercise client contracts; they do
// not simulate model intelligence or attest the runtime's approval enforcement.
export function runStudioScenario(scenario: StudioScenarioId, now: () => number = () => performance.now()): SimulationResult {
  const start = now();
  let assertions: SimulationAssertion[];
  switch (scenario) {
    case 'valid_runtime': {
      const result = projectRuntime(runtimeFixture());
      assertions = [{ label: 'Valid command is retained', passed: result.commands.length === 1 }, { label: 'Unmeasured tokens remain unknown', passed: result.commands[0].tokens === null }, { label: 'Binding does not imply readiness', passed: result.capabilities[0].readiness === 'not_probed' }];
      break;
    }
    case 'timeout': {
      const result = classifyProbeFailure(null, true);
      assertions = [{ label: 'Interrupted read is not a success', passed: result.state === 'interrupted' }, { label: 'Recovery text states no automatic retry', passed: result.summary.includes('No automatic retry') }];
      break;
    }
    case 'denied':
      assertions = [401, 403].map(status => ({ label: `HTTP ${status} stays access denied`, passed: classifyProbeFailure(status).state === 'denied' }));
      break;
    case 'budget_stop': {
      const task = { id: 'fixture-task', outcomeId: null, kind: 'engineering', state: 'request_budget_exhausted', chargedMicrousd: 4000, unknownUsage: false };
      assertions = [{ label: 'Budget stop retains its recorded charge', passed: recordedTaskCharges([task]) === 0.004 }, { label: 'Duplicate outcome does not double the charge', passed: recordedTaskCharges([task, { ...task }]) === 0.004 }, { label: 'Missing charge is not zero', passed: recordedTaskCharges([{ ...task, chargedMicrousd: null }]) === null }];
      break;
    }
    case 'duplicate_event': {
      const fixture = runtimeFixture();
      fixture.operational_visibility.commands.push({ ...fixture.operational_visibility.commands[0] });
      assertions = [{ label: 'Duplicate command IDs are rejected', passed: rejects(() => projectRuntime(fixture)) }];
      break;
    }
    case 'malformed_response': {
      const fixture = { observedAt: '2026-09-30T12:00:00.000Z', backend: { state: 'healthy', latencyMs: 12, revision: null }, spending: { state: 'available', day: '2026-09-30', dailyReserved: -1, monthlyReserved: 0, dailyCap: 1, monthlyCap: 10 } };
      const response = projectStudioResponse('session', { active: false, expires_at: null, renewable: true, provider_enabled: false, token: 'fixture-sensitive-value' });
      assertions = [{ label: 'Negative spending is rejected', passed: rejects(() => projectStudioResponse('operations', fixture)) }, { label: 'Unexpected fields are excluded', passed: !JSON.stringify(response).includes('fixture-sensitive-value') }];
      break;
    }
  }
  return { scenario, label: studioScenarios.find(item => item.id === scenario)!.label, mode: 'offline_simulation', passed: assertions.every(item => item.passed), assertions, durationMs: Math.max(0, now() - start) };
}

export function exportStudioSimulations(results: SimulationResult[]): string {
  // Fixed projection: never includes endpoint responses, prompts, credentials or paths.
  return JSON.stringify({ version: 1, mode: 'offline_simulation', qualification: 'client_contract_checks_only', providerCalls: 0, results: results.map(result => ({ scenario: result.scenario, passed: result.passed, durationMs: result.durationMs, assertions: result.assertions.map(assertion => ({ label: assertion.label, passed: assertion.passed })) })) }, null, 2);
}
