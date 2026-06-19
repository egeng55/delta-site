---
id: "003"
title: "Backend API surface separation"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-api-surface-separation"
agent_executable: true
security_related: false
recommended_next_phase: "Plan or implement a minimal separation between Behavioral OS endpoints and legacy health platform endpoints without changing runtime behavior unexpectedly."
evidence:
  - "/Users/egeng/delta-backend/api_server.py"
  - "/Users/egeng/delta-backend/docs/API_SURFACE_SEPARATION_PLAN.md"
  - "/Users/egeng/delta-backend/scripts/route_inventory.py"
  - "/Users/egeng/delta-backend/docs/CURRENT_STATE.md"
likely_files:
  - "api_server.py"
  - "routers/readiness.py"
  - "routers/behavioral_os.py"
  - "routers/conversation.py"
  - "routers/legacy_health.py"
  - "docs/CURRENT_STATE.md"
  - "tests/test_route_inventory.py"
  - "tests/test_domain_introspection.py"
  - "tests/test_status_contracts.py"
out_of_scope:
  - "mobile changes"
  - "site UI changes"
  - "database schema changes"
---

The audit noted that Behavioral OS and legacy health platform routes share the
same backend app surface. This needs a scoped architecture phase before broad
runtime changes.

## Phase 97 Update

Phase 97 created a backend API surface inventory and separation plan only. It
did not move endpoint handlers, change auth behavior, change API behavior, or
wire new routers into runtime request paths.

The read-only backend inventory found these route categories:

- Behavioral OS domain metadata
- Behavioral OS runtime
- conversation
- readiness/status
- proof/demo/dev
- legacy health/intelligence
- auth/account
- subscription/billing
- export/compliance
- shared infrastructure

The finding remains open because implementation is still pending.

Recommended next phase: extract read-only readiness and domain metadata routes
into routers while preserving paths, response contracts, public/protected/dev
local auth boundaries, and client compatibility.
