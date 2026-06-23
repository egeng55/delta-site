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
source: "phase-96-reconciliation, phase-135-remediation-pending-merge"
last_reviewed: "2026-06-23"
owner: "mobile privacy maintenance"
recommended_next_phase: "Review and merge the Phase 135 mobile notification preference storage worktree, then mark this finding resolved only after integration verification passes."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/notifications.ts"
  - "/Users/egeng/delta-mobile/src/screens/SettingsScreen.tsx"
  - "/Users/egeng/delta-worktrees/mobile-phase-135-mobile-notification-preference-storage/docs/MOBILE_NOTIFICATION_PREFERENCES_STORAGE.md"
  - "/Users/egeng/delta-worktrees/mobile-phase-135-mobile-notification-preference-storage/src/services/notifications.ts"
  - "/Users/egeng/delta-worktrees/mobile-phase-135-mobile-notification-preference-storage/src/services/notifications.test.ts"
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
- Phase 135 implemented a scoped pending-merge worktree:
  `/Users/egeng/delta-worktrees/mobile-phase-135-mobile-notification-preference-storage`.
- The worktree moves the small `notification_settings` preference payload to
  SecureStore key `delta_sensitive_notification_settings` with legacy
  AsyncStorage fallback and verified cleanup.
- The implementation normalizes the settings object, drops unknown fields,
  deletes malformed secure or legacy JSON, and keeps the legacy value if a
  SecureStore migration write fails.
- Notification permission prompts, delivery behavior, scheduled-notification
  runtime behavior, push-token behavior, backend, site, and Supabase behavior
  were not changed.
- The finding remains open until the Phase 135 worktree is reviewed, merged
  into `delta-mobile`, and verified from main.

## Risk

Medium. Some preferences are ordinary app settings; others may reveal sensitive
health context.

## Verification Needed

- Tests for any storage migration or field minimization.
- Confirmation that no notification delivery behavior changes.
- `npm test -- --runInBand` in `delta-mobile`.
- Merge verification from `delta-mobile` main after reviewing the worktree diff.
