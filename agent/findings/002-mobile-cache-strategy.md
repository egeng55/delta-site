---
id: "002"
title: "Mobile large sensitive cache strategy"
priority: "P2"
status: "deferred"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-cache-strategy"
agent_executable: false
security_related: true
source: "audit/phase-70, phase-96-reconciliation"
last_reviewed: "2026-06-19"
owner: "mobile privacy maintenance"
recommended_next_phase: "Use the narrower follow-up findings 008-012 for remaining mobile sensitive cache work."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_CACHE_STRATEGY.md"
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/commit/40fe923"
  - "/Users/egeng/delta-mobile/src/services/offlineCache.ts"
  - "/Users/egeng/delta-mobile/src/hooks/useInsightsData.ts"
  - "/Users/egeng/delta-mobile/src/components/Chat/ChatBottomSheet.tsx"
likely_files:
  - "src/services/offlineCache.ts"
  - "src/services/storage/"
  - "src/hooks/useInsightsData.ts"
  - "src/screens/DailyInsightsScreen.tsx"
  - "tests or service-level storage policy tests"
out_of_scope:
  - "chat transcript migration"
  - "pending sync destructive cleanup"
  - "new encrypted-storage dependencies"
  - "backend or site changes"
---

Phase 71 migrated small sensitive preferences. Phase 72 documented the strategy
for large sensitive cache surfaces. The next agent-owned step is cache policy,
TTL, and minimization.

## Partial Remediation Complete

This broad finding is not fully resolved, but it is no longer an accurate
single implementation target.

Completed work:

- Phase 71 migrated small sensitive values to SecureStore-backed helpers:
  menstrual settings, HealthKit enabled state, and HealthKit last-sync metadata.
- Phase 78 added TTL/minimization for local chat transcript persistence.
- Phase 78 added a shared TTL envelope for generated insight/dashboard-style
  cache writes in the insights and prefetch paths.
- Phase 78 explicitly avoided blindly moving large payloads into SecureStore.

The original broad finding is now superseded by narrower follow-up findings.
It remains deferred rather than resolved because remaining sensitive local
storage categories still need scoped review and implementation.

## Remaining Scoped Findings

- `008`: Mobile pending sync payload storage.
- `009`: Mobile weather/location cache TTL.
- `010`: Mobile avatar/body-scan metadata storage.
- `011`: Mobile notification preference storage.
- `012`: Mobile offline health cache strategy.
