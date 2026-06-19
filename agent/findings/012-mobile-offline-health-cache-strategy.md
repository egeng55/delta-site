---
id: "012"
title: "Mobile offline health cache strategy"
priority: "P1"
status: "open"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-offline-health-cache-strategy"
agent_executable: true
security_related: true
source: "phase-96-reconciliation"
last_reviewed: "2026-06-19"
owner: "mobile privacy maintenance"
recommended_next_phase: "Add resource-level classification for generic offline cache entries and protect or expire high-risk health-derived resources."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/offlineCache.ts"
likely_files:
  - "src/services/offlineCache.ts"
  - "src/services/storage/"
  - "tests or service-level offline cache tests"
out_of_scope:
  - "pending sync queue changes covered by finding 008"
  - "new encrypted-storage dependencies without explicit approval"
  - "backend or site changes"
---

`src/services/offlineCache.ts` stores generic API cache entries under
`delta_cache_${resource}_${userId}`. Some resource names can represent
health-derived, menstrual, profile, workout, or insight payloads. Phase 78 did
not change this generic offline cache path.

## Current State

- Generic offline cache entries remain in AsyncStorage.
- Current TTL support exists in the generic cache object, but there is no
  resource-level sensitivity policy.
- High-risk resources should be protected, minimized, or expired more
  aggressively than low-risk display caches.

## Risk

High for health-derived, menstrual, profile, and generated insight resources.
Lower for generic non-sensitive display caches.

## Verification Needed

- Tests for resource classification.
- Tests for high-risk cache expiry/minimization/protection behavior.
- Regression tests for existing cache fallback behavior.
- `npm test -- --runInBand` in `delta-mobile`.
