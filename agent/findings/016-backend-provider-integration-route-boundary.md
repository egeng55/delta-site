---
id: "016"
title: "Backend provider integration route boundary"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-provider-integration-route-boundary"
agent_executable: true
security_related: true
source: "phase-112-reconciliation"
last_reviewed: "2026-06-21"
owner: "backend architecture maintenance"
recommended_next_phase: "Plan provider/integration route boundaries for audio, HealthKit sync, and vision/image analysis without changing side effects."
evidence:
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/api_server.py"
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

## Current State

Examples include:

- `POST /bedroom-copilot/audio/window`
- `POST /health-sync`
- `POST /vision/analyze-meal`

## Risk

High. These routes involve audio, biometric/wearable sync, or image-analysis
input paths. Future work must preserve gates, auth behavior, request/response
contracts, and side effects.

## Verification Needed

- Route/auth snapshot remains stable.
- No live mic, TTS, notification, provider integration, or database side-effect
  behavior changes.
- Focused tests cover representative integration route behavior before any
  router move.
