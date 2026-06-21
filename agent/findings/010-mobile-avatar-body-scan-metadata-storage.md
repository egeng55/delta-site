---
id: "010"
title: "Mobile avatar body-scan metadata storage"
priority: "P1"
status: "resolved"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-avatar-body-scan-metadata-storage"
agent_executable: false
security_related: true
source: "phase-96-reconciliation, phase-116-remediation"
last_reviewed: "2026-06-21"
owner: "mobile privacy maintenance"
recommended_next_phase: "No further local avatar/body-scan metadata storage phase is needed. Use narrower findings for remaining mobile storage categories."
evidence:
  - "/Users/egeng/delta-mobile/docs/MOBILE_SENSITIVE_STORAGE_PLAN.md"
  - "/Users/egeng/delta-mobile/docs/MOBILE_AVATAR_BODY_SCAN_STORAGE.md"
  - "/Users/egeng/delta-mobile/src/services/avatarService.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/avatarBodyScanStorage.ts"
  - "/Users/egeng/delta-mobile/src/services/storage/avatarBodyScanStorage.test.ts"
  - "/Users/egeng/delta-mobile/src/services/avatarService.test.ts"
  - "/Users/egeng/delta-mobile/src/screens/AvatarCustomizeScreen.tsx"
  - "/Users/egeng/delta-mobile/src/screens/SettingsScreen.tsx"
likely_files:
  - "src/services/avatarService.ts"
  - "src/services/storage/avatarBodyScanStorage.ts"
  - "docs/MOBILE_AVATAR_BODY_SCAN_STORAGE.md"
  - "src/types/avatar.ts"
out_of_scope:
  - "avatar redesign"
  - "new scan collection behavior"
  - "backend or site changes"
  - "Supabase profiles.avatar_config storage behavior"
  - "profile image upload or server storage behavior"
---

Avatar configuration is stored locally through `@delta_user_avatar_${userId}`,
and body-scan enablement is stored under `@delta:bodyScanEnabled`. Abstract
style fields may be low to medium sensitivity, but scan-derived or body-revealing
metadata should be treated as high sensitivity.

Phase 116 remediated the local avatar/body-scan metadata storage paths without
changing camera, upload, ML, avatar rendering, backend, site, or Supabase
behavior.

## Completed Work

- Created `docs/MOBILE_AVATAR_BODY_SCAN_STORAGE.md` with the local
  avatar/body-scan storage inventory.
- Added `src/services/storage/avatarBodyScanStorage.ts`.
- Wrapped local avatar/body-scan metadata in a schema-versioned 30-day TTL
  envelope under `@delta_user_avatar_${userId}`.
- Added metadata minimization before local persistence.
- Stripped token-like fields recursively before local persistence.
- Stripped raw image/blob-like fields such as base64 image data, raw image
  payload fields, captured frames, and blob/byte fields.
- Preserved safe display metadata needed by current avatar UI, including
  template/style/skin/accent fields, outfit ids, scan method/date/confidence,
  custom proportions, mesh URI references, and Ready Player Me URL metadata.
- Read valid legacy raw avatar objects and rewrote them into the TTL envelope.
- Removed expired or malformed local avatar metadata on read.
- Replaced direct dashboard raw JSON reads with the avatar/body-scan storage
  helper.
- Moved the small `@delta:bodyScanEnabled` flag to SecureStore using the
  existing sensitive storage helper, with legacy AsyncStorage fallback.
- Removed raw Ready Player Me URL values from local debug logging in the avatar
  scan/dashboard path.

## Storage Keys And Payloads Found

- `@delta_user_avatar_${userId}`: local avatar config and optional scan/body
  metadata.
- `@delta:bodyScanEnabled`: legacy body-scan enabled flag.
- `delta_sensitive_body_scan_enabled`: current SecureStore-backed body-scan
  enabled flag.

No AsyncStorage persistence of raw body-scan frames, raw image blobs, or raw
scan capture payloads was found. `src/services/bodyScanner.ts` processes pose
data in memory. Profile image upload/storage and Supabase `profiles.avatar_config`
remain outside this local-storage finding.

## Remaining Work

Remaining mobile storage work is tracked by adjacent findings:

- `009 Mobile weather/location cache TTL`
- `011 Mobile notification preference storage`
- `012 Mobile offline health cache strategy`

Do not reopen this finding for backend/cloud avatar config storage, profile
image upload, broad encrypted large-cache strategy, or UI avatar feature work.

## Verification

Mobile verification passed with:

```bash
npm test -- --runInBand
```

Phase 116 added focused tests for:

- TTL envelope creation,
- valid metadata reads,
- expired metadata cleanup,
- legacy raw avatar migration,
- malformed storage cleanup,
- token-like field stripping,
- raw image/blob-like field stripping,
- safe display metadata preservation,
- SecureStore migration for the body-scan enabled flag,
- avatar service use of the storage helper.
