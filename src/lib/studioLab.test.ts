import { classifyProbeFailure, exportStudioSimulations, projectStudioResponse, runStudioScenario, studioEndpoints, studioScenarios } from './studioLab';

describe('Studio client contracts', () => {
  it.each(studioScenarios)('runs real fixture assertions for $id without transport', scenario => {
    const originalFetch = global.fetch;
    const fetchSpy = jest.fn(() => { throw Error('Unexpected transport'); });
    global.fetch = fetchSpy;
    let tick = 10;
    try {
      const result = runStudioScenario(scenario.id, () => tick++);
      expect(result.mode).toBe('offline_simulation');
      expect(result.passed).toBe(true);
      expect(result.assertions.length).toBeGreaterThan(0);
      expect(result.durationMs).toBe(1);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { global.fetch = originalFetch; }
  });

  it('projects runtime coverage without retaining task content or credentials', () => {
    const value = projectStudioResponse('workspace', { version: 1, observedAt: '2026-09-30T12:00:00Z', connection: 'connected', token: 'secret', runtime: { retained: 1, evicted: 0, commands: [{ prompt: 'private task' }], capabilities: [], credential: 'secret' } });
    expect(value).toEqual({ observedAt: '2026-09-30T12:00:00.000Z', connection: 'connected', runtime: { retained: 1, evicted: 0, commandCoverage: 1, capabilityCoverage: 0 } });
    expect(JSON.stringify(value)).not.toMatch(/private task|secret/);
  });

  it('keeps a missing runtime distinct from an empty healthy runtime', () => {
    expect(projectStudioResponse('workspace', { version: 1, observedAt: '2026-09-30T12:00:00Z', connection: 'unconfigured', runtime: null })).toMatchObject({ connection: 'unconfigured', runtime: null });
    expect(projectStudioResponse('engineering', { report: null })).toEqual({ report: null, availability: 'unavailable' });
  });

  it('rejects malformed success payloads and synthetic architecture reports', () => {
    expect(() => projectStudioResponse('workspace', { version: 1, observedAt: 'now', connection: 'connected', runtime: null })).toThrow();
    expect(() => projectStudioResponse('workspace', { version: 1, observedAt: '2026-09-30', connection: 'secret', runtime: null })).toThrow();
    expect(() => projectStudioResponse('report', { version: 1, synthetic: true })).toThrow();
    expect(() => projectStudioResponse('session', { active: 'yes' })).toThrow();
  });

  it('normalizes every probe failure without returning server error payloads', () => {
    expect(classifyProbeFailure(403)).toMatchObject({ state: 'denied' });
    expect(classifyProbeFailure(401)).toMatchObject({ state: 'denied' });
    expect(classifyProbeFailure(null, true)).toMatchObject({ state: 'interrupted' });
    expect(classifyProbeFailure(503)).toMatchObject({ state: 'unavailable' });
  });

  it('exports only fixture evidence and an explicit qualification boundary', () => {
    const result = { ...runStudioScenario('timeout'), token: 'secret', response: { private: true } };
    const exported = exportStudioSimulations([result]);
    expect(exported).not.toMatch(/secret|private/);
    expect(JSON.parse(exported)).toMatchObject({ mode: 'offline_simulation', providerCalls: 0, qualification: 'client_contract_checks_only' });
  });

  it('uses a fixed catalog with only existing GET observation routes', () => {
    expect(studioEndpoints.map(endpoint => endpoint.path)).toEqual(['/api/hq/workspace', '/api/hq/report', '/api/hq/engineering', '/api/hq/operations', '/api/hq/lifecycle/session']);
  });
});
