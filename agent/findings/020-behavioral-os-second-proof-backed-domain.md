---
id: "020"
title: "Behavioral OS second proof scenario and capability pack"
priority: "P2"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-second-proof-scenario-capability-pack"
agent_executable: true
security_related: false
source: "phase-114-reconciliation"
last_reviewed: "2026-06-24"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Select a second proof scenario/capability pack only if it demonstrates transferable Intelligence OS substrate behavior with explicit event, privacy, feedback, proof, and eval requirements."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/domains/registry.py"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
likely_files:
  - "docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "domains/"
  - "tests/"
out_of_scope:
  - "runtime behavior for a new domain without explicit approval"
  - "new storage or migrations"
  - "new product UI claims"
  - "Supabase mutations"
  - "LLM calls"
  - "notifications, TTS, mic, or memory writes"
---

`late_caffeine` is currently the only registered proof-backed Behavioral OS
capability pack and proof scenario. The next useful step is not "add another
domain" by itself. A second proof scenario should demonstrate that the
Intelligence OS substrate transfers beyond late caffeine:

```text
event/context -> memory/state -> hypothesis -> plan/intervention/tool use -> feedback -> learning/evidence -> next action
```

It should not be added until the metadata, privacy, feedback, proof, and eval
requirements are clear.

## Current State

The architecture document lists candidate capability-pack families such as
health/sleep recovery, fitness/training recovery, focus routines, mood/stress
patterns, career/job-search operations, and finance later with explicit privacy
controls. None of those are registered beyond `late_caffeine`.

## Risk

High if rushed. A second scenario can create scope creep, privacy creep, or
overbroad product claims if it is treated as architecture instead of a bounded
proof fixture for substrate transfer.

## Verification Needed

- Substrate capability rationale exists before runtime behavior.
- Domain/capability-pack contract exists before runtime behavior.
- Privacy and storage policy are explicit.
- Deterministic evals cover positive event, no-event, feedback, suppression or
  opt-out, unavailable state, and proof labels.
- No Supabase, LLM, notification, TTS, mic, or memory-write action in scaffold
  phases.
