---
id: "012"
title: "Mobile offline health cache strategy"
priority: "P1"
status: "resolved"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-offline-health-cache-strategy"
agent_executable: false
security_related: true
source: "phase-96-reconciliation, phase-117-remediation"
last_reviewed: "2026-06-21"
owner: "mobile privacy maintenance"
recommended_next_phase: "No further generic offline-health-cache phase is needed. Use narrower findings for weather/location and notification preference storage."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/docs/MOBILE_OFFLINE_HEALTH_CACHE.md"
  - "/Users/egeng/delta-mobile/src/services/offlineCache.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/offlineHealthCacheStorage.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/offlineHealthCacheStorage.test.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/dailyGreetingCache.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/dailyGreetingCache.test.ts"
likely_files:
  - "src/services/offlineCache.ts"
  - "src/services/storage/offlineHealthCacheStorage.ts"
  - "docs/MOBILE_OFFLINE_HEALTH_CACHE.md"
out_of_scope:
  - "pending sync queue changes covered by finding 008"
  - "new encrypted-storage dependencies without explicit approval"
  - "backend or site changes"
  - "weather/location cache work covered by finding 009"
  - "notification preference storage covered by finding 011"
---

`src/services/offlineCache.ts` stores generic API cache entries under
`delta_cache_${resource}_${userId}`. Some resource names can represent
health-derived, menstrual, profile, workout, or insight payloads. Phase 78 did
not change this generic offline cache path.

Phase 117 remediated the generic offline health cache path and the raw generated
daily greeting cache without changing backend, site, Supabase, auth, schema,
notification, mic, TTS, or product memory behavior.

## Completed Work

- Created `docs/MOBILE_OFFLINE_HEALTH_CACHE.md` with the offline health cache
  inventory.
- Added `src/services/storage/offlineHealthCacheStorage.ts`.
- Preserved the existing `delta_cache_${resource}_${userId}` key pattern.
- Wrapped generic offline cache entries in a schema-versioned TTL envelope.
- Added resource-level policy metadata for high-risk resources:
  `insights`, `workout`, `calendar`, `derivatives`, `profile`, and
  `menstrual`.
- Preserved the existing TTLs for known resources:
  - `insights`: 30 minutes
  - `workout`: 1 hour
  - `derivatives`: 1 hour
  - `calendar`: 24 hours
  - `profile`: 24 hours
  - `menstrual`: 24 hours
- Added recursive token-like field stripping.
- Added raw image/blob-like field stripping.
- Added conservative list caps for list-like payloads.
- Added valid legacy `CachedData` handling and rewrite into the envelope.
- Added legacy raw object/array handling where valid.
- Removed expired or malformed generic offline cache entries on read.
- Preserved the `offlineCache.ts` public API and pending sync behavior.
- Added `src/services/storage/dailyGreetingCache.ts` for
  `delta-greeting-${userId}-${date}`.
- Moved generated daily greeting values from raw strings to a 24-hour TTL
  envelope while preserving legacy raw string reads.
- Added explicit prefetch analytics minimization for cards, weekly summaries,
  causal chains, and modules before writing the existing 5-minute envelope.

## Storage Keys And Payloads Found

- `delta_cache_${resource}_${userId}`: generic offline API response cache.
- `@delta_insights_analytics_${userId}` and `@delta_insights_workout_${userId}`:
  prefetch caches using TTL envelopes.
- `@delta_insights_${tab}_${userId}`: insights hook cache using TTL envelopes.
- `delta-greeting-${userId}-${date}`: generated daily greeting fallback text.
- `menstrual_settings_${userId}` legacy and
  `delta_sensitive_menstrual_settings_${userId}` current: menstrual settings.
- `@delta_health_last_sync` legacy and `delta_sensitive_health_last_sync`
  current: HealthKit last sync timestamp.

Already-resolved adjacent storage:

- `delta_pending_sync` is covered by finding `008`.
- `@delta_user_avatar_${userId}` and `@delta:bodyScanEnabled` are covered by
  finding `010`.

Deferred adjacent findings:

- Weather/location cache remains tracked by `009`.
- Notification preference storage remains tracked by `011`.

## Remaining Work

Remaining mobile storage work is tracked by narrower findings:

- `009 Mobile weather/location cache TTL`
- `011 Mobile notification preference storage`

Encrypted large-cache storage and user-visible local cache clearing remain
broader product/storage decisions. Do not reopen this finding for pending sync,
avatar/body-scan metadata, weather/location, notification preferences, or
encrypted-storage dependency selection.

## Verification

Mobile verification passed with:

```bash
npm test -- --runInBand
```

Phase 117 added or updated focused tests for:

- TTL envelope creation,
- valid cache reads,
- expired cache cleanup,
- legacy `CachedData` rewrite,
- legacy raw object/array handling,
- malformed storage cleanup,
- token-like field minimization,
- raw image/blob-like field stripping,
- conservative array caps,
- generated greeting TTL/legacy behavior,
- pending sync regression coverage,
- avatar/body-scan regression coverage.
