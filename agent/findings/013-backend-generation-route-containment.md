---
id: "013"
title: "Backend health-intelligence generation route containment"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-generation-route-containment"
agent_executable: true
security_related: false
source: "phase-112-reconciliation"
last_reviewed: "2026-06-21"
owner: "backend architecture maintenance"
recommended_next_phase: "Plan containment for health-intelligence generation, recompute, and inference routes without changing route behavior."
evidence:
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/API_SURFACE_SEPARATION_PLAN.md"
  - "/Users/egeng/delta-backend/api_server.py"
likely_files:
  - "api_server.py"
  - "health_intelligence.py"
  - "causal_discovery.py"
  - "insight_pregeneration.py"
  - "tests/test_route_auth_snapshot.py"
out_of_scope:
  - "LLM behavior changes"
  - "new generation behavior"
  - "Supabase mutations"
  - "client behavior changes"
---

Phase 112 found that the remaining health-intelligence surface includes
generation, recompute, LLM/inference, explanation, and cache-operation routes.
Those routes should not be moved as generic read-router cleanup.

## Current State

Examples include:

- `POST /health-intelligence/{user_id}/regenerate`
- `POST /health-intelligence/{user_id}/refresh-cache`
- `POST /health-intelligence/{user_id}/discover-patterns`
- `POST /health-intelligence/{user_id}/trend-analysis`
- `GET /health-intelligence/{user_id}/commentary`
- `GET /health-intelligence/{user_id}/modules/llm`
- `GET /health-intelligence/{user_id}/pattern/{pattern_id}/explain`

## Risk

High. These routes may trigger or expose inference, recompute, cache refresh, or
generated interpretation behavior. A future phase should first define route
contracts and containment boundaries before any router move.

## Verification Needed

- Route/auth snapshot remains stable.
- No generation, recompute, LLM, or inference behavior changes.
- Focused tests cover representative generation and inference routes before any
  extraction.
