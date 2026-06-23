---
id: "006"
title: "Electron production path"
priority: "P2"
status: "deferred"
repo: "site"
routine: "desktop"
slug: "electron-production-path"
agent_executable: true
security_related: false
recommended_next_phase: "Only resume when explicit human approval exists for signing, notarization, update, artifact, or release workflow planning."
evidence:
  - "/Users/egeng/delta-site/docs/DESKTOP_APP.md"
  - "/Users/egeng/delta-site/desktop/main.cjs"
  - "/Users/egeng/delta-site/desktop/preload.cjs"
  - "/Users/egeng/delta-site/desktop/runtime-config.cjs"
likely_files:
  - "docs/DESKTOP_APP.md"
  - "desktop/main.cjs"
  - "desktop/preload.cjs"
  - "desktop/runtime-config.cjs"
  - "desktop/runtime-config.test.js"
  - "package.json"
out_of_scope:
  - "App Store claims"
  - "production deployment automation"
  - "background listeners"
---

The desktop shell is useful for local development but still lacks a production
packaging, signing, notarization, and update strategy.

## Phase 132 reconciliation

Phase 132 added an explicit Electron runtime-mode boundary:

- development mode keeps the existing allowlisted local service manager;
- packaged mode is a read-only local shell and does not start backend or
  Next.js development services;
- the fallback service-manager page disables start actions when packaged mode
  reports `serviceManagerEnabled: false`;
- desktop smoke checks and Jest coverage now guard the packaged/development
  split.

This reduces the risk that a packaged Electron binary implies production
service management. It does not make Delta OS signed, notarized, App
Store-ready, auto-updating, or release-publishable.

## Deferred follow-up

Resume this finding only for an explicitly approved production-release phase
covering packaging, signing, notarization, updates, artifact handling, and
release verification. Do not implement those steps from routine maintenance.
