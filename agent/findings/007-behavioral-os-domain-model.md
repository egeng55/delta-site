---
id: "007"
title: "Behavioral OS domain model"
priority: "P1"
status: "open"
repo: "multi"
routine: "backend-architecture-plan"
slug: "behavioral-os-domain-model"
agent_executable: true
security_related: false
recommended_next_phase: "Add a backend domain registry scaffold that describes current Behavioral OS and legacy health-learning domains without changing runtime behavior."
evidence:
  - "/Users/egeng/delta-backend/docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "/Users/egeng/delta-backend/behavioral_os.py"
  - "/Users/egeng/delta-backend/feedback_contract.py"
  - "/Users/egeng/delta-backend/prediction_engine.py"
  - "/Users/egeng/delta-backend/outcome_collector.py"
  - "/Users/egeng/delta-backend/belief_updater.py"
  - "/Users/egeng/delta-backend/causal_discovery.py"
  - "/Users/egeng/delta-backend/uncertainty_tracker.py"
likely_files:
  - "docs/BEHAVIORAL_OS_DOMAIN_MODEL.md"
  - "domains/registry.py"
  - "domains/late_caffeine.py"
  - "domains/health_learning.py"
  - "tests/test_domain_registry.py"
out_of_scope:
  - "new product domains"
  - "runtime routing through a registry"
  - "database schema changes or migrations"
  - "Supabase mutations"
  - "live mic, TTS, notifications, or memory writes"
  - "site or mobile product behavior changes"
---

Delta should become a multi-domain Behavioral OS with health as one domain
family, not the entire product. The backend now has a planning document that
defines the domain contract and maps the legacy health-learning loop and newer
Behavioral OS feedback loop into one architecture.

The next agent-owned step should be a scaffold-only backend phase that exposes
domain metadata for `late_caffeine` and legacy health-learning modules without
changing runtime behavior.

