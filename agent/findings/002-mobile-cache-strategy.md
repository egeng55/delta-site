---
id: "002"
title: "Mobile large sensitive cache strategy"
priority: "P1"
status: "open"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-cache-strategy"
agent_executable: true
security_related: true
recommended_next_phase: "Implement a mobile cache policy and TTL/minimization layer for large sensitive local caches without migrating chat transcripts, pending sync payloads, or adding encrypted-storage dependencies yet."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_CACHE_STRATEGY.md"
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
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
