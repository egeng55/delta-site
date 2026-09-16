"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getWhoopConnectionStatus,
  syncWhoopConnection,
  type WhoopConnectionStatus,
} from "@/lib/whoopIntegrationApi";

const whoopTools = [
  ["whoop_get_daily_summary", "Daily recovery, sleep, cycle, and workout context"],
  ["whoop_get_recovery", "Recovery and HRV records"],
  ["whoop_get_sleep", "Sleep records and stage summaries"],
  ["whoop_get_workouts", "Workout records and strain summaries"],
  ["whoop_get_cycles", "Physiological cycle records"],
  ["whoop_get_hrv_trends", "Compact HRV trend windows"],
  ["whoop_search_history", "Structured search across normalized history"],
] as const;

function freshnessLabel(lastSyncedAt?: string | null): string {
  if (!lastSyncedAt) {
    return "No completed sync recorded";
  }
  const ageMs = Date.now() - new Date(lastSyncedAt).getTime();
  if (!Number.isFinite(ageMs)) {
    return "Sync time unavailable";
  }
  if (ageMs < 15 * 60 * 1000) {
    return "Fresh within 15 minutes";
  }
  if (ageMs < 60 * 60 * 1000) {
    return "Updated within the last hour";
  }
  return `Last updated ${new Date(lastSyncedAt).toLocaleString()}`;
}

export default function CommandPage() {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<WhoopConnectionStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const refreshInFlight = useRef(false);

  const loadStatus = async (accessToken: string) => {
    const result = await getWhoopConnectionStatus(accessToken);
    setStatus(result);
    setChecking(false);
    return result;
  };

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }
    let cancelled = false;
    getWhoopConnectionStatus(session.access_token).then((result) => {
      if (!cancelled) {
        setStatus(result);
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const refreshWhoop = async () => {
    if (!session?.access_token || refreshInFlight.current) {
      return;
    }
    refreshInFlight.current = true;
    setRefreshing(true);
    setMessage("");
    try {
      const result = await syncWhoopConnection(session.access_token);
      if (!result) {
        setMessage("Refresh failed. Existing normalized data remains available.");
        return;
      }
      await loadStatus(session.access_token);
      setMessage("WHOOP data refreshed for future ChatGPT requests.");
    } catch {
      setMessage("Refresh could not be confirmed. Check connector status before retrying.");
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  };

  const connected = status?.connected === true;

  return (
    <>
      <Navigation />
      <main className="min-h-screen px-6 pb-20 pt-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-primary">Private control surface</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Command</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Current connector state, model-facing capabilities, approval boundaries,
            and evidence. This page does not read microphone input, run background
            agents, or perform provider writes.
          </p>

          <section className="mt-10 grid border-y border-border md:grid-cols-3">
            <div className="border-b border-border py-6 md:border-b-0 md:border-r md:pr-6">
              <p className="text-sm text-muted">Signed in as</p>
              <p className="mt-2 break-all font-medium">{user?.email || "Authenticated user"}</p>
            </div>
            <div className="border-b border-border py-6 md:border-b-0 md:border-r md:px-6">
              <p className="text-sm text-muted">WHOOP connector</p>
              <p className="mt-2 font-medium">
                {checking
                  ? "Checking"
                  : status === null
                    ? "Unavailable"
                    : connected
                      ? "Connected"
                      : "Not connected"}
              </p>
            </div>
            <div className="py-6 md:pl-6">
              <p className="text-sm text-muted">Data freshness</p>
              <p className="mt-2 font-medium">
                {checking ? "Checking" : freshnessLabel(status?.last_synced_at)}
              </p>
            </div>
          </section>

          <section className="py-12">
            {!checking && status === null && <p role="alert">Connector status is unavailable. Reload this page to try again.</p>}
            {!checking && status?.connected === false && <p>No connector data yet. Connect WHOOP to begin.</p>}
            <div className="grid gap-8 md:grid-cols-[0.35fr_0.65fr]">
              <div>
                <p className="text-sm font-medium text-primary">Connector</p>
                <h2 className="mt-2 text-2xl font-semibold">WHOOP to ChatGPT</h2>
              </div>
              <div>
                <p className="leading-7 text-muted">
                  ChatGPT reads compact normalized records through Delta. WHOOP
                  credentials and raw provider responses are never returned to the
                  model.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {connected ? (
                    <button
                      type="button"
                      onClick={refreshWhoop}
                      disabled={refreshing}
                      className="bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
                    >
                      {refreshing ? "Refreshing..." : "Refresh WHOOP now"}
                    </button>
                  ) : (
                    <Link
                      href="/integrations/whoop"
                      className="bg-foreground px-4 py-2 text-sm font-medium text-background"
                    >
                      Connect WHOOP
                    </Link>
                  )}
                  <Link
                    href="/integrations/whoop"
                    className="border border-border px-4 py-2 text-sm font-medium"
                  >
                    Manage connection
                  </Link>
                </div>
                {message && (
                  <p className="mt-4 text-sm text-muted" role="status">
                    {message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="border-t border-border py-12">
            <div className="grid gap-8 md:grid-cols-[0.35fr_0.65fr]">
              <div>
                <p className="text-sm font-medium text-primary">Capabilities</p>
                <h2 className="mt-2 text-2xl font-semibold">Available model tools</h2>
              </div>
              <div className="border-t border-border">
                {whoopTools.map(([name, description]) => (
                  <div
                    key={name}
                    className="grid gap-2 border-b border-border py-4 lg:grid-cols-[260px_1fr]"
                  >
                    <code className="break-all text-sm">{name}</code>
                    <p className="text-sm text-muted">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-border py-12">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-primary">Approval boundary</p>
                <h2 className="mt-2 text-2xl font-semibold">No pending provider actions</h2>
                <p className="mt-3 leading-7 text-muted">
                  All current ChatGPT WHOOP tools are read-only. Refresh is an
                  explicit bounded read. Disconnect and history deletion require
                  direct confirmation on the integration page.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Activity evidence</p>
                <h2 className="mt-2 text-2xl font-semibold">Latest known sync</h2>
                <p className="mt-3 leading-7 text-muted">
                  {status?.last_synced_at
                    ? new Date(status.last_synced_at).toLocaleString()
                    : "No completed WHOOP sync is currently visible."}
                </p>
                <p className="mt-2 text-sm text-muted">
                  A cross-provider activity ledger is not implemented yet.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
