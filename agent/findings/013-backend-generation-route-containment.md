---
id: "013"
title: "Backend health-intelligence generation route containment"
priority: "P1"
status: "resolved"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-generation-route-containment"
agent_executable: false
security_related: false
source: "phase-112-reconciliation, phase-118-containment"
last_reviewed: "2026-06-22"
owner: "backend architecture maintenance"
recommended_next_phase: "No broad containment phase remains. Future work should add route-family behavior-preservation tests or policy hardening without changing generation behavior."
evidence:
  - "/Users/egeng/delta-backend/docs/GENERATION_ROUTE_CONTAINMENT.md"
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/API_SURFACE_SEPARATION_PLAN.md"
  - "/Users/egeng/delta-backend/scripts/route_inventory.py"
  - "/Users/egeng/delta-backend/tests/test_generation_route_containment.py"
  - "/Users/egeng/delta-backend/api_server.py"
likely_files:
  - "docs/GENERATION_ROUTE_CONTAINMENT.md"
  - "scripts/route_inventory.py"
  - "tests/test_generation_route_containment.py"
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

Phase 118 resolved the containment scope by classifying and documenting the
generation/recompute surface without moving route handlers or changing runtime
behavior.

## Completed Work

- Added `/Users/egeng/delta-backend/docs/GENERATION_ROUTE_CONTAINMENT.md`.
- Added non-breaking static inventory fields:
  - `generation_boundary`
  - `side_effect_profile`
  - `containment_required`
- Classified `21` containment-required routes:
  - `llm_generation`: `13`
  - `narrative_backfill`: `2`
  - `non_llm_recompute`: `2`
  - `mixed_or_unclear`: `2`
  - `cache_refresh`: `1`
  - `counterfactual_or_simulation`: `1`
- Added focused tests in
  `/Users/egeng/delta-backend/tests/test_generation_route_containment.py`.
- Verified safe read routers are not classified as generation routes.
- Preserved route count, auth-boundary counts, category counts, and rate-limit
  counts.
- Left all route handlers in place.

## Final Scope

The resolved scope is route-surface containment and maintenance intelligence,
not behavior hardening. Containment means agents can now identify routes that
can trigger or expose LLM generation, recompute, cache refresh, narrative
backfill, counterfactual/simulation, provider-backed analysis, or mixed
LLM-adjacent behavior.

Route handlers were not moved. No LLM calls, generation paths, recompute paths,
cache-refresh behavior, auth behavior, API paths, response meanings, rate
limits, Supabase behavior, or client behavior changed.

## Remaining Work

Future work should use narrower findings or phases for:

- behavior-preservation tests around the highest-risk LLM/cache/backfill routes,
- rate-limit and cost-budget policy for LLM-backed generation,
- audit logging policy for generation/recompute triggers,
- cache invalidation policy tests,
- eventual source-module extraction only if snapshot-tested as behavior-neutral.
