---
id: "005"
title: "Live eval coverage"
priority: "P2"
status: "open"
repo: "site"
routine: "eval-update"
slug: "live-eval-coverage"
agent_executable: true
security_related: false
recommended_next_phase: "Design deterministic live-behavior eval coverage for OS Console explainability without calling external LLM APIs or requiring side-effect systems."
evidence:
  - "/Users/egeng/delta-site/docs/AGENT_EVALS.md"
  - "/Users/egeng/delta-site/evals/os-console/explainability.json"
  - "/Users/egeng/delta-site/evals/os-console/safety-language.json"
likely_files:
  - "docs/AGENT_EVALS.md"
  - "evals/os-console/"
  - "scripts/agent-eval.mjs"
out_of_scope:
  - "external LLM API calls"
  - "live mic, TTS, notifications"
  - "Supabase mutations"
---

Current eval fixtures validate structure only. A later phase should define
deterministic behavior checks that remain local and side-effect-free.
