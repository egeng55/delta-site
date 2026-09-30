# Historian feed reconciliation

Extracted the uncommitted Historian website changes into an isolated branch
from current site main. The original working copy remains unchanged.

The owner-gated History endpoint can read existing local Historian comparisons
and projections. Missing stores fall back to an explicitly labelled bundled
archive. An explicitly configured missing store does not silently select a
different workspace. Missing live provenance or interpretation cannot inherit
claims from the bundled archive.

The bundled exporter reads committed agent main and selects only eligible
comparison and timeline artifact types. Its regenerated archive contains 15
milestones, with the December 2025 Stats Social App as the origin. The latest
eligible comparison committed on assessed agent main is August 7-12, 2026;
these are historical numbers, not a new September census.

The feed supplies chapter membership, origin content, census comparison and
bounded evidence references to the existing History UI. It does not create
milestones, mutate architecture, schedule refreshes, or publish deployments.
Local-store reading does not establish canonical Git membership of those
artifacts; the bundled export is pinned to committed main. Configure
DELTA_AGENT_ROOT explicitly when selecting a specific local store.

Verification uses the existing Jest suites, lint and a production webpack
build with a loopback API URL. Live browser appearance and hosted refresh are
not qualified by these checks.
