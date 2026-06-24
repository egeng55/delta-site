---
id: "011"
title: "Mobile notification preference storage"
priority: "P2"
status: "resolved"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-notification-preference-storage"
agent_executable: true
security_related: true
source: "phase-96-reconciliation, phase-135-remediation, phase-136-merge"
last_reviewed: "2026-06-23"
owner: "mobile privacy maintenance"
recommended_next_phase: "No follow-up needed for this scoped finding. Broader notification delivery, permission, and push-token strategy remain out of scope unless separately approved."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/docs/MOBILE_NOTIFICATION_PREFERENCES_STORAGE.md"
  - "/Users/egeng/delta-mobile/src/services/notifications.ts"
  - "/Users/egeng/delta-mobile/src/services/notifications.test.ts"
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

## Resolution Summary

Phase 135 moved the small notification settings payload from legacy
AsyncStorage storage to SecureStore-backed sensitive storage:

- legacy key: `notification_settings`
- current key: `delta_sensitive_notification_settings`
- mobile source commit: `2b2c1ac Harden mobile notification preference storage`
- mobile merge commit: `fc13a21aca1a95c832b4c77dbc46e1226f2b5cbf`

The merged implementation normalizes the stored object, drops unknown fields,
cleans malformed SecureStore or legacy JSON, migrates valid legacy values to
SecureStore, and removes the legacy AsyncStorage value only after a verified
SecureStore write.

Phase 136 verified the merged work from `delta-mobile` main with:

```bash
npm test -- --runInBand
```

The main-branch verification passed with 15 suites and 102 tests.

## Current State

- Notification preference storage is SecureStore-backed for the scoped small
  settings object.
- Legacy AsyncStorage is retained only as a one-time migration fallback.
- Notification permission prompts, delivery behavior, scheduled-notification
  runtime behavior, push-token behavior, backend, site, and Supabase behavior
  were not changed.
- Broader notification runtime strategy remains out of scope for this resolved
  storage finding.

## Risk

Medium. Some preferences are ordinary app settings; others may reveal sensitive
health context.

## Verification Needed

Completed in Phase 136:

- reviewed the worktree diff from `delta-mobile` main,
- confirmed only notification storage docs/tests/source files changed,
- merged with a normal merge commit,
- ran `npm test -- --runInBand` from `delta-mobile` main,
- confirmed no notification delivery, permission, provider, backend, site,
  Supabase, or product-memory behavior changed.
