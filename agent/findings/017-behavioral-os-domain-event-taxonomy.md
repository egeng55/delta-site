---
id: "017"
title: "Behavioral OS domain event taxonomy"
priority: "P1"
status: "resolved"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-domain-event-taxonomy"
agent_executable: true
security_related: false
source: "phase-114-reconciliation"
last_reviewed: "2026-06-22"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Event taxonomy metadata completed in Phase 122; future work should scope runtime event validation or site display separately."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_EVENT_TAXONOMY.md"
  - "/Users/egeng/delta-backend/domains/base.py"
  - "/Users/egeng/delta-backend/domains/event_taxonomy.py"
  - "/Users/egeng/delta-backend/domains/late_caffeine.py"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/tests/test_domain_event_taxonomy.py"
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

## Resolution Summary

Phase 122 added a backend metadata-only domain event taxonomy.

Backend now has:

- `domains/event_taxonomy.py`
- `docs/DOMAIN_EVENT_TAXONOMY.md`
- taxonomy-aware capability matrix metadata in `domains/capabilities.py`
- focused coverage in `tests/test_domain_event_taxonomy.py`

The taxonomy defines event categories, source classes, sensitivity levels,
stable event-type ids, validation helpers, and late-caffeine event support.
It does not change runtime event interpretation behavior.

## Current State

`late_caffeine` now declares these formal event types:

- `substance.caffeine_intake`
- `sleep.sleep_disruption`
- `schedule.late_day`
- `feedback.intervention_outcome`

The capability matrix reports supported event categories, supported event
types, event sources, and event sensitivity levels.

## Risk

Medium. The metadata risk is now reduced, but future runtime phases must still
avoid overclaiming behavior from vague natural-language observations.

## Remaining Work

This finding is resolved for metadata/contracts/docs/tests. Separate future
work may cover:

- runtime event type validation
- provider event source mapping
- optional site `/os` display of event taxonomy metadata

Those are intentionally not implemented in Phase 122.

## Verification Needed

- Backend docs/tests prove taxonomy metadata is read-only.
- No runtime event interpretation behavior changes.
- No Supabase, provider, LLM, notification, TTS, mic, or memory-write actions.
