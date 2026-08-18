# Delta Site Deployment Topology

Last verified: August 18, 2026.

## Public identity

- Canonical public identity URL: `https://deltahealthintelligence.com`
- Current domain-serving state: restoration pending a separate owner-approved
  production action
- Production probe: disabled for the canonical identity URL until restoration

The custom domain remains Delta's canonical public identity. Its current
serving state does not retire, replace, or demote it. Domain restoration and
public-access policy are separate from repository verification.

## Operational deployment

- Provider: Vercel
- Team: `egeng55's projects` (`team_oaFcSu6azBmCRvDAwXdQU0DD`)
- Project: `delta-site` (`prj_6PkSxsnFP8tGiFdliRC9kw9P13HL`)
- Repository: `egeng55/delta-site`
- Deployment branch: `main`
- Operational deployment URL: `https://delta-site-egeng55s-projects.vercel.app`
- Operational probe URL:
  `https://delta-site-egeng55s-projects.vercel.app/api/health`
- Current access mode: Vercel Authentication
- Public reachability: not currently expected
- Expected revision: the exact full SHA of the inspected release candidate

The Vercel alias identifies the deployed application and supplies a stable
read-only probe. It is not Delta's canonical public identity.

## Protection-state interpretation

A `401` from the operational probe means the deployment exists and Vercel
Authentication is enforcing the current protection state. It does not prove
healthy public reachability, source parity, or deployment absence. Parity
remains unverified until the protected deployment returns revision JSON through
an approved verification path.

Do not attach, detach, promote, alias, or otherwise mutate the canonical domain
or any unrelated Vercel project as part of verification.

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
`revision.commit`. HTTP reachability or a protected response by itself does not
prove source parity.
