---
id: "006"
title: "Electron production path"
priority: "P2"
status: "open"
repo: "site"
routine: "desktop"
slug: "electron-production-path"
agent_executable: true
security_related: false
recommended_next_phase: "Decide the Electron packaging, signing, notarization, update, and service-management path without claiming production readiness."
evidence:
  - "/Users/egeng/delta-site/docs/DESKTOP_APP.md"
  - "/Users/egeng/delta-site/desktop/main.cjs"
  - "/Users/egeng/delta-site/desktop/preload.cjs"
likely_files:
  - "docs/DESKTOP_APP.md"
  - "desktop/main.cjs"
  - "desktop/preload.cjs"
  - "package.json"
out_of_scope:
  - "App Store claims"
  - "production deployment automation"
  - "background listeners"
---

The desktop shell is useful for local development but still lacks a production
packaging, signing, notarization, and update strategy.
