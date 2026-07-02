---
id: "020"
title: "Intelligence OS second proof scenario candidate"
priority: "P2"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-second-proof-scenario-capability-pack"
agent_executable: true
security_related: false
source: "phase-114-reconciliation, phase-140-scenario-registry, phase-141-merge, phase-142-evidence-collecting, phase-144-deterministic-evals, phase-145-merge, phase-146-proof-review-package, phase-147-merge, phase-148-proof-data-pack, phase-149-scenario-evidence-reframe, phase-150-merge, phase-151-dev-only-live-eval-trace-fixtures, phase-152-full-suite-audit"
last_reviewed: "2026-06-30"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Pause additional second-scenario proof work until a dev-only local Intelligence OS loop demonstrates event input, state update, hypothesis, recommendation, feedback, learning update, and changed next recommendation."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/INTELLIGENCE_SCENARIO_REGISTRY.md"
  - "/Users/egeng/delta-backend/domains/registry.py"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/scenarios/registry.py"
  - "/Users/egeng/delta-backend/scenarios/live_eval_traces.py"
  - "/Users/egeng/delta-backend/scripts/run_scenario_evals.py"
  - "/Users/egeng/delta-backend/scripts/run_scenario_evidence.py"
  - "/Users/egeng/delta-backend/scripts/run_scenario_live_eval_traces.py"
  - "/Users/egeng/delta-backend/evals/intelligence_scenarios/poor_sleep_workout_readiness.json"
  - "/Users/egeng/delta-backend/agent/evidence/scenario-evals/poor_sleep_workout_readiness.json"
  - "/Users/egeng/delta-backend/agent/evidence/scenario-fixtures/poor_sleep_workout_readiness.json"
  - "/Users/egeng/delta-backend/agent/evidence/scenario-live-evals/poor_sleep_workout_readiness.dev.json"
  - "/Users/egeng/delta-backend/agent/evidence/scenario-reviews/poor_sleep_workout_readiness_safety_review.json"
  - "/Users/egeng/delta-backend/agent/evidence/scenario-reviews/poor_sleep_workout_readiness_privacy_review.json"
  - "/Users/egeng/delta-backend/agent/evidence/scenario-reviews/poor_sleep_workout_readiness_rollback_plan.json"
  - "/Users/egeng/delta-backend/agent/evidence/scenario-reviews/poor_sleep_workout_readiness_user_controls.json"
  - "/Users/egeng/delta-backend/tests/test_scenario_eval_runner.py"
  - "/Users/egeng/delta-backend/tests/test_intelligence_scenarios.py"
likely_files:
  - "docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "docs/INTELLIGENCE_SCENARIO_REGISTRY.md"
  - "evals/intelligence_scenarios/"
  - "scripts/run_scenario_evals.py"
  - "agent/evidence/scenario-evals/"
  - "agent/evidence/scenario-reviews/"
  - "agent/evidence/scenario-fixtures/"
  - "agent/evidence/scenario-live-evals/"
  - "domains/"
  - "scenarios/"
  - "tests/"
out_of_scope:
  - "runtime behavior for a new domain without explicit approval"
  - "new storage or migrations"
  - "new product UI claims"
  - "Supabase mutations"
  - "LLM calls"
  - "notifications, TTS, mic, or memory writes"
---

`late_caffeine` is currently the only proof-backed Behavioral OS capability
pack and proof scenario. The next useful step is not "add another domain" by
itself. A second proof scenario should demonstrate that the Intelligence OS
substrate transfers beyond late caffeine:

```text
event/context -> memory/state -> hypothesis -> plan/intervention/tool use -> feedback -> learning/evidence -> next action
```

Phase 140 added a metadata-only scenario registry and selected
`poor_sleep_workout_readiness` as the second scenario candidate. Phase 142 was
merged to backend main in Phase 143 and promotes it from scaffolded to
evidence-collecting by adding metadata-only event taxonomy and feedback policy
mappings plus deterministic fixture scaffolding. It is not proof-backed yet.
The merge did not change runtime/API/auth/event-ingestion/feedback-runtime
behavior.

Phase 144 added a deterministic metadata-only scenario eval runner. Phase 145
merged it to backend main. The runner validates the poor-sleep fixture schema,
event mappings, feedback mappings, sample-response assertions, safety
assertions, and proof tags without API calls, Supabase, providers, models, or
runtime services. This adds deterministic eval evidence but does not add proof
data or runtime proof.

Phase 146 added a metadata-only proof review package. Phase 147 merged it to
backend main: safety review, privacy review, rollback plan, and user-control
specification. The safety/privacy/rollback reviews narrow promotion risk. The
user-control artifact specifies future controls but does not implement runtime
controls.

Phase 148 initially added synthetic metadata-only cases in a backend worktree
for `poor_sleep_workout_readiness`. Phase 149 reframed that work before merge
into a generic Scenario Evidence Engine. The poor-sleep cases
are retained as synthetic fixture evidence at
`agent/evidence/scenario-fixtures/poor_sleep_workout_readiness.json`. They
exercise generic evidence modeling across poor sleep, workout, readiness,
fatigue, motivation, and feedback outcome cases. They are fixture coverage
only: not user data, not real proof data, not live eval evidence, and not
runtime proof.

Phase 150 merged the corrected generic Scenario Evidence Engine to backend
main. The merge preserved the Phase 149 boundary: the engine is generic
metadata/test tooling, the poor-sleep cases are synthetic fixtures only, and
`poor_sleep_workout_readiness` remains `evidence_collecting`.

Phase 151 adds a dev-only live eval trace schema and fixture coverage for
`poor_sleep_workout_readiness`. The new trace fixture is useful for validating
future trace shape, safety boundaries, permission language, feedback
placeholders, and outcome placeholders, but it is not real live eval evidence,
not real user feedback, not an outcome observation, not real-world proof data,
not runtime user-control implementation, and not a proof-backed promotion
claim.

## Current State

Backend main now has `scenarios/registry.py`,
`docs/INTELLIGENCE_SCENARIO_REGISTRY.md`,
`scripts/run_scenario_evals.py`, deterministic evidence at
`agent/evidence/scenario-evals/poor_sleep_workout_readiness.json` and proof
review evidence under `agent/evidence/scenario-reviews/`. Backend main also now
has `scenarios/evidence.py`, `scripts/run_scenario_evidence.py`, and synthetic
fixture evidence at
`agent/evidence/scenario-fixtures/poor_sleep_workout_readiness.json`. Phase 151
adds `scenarios/live_eval_traces.py`,
`scripts/run_scenario_live_eval_traces.py`, and dev-only trace fixture evidence
at `agent/evidence/scenario-live-evals/poor_sleep_workout_readiness.dev.json`.

Registered scenario fixtures:

- `late_caffeine_sleep_disruption`: `proof_backed`
- `poor_sleep_workout_readiness`: `evidence_collecting` on backend main; not
  proof-backed or runtime-active

`poor_sleep_workout_readiness` was selected because it tests substrate transfer
across sleep context and exercise readiness instead of adding another
substance-timing loop. It has a bounded hypothesis, metadata-only event
taxonomy links, feedback policy links, privacy/storage notes, eval
requirements, proof requirements, and refusal boundaries.

It remains open because deterministic eval evidence, synthetic fixture
coverage, dev-only live eval trace fixtures, and proof review evidence are not
real live eval traces, real-world proof data, real user feedback/outcome
observations, or runtime user-control implementation.

Phase 143 merge verification kept this finding open. Phase 145 and Phase 147
merge verification also keep this finding open. The merges proved that the
event taxonomy, feedback policy, deterministic fixture scaffolding,
deterministic scenario eval evidence, and metadata-only review evidence are
stable enough to land, not that a second scenario is proof-backed.
Phase 150 keeps the same boundary while merging the Phase 149 correction:
synthetic fixture evidence is useful Scenario Evidence Engine coverage, but it
does not prove live behavior or activate runtime capabilities.
Phase 151 keeps that boundary for trace capture: dev-only trace fixtures are
schema/safety coverage only and do not satisfy the live eval proof gate.

Phase 152 requested a full-suite audit before further `020` implementation.
The audit pivots the next action away from more second-scenario paperwork and
toward a dev-only local Intelligence OS loop. This finding remains open, but it
should not drive the next phase unless that work directly advances live
learning/adaptation or validates the reusable substrate.

## Risk

Medium. The registry narrows the scope and prevents "second domain" drift, but
proof-backed status still requires real/live evidence and runtime-readiness evidence.
Risk remains high if future phases treat evidence-collecting metadata as
runtime behavior or product proof.

## Verification Needed

- Substrate capability rationale exists before runtime behavior.
- Domain/capability-pack contract exists before runtime behavior.
- Privacy and storage policy are explicit.
- Deterministic scenario eval evidence covers positive event, no-event,
  feedback, safety boundaries, proof tags, and proof-label refusal.
- Synthetic fixture evidence covers representative sleep/workout readiness,
  fatigue, motivation, and feedback outcome cases as generic Scenario Evidence
  Engine coverage only.
- Dev-only live eval trace fixtures validate schema and safety boundaries but
  remain separate from real live eval evidence.
- Safety review, privacy review, rollback plan, and user-control specification
  exist as metadata evidence.
- Event taxonomy and feedback policy mappings exist for the selected scenario.
- Live eval and implemented user controls exist before runtime candidacy.
- Real/live proof data, real user feedback, or outcome observations exist.
- No Supabase, LLM, notification, TTS, mic, or memory-write action in scaffold
  phases.
