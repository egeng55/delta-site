---
id: "007"
title: "Behavioral OS domain model"
priority: "P1"
status: "deferred"
repo: "multi"
routine: "backend-architecture-plan"
slug: "behavioral-os-domain-model"
agent_executable: false
security_related: false
source: "audit/manual, phase-114-reconciliation"
last_reviewed: "2026-06-21"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Use narrower follow-up findings 017-020 for remaining domain-model expansion work."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/domains/base.py"
  - "/Users/egeng/delta-backend/domains/registry.py"
  - "/Users/egeng/delta-backend/domains/late_caffeine.py"
  - "/Users/egeng/delta-backend/domains/late_caffeine_adapter.py"
  - "/Users/egeng/delta-backend/domains/introspection.py"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
  - "/Users/egeng/delta-backend/contracts/status_models.py"
  - "/Users/egeng/delta-site/evals/os-console/domain-metadata.json"
likely_files:
  - "delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "delta-backend/domains/"
  - "delta-backend/tests/test_domain_capabilities.py"
  - "delta-site/agent/findings/"
out_of_scope:
  - "new product domains"
  - "runtime routing through a registry"
  - "database schema changes or migrations"
  - "Supabase mutations"
  - "live mic, TTS, notifications, or memory writes"
  - "site or mobile product behavior changes"
---

The original audit asked Delta to move from a health-only product frame toward
a multi-domain Behavioral OS with health as one domain family. That broad
finding is now materially addressed by architecture docs, inert backend domain
metadata, authenticated read-only introspection, site-side contract handling,
deterministic evals, optional local live evals, and Phase 114 capability
matrix inventory.

## Completed Work

- Phase 81 documented the Behavioral OS domain model and lifecycle.
- Phase 83 added the inert backend domain registry scaffold.
- Phase 84 added the read-only late-caffeine domain adapter.
- Phase 85 added authenticated read-only domain metadata introspection.
- Phase 86 added read-only domain metadata display to `/os`.
- Phase 87 added deterministic domain-aware eval fixtures.
- Phase 88 added backend response contracts for domain metadata/readiness.
- Phase 89 added site-side TypeScript contract types and normalization.
- Phases 90-94 added optional local live evals and durable live eval reports.
- Phase 114 added the backend domain capability matrix and
  `docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md`.

## Current State

`late_caffeine` is the only registered proof-backed Behavioral OS domain. The
domain registry, adapter, introspection helpers, response contracts, site
normalizers, deterministic evals, and live-eval skeleton are all read-only or
metadata-only for this domain-model surface.

Phase 114 records current domain capabilities:

- lifecycle stage,
- privacy level,
- event categories,
- feedback capabilities,
- prediction/intervention capability,
- proof-backed status,
- user-state/provider requirements,
- metadata-introspection safety,
- next-stage promotion criteria.

## Reconciliation Decision

Status is `deferred`, not `resolved`. The broad scaffold concern should no
longer be selected as the top actionable finding, but multi-domain Behavioral
OS expansion still has distinct remaining gaps.

Use narrower follow-up findings instead of reopening this broad item:

- `017 Behavioral OS domain event taxonomy`
- `018 Behavioral OS feedback policy matrix`
- `019 Behavioral OS domain promotion evidence gates`
- `020 Behavioral OS second proof-backed domain`

Do not add runtime domains, schema changes, Supabase writes, side effects, or
product claims from this broad finding.
