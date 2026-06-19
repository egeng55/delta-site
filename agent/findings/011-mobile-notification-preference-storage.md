---
id: "011"
title: "Mobile notification preference storage"
priority: "P2"
status: "open"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-notification-preference-storage"
agent_executable: true
security_related: true
source: "phase-96-reconciliation"
last_reviewed: "2026-06-19"
owner: "mobile privacy maintenance"
recommended_next_phase: "Classify notification preference fields and move health- or cycle-revealing preferences out of general AsyncStorage if needed."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/notifications.ts"
  - "/Users/egeng/delta-mobile/src/screens/SettingsScreen.tsx"
likely_files:
  - "src/services/notifications.ts"
  - "src/screens/SettingsScreen.tsx"
  - "tests or service-level notification preference tests"
out_of_scope:
  - "sending notifications"
  - "permission prompt changes"
  - "backend or site changes"
---

Notification preferences are stored under `notification_settings`. Generic
toggle and reminder-time preferences may be medium sensitivity, while period or
cycle-related reminders can reveal health or reproductive context.

## Current State

- Notification preference storage remains in AsyncStorage.
- Phase 78 did not change notification preference storage.
- This finding is about stored preference classification, not notification
  delivery behavior.

## Risk

Medium. Some preferences are ordinary app settings; others may reveal sensitive
health context.

## Verification Needed

- Tests for any storage migration or field minimization.
- Confirmation that no notification delivery behavior changes.
- `npm test -- --runInBand` in `delta-mobile`.
