---
id: "008"
title: "Mobile pending sync payload storage"
priority: "P1"
status: "resolved"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-pending-sync-payload-storage"
agent_executable: false
security_related: true
source: "phase-96-reconciliation, phase-115-remediation"
last_reviewed: "2026-06-21"
owner: "mobile privacy maintenance"
recommended_next_phase: "No further pending-sync-specific phase is needed. Use narrower mobile findings for remaining cache/storage categories."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_PENDING_SYNC_STORAGE.md"
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/offlineCache.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/pendingSyncStorage.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/pendingSyncStorage.test.ts"
  - "/Users/egeng/delta-mobile/src/services/offlineCache.test.ts"
likely_files:
  - "src/services/offlineCache.ts"
  - "src/services/storage/pendingSyncStorage.ts"
  - "docs/MOBILE_PENDING_SYNC_STORAGE.md"
out_of_scope:
  - "generic offline health cache strategy"
  - "encrypted large-queue storage dependency"
  - "backend or site runtime changes"
  - "new sync behavior"
---

`src/services/offlineCache.ts` stores queued replay payloads under
`delta_pending_sync`. Phase 115 remediated that specific pending-sync storage
path without changing backend behavior or broad mobile storage strategy.

## Completed Work

- Created `docs/MOBILE_PENDING_SYNC_STORAGE.md` with the pending/offline/sync
  queue inventory.
- Added `src/services/storage/pendingSyncStorage.ts`.
- Kept the queue in `AsyncStorage` because high-volume queues are not a good
  fit for `SecureStore`.
- Added a schema-versioned queue envelope.
- Added per-item `createdAt`, `expiresAt`, `schemaVersion`, and `payloadKind`
  metadata.
- Added a 14-day pending item TTL.
- Stripped token-like fields recursively before persistence.
- Preserved valid legacy raw array entries and rewrote them into the envelope.
- Dropped expired entries on read.
- Cleared malformed queue storage safely.
- Continued clearing successfully synced items through the existing
  `removeFromPendingSync` path.

## Storage Keys And Payloads Found

The only persistent pending API replay queue found was:

- `delta_pending_sync` in `src/services/offlineCache.ts`

Other sync/offline references were either generic caches, HealthKit sync
metadata already handled by sensitive storage helpers, watch connectivity
without a local persisted queue, or local diagnostic file writes outside this
finding.

## Remaining Work

Remaining mobile storage work is tracked by narrower findings:

- `009 Mobile weather/location cache TTL`
- `010 Mobile avatar body-scan metadata storage`
- `011 Mobile notification preference storage`
- `012 Mobile offline health cache strategy`

Do not reopen this pending-sync finding for generic offline cache or encrypted
large-storage strategy work.

## Verification

Mobile verification passed with:

```bash
npm test -- --runInBand
```

Phase 115 added focused tests for:

- TTL envelope creation,
- valid pending queue reads,
- expired entry cleanup,
- legacy array handling,
- malformed storage cleanup,
- synced item pruning,
- token-like field minimization,
- queue order preservation.
