---
id: "008"
title: "Mobile pending sync payload storage"
priority: "P1"
status: "open"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-pending-sync-payload-storage"
agent_executable: true
security_related: true
source: "phase-96-reconciliation"
last_reviewed: "2026-06-19"
owner: "mobile privacy maintenance"
recommended_next_phase: "Design and implement a reliability-safe protection strategy for delta_pending_sync payloads without deleting unsynced user data."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/offlineCache.ts"
likely_files:
  - "src/services/offlineCache.ts"
  - "src/services/storage/"
  - "tests or service-level offline cache tests"
out_of_scope:
  - "destructive pending sync cleanup"
  - "backend or site changes"
  - "new storage dependencies without explicit approval"
---

`src/services/offlineCache.ts` stores queued replay payloads under
`delta_pending_sync`. Those payloads can include endpoint names, request bodies,
tracking data, or other user-entered data. Phase 78 did not change this path.

## Current State

- Pending sync data remains in AsyncStorage.
- Queue reliability matters because deleting unsynced payloads can lose user
  data.
- Unknown or malformed payloads need a recovery/drop policy before any cleanup.

## Risk

High. Pending sync payloads can contain sensitive health-adjacent data and are
also data-loss sensitive.

## Verification Needed

- Focused tests for pending sync read/write behavior.
- Migration or protection tests that prove old payloads are not removed until
  the new storage or expiry strategy succeeds.
- `npm test -- --runInBand` in `delta-mobile`.
