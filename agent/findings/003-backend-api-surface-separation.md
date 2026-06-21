---
id: "003"
title: "Backend API surface separation"
priority: "P1"
status: "deferred"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-api-surface-separation"
agent_executable: false
security_related: false
source: "audit/manual, phase-112-reconciliation"
last_reviewed: "2026-06-21"
owner: "backend architecture maintenance"
recommended_next_phase: "Use narrower follow-up findings 013-016 for remaining backend route-boundary work."
evidence:
  - "/Users/egeng/delta-backend/api_server.py"
  - "/Users/egeng/delta-backend/docs/API_SURFACE_SEPARATION_PLAN.md"
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/scripts/route_inventory.py"
likely_files:
  - "api_server.py"
  - "routers/"
  - "docs/API_SURFACE_SEPARATION_PLAN.md"
  - "docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "tests/test_route_inventory.py"
  - "tests/test_route_auth_snapshot.py"
out_of_scope:
  - "mobile changes"
  - "site UI changes"
  - "database schema changes"
  - "runtime route behavior changes without explicit phase approval"
---

The original audit noted that Behavioral OS and legacy health platform routes
shared one large backend app surface. That broad finding is now substantially
remediated for the low-risk route-extraction work and should no longer drive
daily maintenance as if no implementation happened.

## Completed Work

- Phase 97 created the initial backend API inventory and separation plan.
- Phase 98 extracted readiness and read-only Behavioral OS domain metadata
  routers.
- Phase 99 extracted conversation routes.
- Phase 100 extracted Behavioral OS runtime routes.
- Phase 101 added route/auth snapshot hardening.
- Phase 102 extracted legacy derivatives reads.
- Phase 103 extracted legacy insights/patterns/progress reads.
- Phase 104 extracted legacy dashboard/target reads.
- Phase 105 extracted the stored prediction read route.
- Phase 106 extracted health-intelligence read/status and learning audit reads.
- Phase 107 extracted profile-card list and data health/audit reads.
- Phase 108 extracted calendar and assessment reads.
- Phase 109 extracted workout reads.
- Phase 110 extracted the goal list read.
- Phase 111 extracted tracking history/today reads.
- Phase 112 inventoried the remaining `api_server.py` surface.

## Current State

Backend route count remains stable at `141`, and the legacy route count remains
stable at `83`. After Phase 112, `62` route entries are owned by dedicated
routers and `79` route entries remain in `api_server.py`.

The remaining `api_server.py` routes are mostly high-risk or mixed:

- mutation/write routes
- generation/recompute routes
- LLM/inference health-intelligence routes
- auth/account and subscription/access routes
- export/compliance routes
- provider/integration routes such as health sync, vision, and audio
- debug/local proof/support surfaces

## Reconciliation Decision

Status is `deferred`, not `resolved`. The broad safe-read extraction treadmill is
complete enough to stop treating this as the top actionable finding, but the
overall API surface is not fully separated.

Remaining work is split into narrower follow-up findings:

- `013 Backend health-intelligence generation route containment`
- `014 Backend mutation route boundary`
- `015 Backend auth billing export router strategy`
- `016 Backend provider integration route boundary`

Do not resume generic read-router extraction from this broad finding. Use the
Phase 112 inventory and the narrower findings for future scoped phases.
