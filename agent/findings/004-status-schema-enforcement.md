---
id: "004"
title: "Status payload schema enforcement"
priority: "P1"
status: "resolved"
repo: "multi"
routine: "contract-hardening"
slug: "status-schema-enforcement"
agent_executable: false
security_related: false
source: "audit/manual, phase-113-reconciliation"
last_reviewed: "2026-06-21"
owner: "backend contract maintenance"
recommended_next_phase: "No broad status/readiness schema phase remains. Future schema work should start from narrower route-family findings."
evidence:
  - "/Users/egeng/delta-backend/contracts/status_models.py"
  - "/Users/egeng/delta-backend/docs/STATUS_PAYLOAD_SCHEMA_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/STATUS_CONTRACT.md"
  - "/Users/egeng/delta-backend/tests/test_status_contracts.py"
  - "/Users/egeng/delta-backend/tests/test_status_payload_schema_inventory.py"
  - "/Users/egeng/delta-site/src/lib/systemReadinessApi.ts"
  - "/Users/egeng/delta-site/src/components/OSConsole.tsx"
likely_files:
  - "delta-backend/contracts/status_models.py"
  - "delta-backend/docs/STATUS_PAYLOAD_SCHEMA_INVENTORY.md"
  - "delta-backend/tests/"
out_of_scope:
  - "broad response models for all API routes"
  - "mutation/generation route contracts"
  - "schema migrations"
  - "Supabase writes"
  - "mobile runtime changes"
---

Status/readiness payloads are consumed by the OS Console, local live-eval
tooling, and backend tests. This broad finding has been reconciled and closed
for the stable status/readiness surfaces.

## Completed Work

Phase 88 added backend Pydantic response contracts for:

- `DomainMetadataResponse`
- `DomainRegistryResponse`
- `ReadinessResponse`
- readiness submodels for backend, Supabase, conversation, proof user, local
  runtime, status JSON, and safety

Phase 98 moved readiness and domain metadata routes into routers without
changing route paths, auth behavior, or response meaning.

Phase 101 added route/auth snapshots that protect route shape, method,
category, auth-boundary, and rate-limit drift.

Phase 113 added and documented the remaining high-value status contracts:

- `BasicStatusResponse` for `GET /` and `GET /health`
- `BedroomCopilotStatusEnvelopeResponse` for
  `GET /bedroom-copilot/{user_id}/status`
- tolerant local Bedroom Copilot status JSON validation with
  `BedroomCopilotStatusResponse`
- `/Users/egeng/delta-backend/docs/STATUS_PAYLOAD_SCHEMA_INVENTORY.md`
- focused backend tests in
  `/Users/egeng/delta-backend/tests/test_status_payload_schema_inventory.py`

## Final Scope

The resolved scope is stable status/readiness/domain metadata/proof-status
payloads. It does not include broad response-model migration for all API routes,
operation responses that happen to include a `status` field, mutation routes,
generation routes, auth/billing/export/compliance surfaces, provider
integrations, or schema migrations.

Future schema work should use narrower route-family findings rather than
reopening this generic status payload finding.
