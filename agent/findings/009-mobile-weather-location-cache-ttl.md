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
last_reviewed: "2026-06-23"
owner: "mobile privacy maintenance"
recommended_next_phase: "Review and merge the Phase 133 mobile weather/location cache TTL worktree, then mark this finding resolved only after integration verification passes."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/weather.ts"
  - "/Users/egeng/delta-worktrees/mobile-phase-133-mobile-weather-location-cache-ttl/docs/MOBILE_WEATHER_LOCATION_CACHE.md"
  - "/Users/egeng/delta-worktrees/mobile-phase-133-mobile-weather-location-cache-ttl/src/services/storage/weatherLocationCache.ts"
  - "/Users/egeng/delta-worktrees/mobile-phase-133-mobile-weather-location-cache-ttl/src/services/storage/weatherLocationCache.test.ts"
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

## Current State

- Weather cache remains in AsyncStorage.
- The cache is medium sensitivity and may be best handled with short TTL and
  payload minimization rather than large encrypted storage.
- Phase 133 implemented a scoped pending-merge worktree:
  `/Users/egeng/delta-worktrees/mobile-phase-133-mobile-weather-location-cache-ttl`.
- Worktree commit `a604c12` adds a weather/location cache helper for
  `@delta_weather_cache`, preserving the existing 30-minute TTL while adding a
  cache envelope, expired/malformed cleanup, legacy cache rewrite, recursive
  token-like field stripping, and two-decimal coordinate rounding if coordinate
  fields are accidentally present.
- The finding remains open until the Phase 133 worktree is reviewed, merged
  into `delta-mobile`, and verified from main.

## Risk

Medium. Location-adjacent cache data can reveal routine or location context,
but it is usually lower risk than chat transcripts, pending sync payloads, or
health insight caches.

## Verification Needed

- Tests for TTL expiry and malformed cache fallback.
- Tests that cache payloads do not grow beyond the intended weather context.
- `npm test -- --runInBand` in `delta-mobile`.
- Merge verification from `delta-mobile` main after reviewing the worktree diff.
