import { projectRuntime } from './workspace';
const fixture = () => ({ status: 'ok', runtime: 'delta-agent', secret: 'never expose', operational_visibility: { observed_at: '2026-09-29T12:00:00.000Z', scope: 'this_process_only', records_evicted: 3, commands: [{ command_id: 'run-1', capability_id: null, state: 'completed', verification: 'passed', usage: { total_tokens: null }, prompt: 'private prompt' }] }, capability_availability: [{ capability_id: 'agent.audit', runtime_binding: 'bound', readiness: 'not_probed', approval_required: true }] });
it('projects only allowlisted fields, retaining unknown billing inputs and eviction scope', () => {
 const result = projectRuntime(fixture()); expect(result.evicted).toBe(3); expect(result.revision).toBeNull(); expect(result.commands[0].tokens).toBeNull(); expect(JSON.stringify(result)).not.toMatch(/secret|private prompt/);
});
it('rejects duplicate identifiers rather than joining unrelated runs', () => {
 const data = fixture(); data.operational_visibility.commands.push(data.operational_visibility.commands[0]); expect(() => projectRuntime(data)).toThrow();
});
it('rejects malformed source and usage values', () => {
 const data = fixture(); data.operational_visibility.observed_at = 'not-a-date'; expect(() => projectRuntime(data)).toThrow();
 expect(() => projectRuntime({})).toThrow();
});
it('rejects invented readiness and verification states instead of rendering them as authority', () => {
 const data = fixture(); data.capability_availability[0].readiness = 'authorized'; expect(() => projectRuntime(data)).toThrow();
 const other = fixture(); other.operational_visibility.commands[0].verification = 'approved'; expect(() => projectRuntime(other)).toThrow();
});
