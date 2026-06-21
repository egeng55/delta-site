---
id: "020"
title: "Behavioral OS second proof-backed domain"
priority: "P2"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "behavioral-os-second-proof-backed-domain"
agent_executable: true
security_related: false
source: "phase-114-reconciliation"
last_reviewed: "2026-06-21"
owner: "behavioral-os architecture maintenance"
recommended_next_phase: "Select and scaffold a second proof-backed domain only after event taxonomy, privacy, feedback, proof, and eval requirements are explicit."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "/Users/egeng/delta-backend/domains/registry.py"
  - "/Users/egeng/delta-backend/domains/capabilities.py"
likely_files:
  - "docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "docs/DOMAIN_MODEL_IMPLEMENTATION_INVENTORY.md"
  - "domains/"
  - "tests/"
out_of_scope:
  - "runtime behavior for a new domain without explicit approval"
  - "new storage or migrations"
  - "new product UI claims"
  - "Supabase mutations"
  - "LLM calls"
  - "notifications, TTS, mic, or memory writes"
---

`late_caffeine` is currently the only registered proof-backed Behavioral OS
domain. A second domain would prove that the domain architecture generalizes,
but it should not be added until the remaining metadata, privacy, feedback,
proof, and eval requirements are clear.

## Current State

The architecture document lists candidate domains such as health/sleep
recovery, fitness/training recovery, focus routines, mood/stress patterns,
career/job-search operations, and finance later with explicit privacy
controls. None of those are registered domains yet.

## Risk

High if rushed. A second domain can create scope creep, privacy creep, or
overbroad product claims before the Behavioral OS loop is proven outside late
caffeine.

## Verification Needed

- Domain contract exists before runtime behavior.
- Privacy and storage policy are explicit.
- Deterministic evals cover positive event, no-event, feedback, suppression or
  opt-out, unavailable state, and proof labels.
- No Supabase, LLM, notification, TTS, mic, or memory-write action in scaffold
  phases.
