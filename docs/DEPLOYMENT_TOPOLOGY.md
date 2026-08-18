# Delta Site Deployment Topology

Last verified: August 18, 2026.

## Canonical location

- Provider: Vercel
- Team: `egeng55's projects` (`team_oaFcSu6azBmCRvDAwXdQU0DD`)
- Project: `delta-site` (`prj_6PkSxsnFP8tGiFdliRC9kw9P13HL`)
- Repository: `egeng55/delta-site`
- Deployment branch: `main`
- Canonical project alias: `https://delta-site-egeng55s-projects.vercel.app`
- Health path: `/api/health`
- Current access state: Vercel Authentication protected

The project alias is Delta's canonical deployment location even while it is
not publicly reachable. A protected response is an access-state result, not
proof that the deployment is absent.

## Custom-domain status

`deltahealthintelligence.com` is intentionally unavailable to Delta. Its
relevant provider production/domain slot is temporarily serving an unrelated
deployment. Do not attach, detach, promote, alias, or otherwise mutate that
domain or the unrelated deployment as part of Delta verification.

Health checks and production-parity audits must use the canonical project
alias above. They must not classify the intentional custom-domain absence as a
Delta outage.

## Revision contract

`GET /api/health` returns this stable additive shape:

```json
{
  "status": "ok",
  "service": "delta-site",
  "revision": {
    "repository": "egeng55/delta-site",
    "commit": "<full commit SHA or unknown>",
    "branch": "<Git branch or unknown>",
    "source": "vercel"
  },
  "deployment": {
    "platform": "vercel",
    "environment": "production",
    "url": "https://<deployment>.vercel.app"
  }
}
```

Vercel runtime metadata takes precedence. Local builds inject the checked-out
Git commit and branch through `next.config.ts`. Only non-secret source and
deployment identifiers are returned.

Deterministic comparison:

```bash
git rev-parse HEAD
curl -sS https://delta-site-egeng55s-projects.vercel.app/api/health
```

The commits match only when the local full SHA exactly equals
`revision.commit`. HTTP reachability by itself does not prove source parity.
