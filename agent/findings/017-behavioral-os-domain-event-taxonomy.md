---
id: "017"
title: "Behavioral OS domain event taxonomy"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-domain-event-taxonomy"
agent_executable: true
security_related: false
source: "phase-114-reconciliation"
last_reviewed: "2026-06-21"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Define a formal read-only event taxonomy for Behavioral OS domains without changing runtime interpretation behavior."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/domains/base.py"
  - "/Users/egeng/delta-backend/domains/late_caffeine.py"
  - "/Users/egeng/delta-backend/event_interpreter.py"
likely_files:
  - "docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "domains/"
  - "tests/test_domain_capabilities.py"
out_of_scope:
  - "runtime event interpretation changes"
  - "new domains"
  - "schema changes or migrations"
  - "Supabase mutations"
  - "LLM calls"
---

The domain registry records per-domain `event_types`, but there is not yet a
formal cross-domain event taxonomy. Future domains need shared vocabulary for
event source, evidence quality, no-event filtering, privacy level, storage
decision, and domain ownership before event model expansion becomes safe.

## Current State

`late_caffeine` lists `caffeine`, `late_caffeine_intake`, and
`ambient_non_event` event categories. Those labels are useful but not yet a
general taxonomy for future domains.

## Risk

Medium. Without a taxonomy, future domains may use incompatible event labels or
overclaim behavior from vague natural-language observations.

## Verification Needed

- Backend docs/tests prove taxonomy metadata is read-only.
- No runtime event interpretation behavior changes.
- No Supabase, provider, LLM, notification, TTS, mic, or memory-write actions.
