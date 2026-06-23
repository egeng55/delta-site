---
id: "009"
title: "Mobile weather/location cache TTL"
priority: "P2"
status: "resolved"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-weather-location-cache-ttl"
agent_executable: true
security_related: true
source: "phase-96-reconciliation, phase-133-remediation"
last_reviewed: "2026-06-23"
owner: "mobile privacy maintenance"
recommended_next_phase: "No further weather/location-cache-specific phase is needed. Use narrower findings for remaining mobile storage categories."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/docs/MOBILE_WEATHER_LOCATION_CACHE.md"
  - "/Users/egeng/delta-mobile/src/services/weather.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/weatherLocationCache.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/weatherLocationCache.test.ts"
likely_files:
  - "src/services/weather.ts"
  - "src/services/storage/weatherLocationCache.ts"
  - "tests or service-level weather cache tests"
out_of_scope:
  - "weather API provider changes"
  - "backend or site changes"
  - "location permission behavior changes"
---

`src/services/weather.ts` stores weather data under `@delta_weather_cache`.
Weather records can reveal location-adjacent context such as city, conditions,
air quality, and timestamps.

## Completed Work

- Phase 133 added `docs/MOBILE_WEATHER_LOCATION_CACHE.md` with the weather and
  location cache inventory.
- The scoped worktree commit `a604c12` was merged into `delta-mobile` main by
  merge commit `e42c73b`.
- Weather cache remains in `AsyncStorage` because it is a high-volume,
  short-lived display cache rather than a small preference for `SecureStore`.
- Added `src/services/storage/weatherLocationCache.ts` for
  `@delta_weather_cache`.
- Preserved the existing 30-minute TTL while adding a schema-versioned cache
  envelope.
- Added expired and malformed cache cleanup on read.
- Added fresh legacy `{ data, timestamp }` handling and rewrite into the
  current cache envelope.
- Added recursive token-like field stripping before storage or return.
- Added defensive two-decimal coordinate rounding if coordinate fields are
  accidentally present.
- Did not change location permission prompts, provider behavior, backend,
  site, Supabase, or broader location persistence strategy.

## Risk

Medium. Location-adjacent cache data can reveal routine or location context,
but it is usually lower risk than chat transcripts, pending sync payloads, or
health insight caches.

## Storage Keys And Payloads Found

- `@delta_weather_cache`: current weather display payload with city-level
  location, weather conditions, air quality, display timestamps, and no
  intentional precise coordinates or location history.

## Remaining Work

Remaining mobile storage work is tracked by adjacent findings:

- `011 Mobile notification preference storage`

Do not reopen this finding for provider changes, location permission behavior,
weather feature behavior, or broad encrypted large-cache strategy.

## Verification

Mobile verification passed from `delta-mobile` main with:

```bash
npm test -- --runInBand
```

Phase 133 added focused tests for:

- TTL envelope creation,
- valid cache reads,
- expired cache cleanup,
- malformed cache cleanup,
- legacy cache read and rewrite,
- token-like field stripping,
- coordinate precision reduction,
- display weather field preservation.
