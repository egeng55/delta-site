"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getWhoopConnectionStatus,
  startWhoopConnection,
  type WhoopConnectionStatus,
} from "@/lib/whoopIntegrationApi";

export default function WhoopIntegrationPage() {
  const { session, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<WhoopConnectionStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!session?.access_token) {
      return;
    }
    getWhoopConnectionStatus(session.access_token).then((result) => {
      setStatus(result);
      setChecking(false);
    });
  }, [authLoading, session?.access_token]);

  const connect = async () => {
    if (!session?.access_token) {
      return;
    }
    setConnecting(true);
    setMessage("");
    const result = await startWhoopConnection(session.access_token);
    if (!result) {
      setMessage(
        "WHOOP linking is unavailable. Check the backend and storage configuration.",
      );
      setConnecting(false);
      return;
    }
    window.location.assign(result.authorization_url);
  };

  if (authLoading || (session && checking)) {
    return (
      <main className="min-h-screen bg-background px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-muted">Checking WHOOP connection...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold">Connect WHOOP</h1>
          <p className="mt-4 text-muted">
            Sign in to Delta before linking a WHOOP account.
          </p>
          <Link
            href="/login?redirect=/integrations/whoop"
            className="mt-6 inline-flex bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const connected = status?.connected === true;
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-medium text-primary">Delta integration</p>
        <h1 className="mt-3 text-3xl font-semibold">WHOOP for ChatGPT</h1>
        <p className="mt-4 max-w-xl text-muted">
          Link WHOOP to Delta so an authorized ChatGPT custom app can read your
          normalized recovery, sleep, cycle, workout, and HRV history.
        </p>

        <section className="mt-8 border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Connection</h2>
              <p className="mt-1 text-sm text-muted">
                {connected
                  ? "WHOOP is connected to this Delta account."
                  : status?.status === "reauthorization_required"
                    ? "WHOOP needs to be authorized again."
                    : "WHOOP is not connected yet."}
              </p>
            </div>
            <span className="text-sm font-medium">
              {connected ? "Connected" : "Not connected"}
            </span>
          </div>

          {status?.last_synced_at && (
            <p className="mt-4 text-sm text-muted">
              Last synced: {new Date(status.last_synced_at).toLocaleString()}
            </p>
          )}

          {!connected && (
            <button
              type="button"
              onClick={connect}
              disabled={connecting}
              className="mt-6 bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {connecting ? "Opening WHOOP..." : "Connect WHOOP"}
            </button>
          )}

          {message && (
            <p className="mt-4 text-sm text-red-500" role="alert">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 border-t border-border pt-6 text-sm text-muted">
          <p>
            This connection is read-only. Delta stores provider credentials
            encrypted, and ChatGPT does not receive WHOOP tokens or raw
            provider responses.
          </p>
          <Link href="/privacy" className="mt-3 inline-block text-primary">
            Read the privacy policy
          </Link>
        </section>
      </div>
    </main>
  );
}
