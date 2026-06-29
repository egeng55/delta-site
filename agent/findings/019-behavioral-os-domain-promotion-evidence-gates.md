---
id: "019"
title: "Intelligence OS capability-pack promotion evidence gates"
priority: "P2"
status: "resolved"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-domain-promotion-evidence-gates"
agent_executable: true
security_related: false
source: "phase-114-reconciliation, phase-137-remediation, phase-139-merge-reconciliation"
last_reviewed: "2026-06-29"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "No follow-up needed for metadata-only promotion gates. Runtime promotion still requires separate explicit approval and evidence."
evidence:
  - "/Users/egeng/delta-backend/domains/promotion_gates.py"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/tests/test_domain_promotion_gates.py"
  - "/Users/egeng/delta-backend/docs/DOMAIN_PROMOTION_GATES.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
likely_files:
  - "domains/promotion_gates.py"
  - "domains/capabilities.py"
  - "tests/test_domain_promotion_gates.py"
  - "docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "tests/test_domain_capabilities.py"
out_of_scope:
  - "automatic product rollout"
  - "runtime domain promotion"
  - "new API endpoints"
  - "schema changes"
  - "Supabase mutations"
---

Phase 114 added static promotion criteria to the domain capability matrix. The
next gap was evidence tracking: future agents needed to know which proof, eval,
privacy, access-boundary, and user-control evidence is present before claiming
a capability pack or proof scenario is ready for `user_facing_alpha`,
`runtime_candidate`, or `production_ready`.

In the Intelligence OS framing, promotion gates evaluate readiness evidence for
capability packs and proof scenarios. They do not define general intelligence
and do not promote runtime behavior automatically.

## Resolution Summary

Phase 137 added metadata-only promotion evidence gates in
`domains/promotion_gates.py` and documents them in
`docs/DOMAIN_PROMOTION_GATES.md`. Phase 139 merged the work to backend main at
`bf7c0fbf` and then landed the scanner-safe safety wording at `d8e1f60b`
after reconciling the language with the Intelligence OS north star.

The gates define stable promotion stages:

- `planned`
- `scaffolded`
- `metadata_ready`
- `proof_backed`
- `runtime_candidate`
- `runtime_active`

They also define stable evidence types for domain/capability-pack metadata,
event taxonomy, feedback policy, capability matrix, contract tests,
deterministic evals, live eval support, proof data, runtime safety review,
privacy review, rollback plan, user controls, and runtime activation approval.

The capability matrix now reports promotion stage, present evidence, missing
evidence, next promotion requirements, and whether the next promotion is ready.

`late_caffeine` remains `proof_backed` as a proof scenario and proof-backed
capability pack. It is missing runtime live-eval, safety-review,
privacy-review, feedback-safety, and rollback-plan evidence before it can be a
`runtime_candidate`.

## Current State

Promotion gates are implemented, documented, merged to backend main, and
covered by backend tests. They remain metadata-only. They do not define the
core Intelligence OS, promote domains automatically, add API behavior, or
activate runtime paths.

## Risk

Medium. Without evidence gates, future phases may overclaim lifecycle stage
readiness from metadata alone.

## Verification Needed

Completed in Phase 137 and reconciled/merged in Phase 139:

- `domains/promotion_gates.py`
- `tests/test_domain_promotion_gates.py`
- capability matrix promotion readiness fields
- `docs/DOMAIN_PROMOTION_GATES.md`
- focused backend domain tests
- full backend pytest suite
- backend main verification after merge
- no API behavior, runtime decision, auth, storage, migration, event ingestion,
  feedback runtime, Supabase, provider, mic, TTS, notification, or product
  memory behavior changed.
