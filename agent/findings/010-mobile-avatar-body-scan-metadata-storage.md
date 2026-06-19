---
id: "010"
title: "Mobile avatar body-scan metadata storage"
priority: "P1"
status: "open"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-avatar-body-scan-metadata-storage"
agent_executable: true
security_related: true
source: "phase-96-reconciliation"
last_reviewed: "2026-06-19"
owner: "mobile privacy maintenance"
recommended_next_phase: "Audit avatar/body-scan metadata and separate low-sensitivity avatar style fields from health- or body-revealing local storage."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/src/services/avatarService.ts"
  - "/Users/egeng/delta-mobile/src/screens/AvatarCustomizeScreen.tsx"
  - "/Users/egeng/delta-mobile/src/screens/SettingsScreen.tsx"
likely_files:
  - "src/services/avatarService.ts"
  - "src/screens/AvatarCustomizeScreen.tsx"
  - "src/screens/SettingsScreen.tsx"
  - "src/types/avatar.ts"
  - "tests or service-level avatar storage tests"
out_of_scope:
  - "avatar redesign"
  - "new scan collection behavior"
  - "backend or site changes"
---

Avatar configuration is stored locally through `@delta_user_avatar_${userId}`,
and body-scan enablement is stored under `@delta:bodyScanEnabled`. Abstract
style fields may be low to medium sensitivity, but scan-derived or body-revealing
metadata should be treated as high sensitivity.

## Current State

- Avatar local storage remains in AsyncStorage.
- The exact avatar schema needs review before choosing migration, TTL, or
  deletion behavior.
- Phase 78 did not change avatar/body-scan storage.

## Risk

High if the payload includes body measurements, scan-derived metadata, file
URIs, or other body-revealing fields. Medium if it is limited to abstract style
preferences.

## Verification Needed

- Schema audit documenting which fields are safe display preferences.
- Tests for any migration/minimization behavior.
- `npm test -- --runInBand` in `delta-mobile`.
