---
id: "018"
title: "Behavioral OS feedback policy matrix"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-feedback-policy-matrix"
agent_executable: true
security_related: false
source: "phase-114-reconciliation"
last_reviewed: "2026-06-21"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Define a read-only cross-domain feedback-to-policy-effects matrix before adding additional intervention-capable domains."
evidence:
  - "/Users/egeng/delta-backend/feedback_contract.py"
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/domains/late_caffeine_adapter.py"
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
The remaining gap is a cross-domain matrix that states what each canonical
feedback option is allowed to change for different domain types.

## Current State

Phase 114 exposes feedback capabilities in the domain capability matrix, but
it does not define policy effects across future domains. That is intentional:
capabilities are metadata, while policy mutation requires stricter review.

## Risk

High. Future intervention-capable domains could accidentally assign different
meanings to feedback labels such as `too_much`, `wrong_timing`, or
`suppress_topic`.

## Verification Needed

- Read-only matrix or docs/tests only unless a later runtime phase is approved.
- No change to current late-caffeine feedback mutation behavior.
- No Supabase, notification, TTS, mic, memory-write, or intervention delivery
  action.
