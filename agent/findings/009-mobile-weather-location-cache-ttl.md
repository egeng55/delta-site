---
id: "009"
title: "Mobile weather/location cache TTL"
priority: "P2"
status: "open"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-weather-location-cache-ttl"
agent_executable: true
security_related: true
source: "phase-96-reconciliation"
last_reviewed: "2026-06-19"
owner: "mobile privacy maintenance"
recommended_next_phase: "Review weather/location cache minimization and TTL behavior, keeping the fix scoped to location-derived cached data."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/weather.ts"
likely_files:
  - "src/services/weather.ts"
  - "tests or service-level weather cache tests"
out_of_scope:
  - "weather API provider changes"
  - "backend or site changes"
  - "location permission behavior changes"
---

`src/services/weather.ts` stores weather data under `@delta_weather_cache`.
Weather records can reveal location-adjacent context such as city, conditions,
air quality, and timestamps.

## Current State

- Weather cache remains in AsyncStorage.
- The cache is medium sensitivity and may be best handled with short TTL and
  payload minimization rather than large encrypted storage.

## Risk

Medium. Location-adjacent cache data can reveal routine or location context,
but it is usually lower risk than chat transcripts, pending sync payloads, or
health insight caches.

## Verification Needed

- Tests for TTL expiry and malformed cache fallback.
- Tests that cache payloads do not grow beyond the intended weather context.
- `npm test -- --runInBand` in `delta-mobile`.
