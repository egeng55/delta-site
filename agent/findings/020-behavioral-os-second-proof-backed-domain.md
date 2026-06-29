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
source: "phase-114-reconciliation, phase-140-scenario-registry"
last_reviewed: "2026-06-29"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Add deterministic evals, event taxonomy entries, feedback policy entries, and proof data before calling the selected second scenario proof-backed."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/INTELLIGENCE_SCENARIO_REGISTRY.md"
  - "/Users/egeng/delta-backend/domains/registry.py"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/scenarios/registry.py"
  - "/Users/egeng/delta-backend/tests/test_intelligence_scenarios.py"
likely_files:
  - "docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "docs/INTELLIGENCE_SCENARIO_REGISTRY.md"
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
`poor_sleep_workout_readiness` as the scaffolded second scenario candidate. It
is not proof-backed yet.

## Current State

The backend now has `scenarios/registry.py` and
`docs/INTELLIGENCE_SCENARIO_REGISTRY.md`.

Registered scenario fixtures:

- `late_caffeine_sleep_disruption`: `proof_backed`
- `poor_sleep_workout_readiness`: `scaffolded`

`poor_sleep_workout_readiness` was selected because it tests substrate transfer
across sleep context and exercise readiness instead of adding another
substance-timing loop. It has a bounded hypothesis, event/context links,
feedback links, privacy/storage notes, eval requirements, proof requirements,
and refusal boundaries.

It remains open because scaffolded metadata is not proof evidence.

## Risk

Medium. The registry narrows the scope and prevents "second domain" drift, but
proof-backed status still requires actual deterministic eval and proof
evidence. Risk remains high if future phases treat scaffolded metadata as
runtime behavior or product proof.

## Verification Needed

- Substrate capability rationale exists before runtime behavior.
- Domain/capability-pack contract exists before runtime behavior.
- Privacy and storage policy are explicit.
- Deterministic evals cover positive event, no-event, feedback, suppression or
  opt-out, unavailable state, and proof labels.
- Event taxonomy and feedback policy mappings exist for the selected scenario.
- Proof data shows substrate transfer beyond late caffeine.
- No Supabase, LLM, notification, TTS, mic, or memory-write action in scaffold
  phases.
