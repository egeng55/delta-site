---
id: "005"
title: "Live eval coverage"
priority: "P2"
status: "resolved"
repo: "site"
routine: "eval-update"
slug: "live-eval-coverage"
agent_executable: true
security_related: false
last_reviewed: "2026-06-22"
recommended_next_phase: "Current optional local live eval coverage is reconciled. Browser, LLM judge, CI, production, and user-state live evals remain intentionally deferred until separately scoped."
evidence:
  - "/Users/egeng/delta-site/docs/AGENT_EVALS.md"
  - "/Users/egeng/delta-site/docs/LOCAL_DOMAIN_LIVE_EVALS.md"
  - "/Users/egeng/delta-site/docs/LIVE_EVAL_COVERAGE_INVENTORY.md"
  - "/Users/egeng/delta-site/scripts/agent-eval-live.mjs"
  - "/Users/egeng/delta-site/scripts/agent-eval-live-core.cjs"
  - "/Users/egeng/delta-site/scripts/agent-eval-live-core.test.js"
  - "/Users/egeng/delta-site/evals/os-console/explainability.json"
  - "/Users/egeng/delta-site/evals/os-console/safety-language.json"
  - "/Users/egeng/delta-site/evals/os-console/domain-metadata.json"
  - "/Users/egeng/delta-backend/scripts/live_eval_readiness.py"
likely_files:
  - "docs/AGENT_EVALS.md"
  - "docs/LOCAL_DOMAIN_LIVE_EVALS.md"
  - "docs/LIVE_EVAL_COVERAGE_INVENTORY.md"
  - "evals/os-console/"
  - "scripts/agent-eval-live-core.cjs"
  - "scripts/agent-eval-live-core.test.js"
out_of_scope:
  - "external LLM API calls"
  - "LLM judges"
  - "browser automation"
  - "CI live eval requirements"
  - "automatic service startup"
  - "live mic, TTS, notifications"
  - "Supabase mutations"
  - "token printing or committed tokens"
---

Phase 80 added deterministic fixture assertions. Phases 90 through 94 added
optional local live eval infrastructure for the read-only Behavioral OS domain
metadata endpoint.

## Resolution Summary

Current live eval coverage now includes:

- optional local `npm run agent:eval:live`
- authenticated local mode through `DELTA_LIVE_EVAL_BEARER_TOKEN`
- parser-clean JSON output
- skip-safe classifications for unavailable/protected local backends
- durable local report recording under `agent/runs/` with explicit `--write`
- backend static readiness through
  `/Users/egeng/delta-backend/scripts/live_eval_readiness.py`
- runbook coverage in `docs/LOCAL_DOMAIN_LIVE_EVALS.md`
- coverage inventory in `docs/LIVE_EVAL_COVERAGE_INVENTORY.md`

Phase 124 expands live eval coverage reporting for Behavioral OS metadata:

- `domain_metadata`
- `event_taxonomy_metadata`
- `feedback_policy_metadata`
- `capability_matrix_metadata`

The current backend `/behavioral-os/domains` response exposes `event_types`, so
live evals can check that Late caffeine includes
`substance.caffeine_intake`. Feedback policy and capability-matrix metadata
are not currently exposed by that endpoint; live evals report those areas as
`not_exposed`, not failed.

## Current State

`npm run agent:eval` remains deterministic and service-free.

`npm run agent:eval:live` remains optional, local-only, read-only, skip-safe,
and excluded from normal tests/build/lint/CI. It does not start services, call
LLMs, run browser automation, mutate Supabase, trigger mic/TTS/notifications,
or write product memory.

## Deferred Work

The following remain intentionally deferred and should require separate phase
approval:

- browser `/os` UI live evals,
- Playwright checks,
- LLM judges,
- CI/background live eval runners,
- production/service live checks,
- user-state live checks,
- feedback mutation live checks,
- provider-ingestion live checks,
- exposed feedback-policy/capability-matrix live checks if a future backend
  phase adds those fields to read-only introspection responses.

## Verification Needed

Completed in Phase 124:

- deterministic eval fixture check,
- optional live eval skip-safe check,
- parser-clean live eval JSON,
- live eval report recording,
- live eval core tests,
- site safety scan, docs-only verify, test, lint, and build,
- backend live eval readiness and focused domain metadata tests.
