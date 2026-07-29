"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export default function OAuthConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authorizationId = searchParams.get("authorization_id");
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState(
    authorizationId ? "" : "The authorization request is missing or invalid.",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authorizationId) {
      return;
    }
    const load = async () => {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const redirect = `/oauth/consent?authorization_id=${encodeURIComponent(
          authorizationId,
        )}`;
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      const result =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (result.error || !result.data) {
        setError("This authorization request is unavailable or expired.");
        return;
      }
      if (result.data.redirect_url) {
        window.location.assign(result.data.redirect_url);
        return;
      }
      setDetails(result.data);
    };
    load().catch(() => {
      setError("This authorization request could not be loaded.");
    });
  }, [authorizationId, router]);

  const decide = async (approve: boolean) => {
    if (!authorizationId) {
      return;
    }
    setSubmitting(true);
    setError("");
    const operation = approve
      ? getSupabase().auth.oauth.approveAuthorization
      : getSupabase().auth.oauth.denyAuthorization;
    const result = await operation.call(
      getSupabase().auth.oauth,
      authorizationId,
      { skipBrowserRedirect: true },
    );
    if (result.error || !result.data?.redirect_url) {
      setError("Delta could not complete this authorization decision.");
      setSubmitting(false);
      return;
    }
    window.location.assign(result.data.redirect_url);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-medium text-primary">Delta authorization</p>
        <h1 className="mt-3 text-3xl font-semibold">Allow access?</h1>

        {error && (
          <p className="mt-6 border border-red-500/30 p-4 text-sm text-red-500">
            {error}
          </p>
        )}

        {!error && !details && (
          <p className="mt-6 text-sm text-muted">
            Checking the authorization request...
          </p>
        )}

        {details && (
          <>
            <section className="mt-8 border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">{details.client.name}</h2>
              <p className="mt-3 text-sm text-muted">
                This app is requesting permission to identify your Delta
                account and access the protected Delta MCP resource.
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="font-medium">Signed in as</dt>
                  <dd className="text-muted">{details.user.email}</dd>
                </div>
                <div>
                  <dt className="font-medium">Requested scopes</dt>
                  <dd className="text-muted">{details.scope}</dd>
                </div>
              </dl>
            </section>

            <p className="mt-5 text-sm text-muted">
              The WHOOP tools are read-only. They do not expose provider
              tokens, raw WHOOP responses, or another user&apos;s data.
            </p>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => decide(true)}
                disabled={submitting}
                className="bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                Allow
              </button>
              <button
                type="button"
                onClick={() => decide(false)}
                disabled={submitting}
                className="border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Deny
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
