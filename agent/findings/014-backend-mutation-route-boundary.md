---
id: "014"
title: "Backend mutation route boundary"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-mutation-route-boundary"
agent_executable: true
security_related: false
source: "phase-112-reconciliation"
last_reviewed: "2026-06-21"
owner: "backend architecture maintenance"
recommended_next_phase: "Plan mutation route boundaries for remaining legacy write surfaces before any router movement."
evidence:
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/api_server.py"
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

## Current State

Examples include:

- tracking intake and delete routes
- goal create/update routes
- profile card create/update/delete/reorder routes
- workout plan/status/exercise write routes
- calendar update route
- data oversight approve/scan/undo routes
- support submit route

## Risk

High. These routes mutate user data or app state. Future work needs explicit
acceptance criteria for unchanged side effects, auth boundaries, and response
contracts.

## Verification Needed

- Route/auth snapshot remains stable.
- Focused tests cover write behavior and status codes before any move.
- No Supabase write semantics change.
