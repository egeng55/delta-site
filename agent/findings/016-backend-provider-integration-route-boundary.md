---
id: "016"
title: "Backend provider integration route boundary"
priority: "P1"
status: "resolved"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-provider-integration-route-boundary"
agent_executable: true
security_related: true
source: "phase-112-reconciliation"
last_reviewed: "2026-06-22"
owner: "backend architecture maintenance"
recommended_next_phase: "Provider/integration boundary inventory completed in Phase 121; future work should add route-specific health-sync or image-provider behavior tests before extraction."
evidence:
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/PROVIDER_INTEGRATION_ROUTE_BOUNDARY.md"
  - "/Users/egeng/delta-backend/api_server.py"
  - "/Users/egeng/delta-backend/scripts/route_inventory.py"
  - "/Users/egeng/delta-backend/tests/test_provider_integration_route_boundary.py"
  - "/Users/egeng/delta-backend/audio_runtime.py"
  - "/Users/egeng/delta-backend/vision.py"
likely_files:
  - "api_server.py"
  - "audio_runtime.py"
  - "vision.py"
  - "tracking.py"
  - "tests/test_audio_processing.py"
  - "tests/test_route_auth_snapshot.py"
out_of_scope:
  - "live mic execution"
  - "TTS or notification execution"
  - "provider credential changes"
  - "HealthKit sync behavior changes"
  - "image-analysis behavior changes"
---

Phase 112 found provider/integration routes still in `api_server.py`, including
audio-window ingestion, health sync, and vision/image analysis. These routes
handle sensitive inputs or integrations and should not move as generic cleanup.

## Resolution Summary

Phase 121 completed the provider/integration route boundary inventory without
moving handlers or changing runtime behavior.

Backend now has:

- `docs/PROVIDER_INTEGRATION_ROUTE_BOUNDARY.md`
- provider metadata in `scripts/route_inventory.py`:
  - `provider_boundary`
  - `provider_data_profile`
  - `requires_provider_review`
- `tests/test_provider_integration_route_boundary.py`

The inventory classifies `9` provider-review routes across health sync, local
audio/proof integration, image chat, meal image analysis, and provider-derived
export surfaces.

## Current State

Examples include:

- `POST /bedroom-copilot/audio/window`
- `GET /bedroom-copilot/{user_id}/status`
- `POST /chat/with-image`
- `POST /health-sync`
- `POST /vision/analyze-meal`
- `POST /export/{user_id}/pdf`
- `POST /export/{user_id}/csv`
- `POST /export/{user_id}/json`
- `POST /user/export`

## Risk

High. These routes involve audio, biometric/wearable sync, image-analysis
input paths, image chat, local proof status, or provider-derived export data.
Future work must preserve gates, auth behavior, request/response contracts,
rate limits, provider behavior, and side effects.

## Remaining Work

No route extraction is needed to resolve this finding. Future narrower work
should be scoped separately if implementation is desired:

- add health-sync request/response and side-effect preservation tests before
  moving `/health-sync`
- add image-provider behavior tests before moving `/vision/analyze-meal` or
  `/chat/with-image`
- decide whether Bedroom Copilot audio/status routes should move together under
  a local-proof router strategy

## Verification Needed

- Route/auth snapshot remains stable.
- Provider boundary counts remain stable.
- No live mic, TTS, notification, provider integration, or database side-effect
  behavior changes.
- Focused provider tests pass before any future router move.
