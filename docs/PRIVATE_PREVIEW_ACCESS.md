# Private Preview Access Operations

Delta's public access policy is request-only. The website request form is not an
account-creation form.

## Hosted Supabase enforcement

For project `fhbfaoowwnzzynhbgcms`, disable **Allow new users to sign up** under
Authentication settings. This hosted setting is authoritative; the checked-in
`supabase/config.toml` applies the same policy to local Supabase environments.
Keep existing-user login enabled.

With a Supabase personal access token available locally, run
`npm run access-policy:enforce` to set `disable_signup: true`, then
`npm run access-policy:verify` as a read-only deployment check. Neither token
belongs in browser code or source control.

Do not re-enable public signup to issue access. Use the owner invitation action,
which calls Supabase's server-only `inviteUserByEmail` admin API after a request
has reached `approved`.

## Required server environment

- `SUPABASE_SECRET_KEY`: Supabase secret key used only by Next.js route handlers.
  `SUPABASE_SERVICE_ROLE_KEY` is accepted temporarily for legacy projects.
- `DELTA_ACCESS_OWNER_EMAILS`: comma-separated authenticated owner emails allowed
  to review and invite. This must never use a `NEXT_PUBLIC_` prefix.
- `DELTA_SITE_URL`: canonical site origin used for invitation redirects.

The invitation redirect (`/reset-password`) must be present in Supabase's Auth
redirect allow list. Configure production SMTP before relying on invitation email
delivery.

## Lifecycle

`submitted → reviewing → approved → invited` is the successful path. An owner may
move a submitted or reviewing request to `declined`; a resubmission can return a
declined request to `submitted`. Approval and invitation are intentionally separate.

Every status change creates an `access_request_events` row. The public endpoint
returns a generic accepted response for existing addresses to avoid revealing
whether someone already has a request or account.

## Privacy and deletion

The request ledger stores name, email, an optional note, source, policy version,
review state, timestamps, and reviewer/invited-user identifiers. It does not store
request IP addresses. These records are personal data and should be retained only
while needed for access review, security, or applicable obligations.

No automatic retention period, export workflow, or deletion guarantee is claimed.
Correction and deletion requests continue through the published contact path and
must be reviewed manually, including whether related lifecycle events should be
deleted. Establish a documented retention schedule before a broader launch.
