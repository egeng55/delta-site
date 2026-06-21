---
id: "019"
title: "Behavioral OS domain promotion evidence gates"
priority: "P2"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-domain-promotion-evidence-gates"
agent_executable: true
security_related: false
source: "phase-114-reconciliation"
last_reviewed: "2026-06-21"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Convert lifecycle promotion criteria into read-only evidence checks or documentation before any domain moves beyond proof-backed."
evidence:
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
likely_files:
  - "domains/capabilities.py"
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
next gap is evidence tracking: future agents should know which proof, eval,
privacy, access-boundary, and user-control evidence is present before claiming
a domain is ready for `user_facing_alpha` or `production_ready`.

## Current State

The capability matrix reports the next lifecycle stage and criteria, but it
does not automatically verify evidence files or promotion readiness.

## Risk

Medium. Without evidence gates, future phases may overclaim lifecycle stage
readiness from metadata alone.

## Verification Needed

- Read-only evidence checks or docs only.
- No API behavior, runtime decision, auth, storage, or migration changes.
- Tests prove missing evidence is reported conservatively.
