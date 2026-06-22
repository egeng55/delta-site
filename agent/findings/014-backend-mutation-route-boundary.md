---
id: "014"
title: "Backend mutation route boundary"
priority: "P1"
status: "resolved"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-mutation-route-boundary"
agent_executable: true
security_related: false
source: "phase-112-reconciliation"
last_reviewed: "2026-06-22"
owner: "backend architecture maintenance"
recommended_next_phase: "Use the Phase 119 mutation boundary before any future mutation router movement."
evidence:
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/MUTATION_ROUTE_BOUNDARY.md"
  - "/Users/egeng/delta-backend/api_server.py"
  - "/Users/egeng/delta-backend/scripts/route_inventory.py"
  - "/Users/egeng/delta-backend/tests/test_mutation_route_boundary.py"
likely_files:
  - "api_server.py"
  - "tracking.py"
  - "profile card helpers"
  - "workout_coach.py"
  - "tests/test_route_auth_snapshot.py"
out_of_scope:
  - "bulk route moves"
  - "database schema changes"
  - "Supabase mutation behavior changes"
  - "client behavior changes"
---

Phase 112 found a large remaining write surface in `api_server.py`. These routes
create, update, delete, approve, scan, submit, or refresh state and should not be
handled as read-router leftovers.

Phase 119 resolved this boundary finding by adding explicit mutation metadata
to the backend static route inventory, a dedicated mutation boundary document,
and focused tests. No route handlers moved and no runtime, auth, API, rate-limit,
Supabase, or response behavior changed.

## Current State

The backend mutation boundary now classifies `65` mutation-required routes into:

- `tracking_or_intake_write`
- `profile_or_settings_mutation`
- `goal_or_target_mutation`
- `calendar_or_workout_mutation`
- `feedback_or_learning_mutation`
- `data_oversight_mutation`
- `health_sync_or_provider_mutation`
- `auth_or_billing_mutation`
- `export_or_compliance_action`
- `proof_or_dev_mutation`
- `mixed_or_unclear_mutation`

The boundary also guards method-specific read/write pairs so GET routes such as
calendar day reads, profile-card list reads, subscription reads, and Behavioral
OS preference reads do not inherit mutation metadata from same-path write
methods.

## Risk

Reduced but still important. The boundary is now documented and tested, but
future router movement or behavior changes still need explicit acceptance
criteria for unchanged side effects, auth boundaries, response contracts,
Supabase behavior, and rate limits.

## Verification Needed

- Route/auth snapshot remains stable.
- `tests/test_mutation_route_boundary.py` remains green.
- Focused tests cover write behavior and status codes before any future move.
- No Supabase write semantics change.
