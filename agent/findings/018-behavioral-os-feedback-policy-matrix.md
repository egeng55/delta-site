---
id: "018"
title: "Behavioral OS feedback policy matrix"
priority: "P1"
status: "resolved"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-feedback-policy-matrix"
agent_executable: true
security_related: false
source: "phase-114-reconciliation"
last_reviewed: "2026-06-24"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Feedback policy matrix metadata is complete. Future runtime feedback policy validation and safety gates should be scoped separately."
evidence:
  - "/Users/egeng/delta-backend/feedback_contract.py"
  - "/Users/egeng/delta-backend/domains/feedback_policy.py"
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_FEEDBACK_POLICY_MATRIX.md"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/domains/late_caffeine_adapter.py"
  - "/Users/egeng/delta-backend/tests/test_domain_feedback_policy.py"
likely_files:
  - "feedback_contract.py"
  - "domains/"
  - "docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "tests/"
out_of_scope:
  - "feedback mutation behavior changes"
  - "intervention decision changes"
  - "new user-facing feedback actions"
  - "Supabase writes"
  - "notifications, TTS, mic, or memory writes"
---

`feedback_contract.py` provides the best current feedback model, and
`late_caffeine` maps its supported feedback capabilities into domain metadata.
Phase 123 adds a backend metadata-only feedback policy matrix that states how
domains classify feedback signals, sources, sensitivity, learning eligibility,
intervention-feedback support, and promotion evidence.

In the Intelligence OS framing, this finding covered the feedback and
learning/evidence substrate layers for domain capability packs. It did not make
the feedback matrix a runtime policy engine.

## Resolution Summary

Phase 123 resolved the metadata gap by adding:

- `domains/feedback_policy.py`
- `docs/DOMAIN_FEEDBACK_POLICY_MATRIX.md`
- `tests/test_domain_feedback_policy.py`
- capability-matrix feedback policy fields

The matrix is backend-only metadata. It does not change runtime feedback
handling, intervention decisions, event ingestion, LLM behavior, Supabase
behavior, API routes, site runtime, or mobile runtime.

## Current State

The domain capability matrix now reports:

- supported feedback signals,
- feedback sources,
- feedback learning modes,
- feedback sensitivity levels,
- intervention-feedback support,
- feedback policy readiness.

`late_caffeine` declares policy entries for explicit helpful/not-helpful,
dismissed, snoozed/timing, misunderstood, behavior followed/ignored, outcome
improved, and outcome unknown feedback.

Remaining work should be scoped separately:

- runtime feedback policy validation,
- feedback learning safety gates,
- provider or behavior-derived feedback proof,
- optional site display of feedback policy metadata,
- outcome-feedback eval expansion.

## Risk

Reduced. Future intervention-capable domains now have a metadata contract for
feedback-policy semantics. Runtime policy mutation still requires separate
approval and safeguards.

## Verification Needed

Completed in Phase 123:

- backend focused feedback/domain tests,
- backend full test suite,
- site maintenance/policy/daily maintenance verification,
- site docs-only verification, eval, lint, test, and build.

No Supabase, notification, TTS, mic, memory-write, provider, or intervention
delivery action was run.
