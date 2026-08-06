"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  disconnectWhoopConnection,
  getWhoopConnectionStatus,
  startWhoopConnection,
  syncWhoopConnection,
  type WhoopConnectionStatus,
} from "@/lib/whoopIntegrationApi";

export default function WhoopIntegrationPage() {
  const { session, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<WhoopConnectionStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");

  const checkStatus = async (accessToken: string) => {
    setChecking(true);
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
  }, [authLoading, session?.access_token]);

  const connect = async () => {
    if (!session?.access_token) {
      return;
    }
    setConnecting(true);
    setMessage("");
    const result = await startWhoopConnection(session.access_token);
    if (!result) {
      setMessageKind("error");
      setMessage(
        "WHOOP linking is unavailable. Check the backend and storage configuration.",
      );
      setConnecting(false);
      return;
    }
    window.location.assign(result.authorization_url);
  };

  const refresh = async () => {
    if (!session?.access_token) {
      return;
    }
    setRefreshing(true);
    setMessage("");
    const result = await syncWhoopConnection(session.access_token);
    if (!result) {
      setMessageKind("error");
      setMessage("WHOOP could not be refreshed. Your existing data was not changed.");
      setRefreshing(false);
      return;
    }
    await checkStatus(session.access_token);
    setMessageKind("success");
    setMessage("WHOOP data refreshed.");
    setRefreshing(false);
  };

  const disconnect = async () => {
    if (!session?.access_token) {
      return;
    }
    setDisconnecting(true);
    setMessage("");
    const result = await disconnectWhoopConnection(
      session.access_token,
      deleteHistory,
    );
    if (!result) {
      setMessageKind("error");
      setMessage(
        "WHOOP could not be disconnected. Retry, or revoke Delta from WHOOP.",
      );
      setDisconnecting(false);
      return;
    }
    setStatus({ connected: false, status: "not_connected" });
    setConfirmingDisconnect(false);
    setDeleteHistory(false);
    setMessageKind("success");
    setMessage(
      result.history_deleted
        ? "WHOOP disconnected. Stored WHOOP history was deleted."
        : "WHOOP disconnected. Encrypted credentials were deleted; normalized history was retained.",
    );
    setDisconnecting(false);
  };

  if ((!session && authLoading) || (session && checking)) {
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
  const hasStoredConnection = status?.status !== "not_connected" && status !== null;
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
                {status === null
                  ? "Connection status is unavailable in this environment."
                  : connected
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

          {status === null && (
            <button
              type="button"
              onClick={() => checkStatus(session.access_token)}
              disabled={checking}
              className="mt-6 border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {checking ? "Checking..." : "Retry status"}
            </button>
          )}

          {status !== null && !connected && (
            <button
              type="button"
              onClick={connect}
              disabled={connecting}
              className="mt-6 bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {connecting ? "Opening WHOOP..." : "Connect WHOOP"}
            </button>
          )}

          {hasStoredConnection && (
            <div className="mt-6 flex flex-wrap gap-3">
              {connected && (
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing || disconnecting}
                  className="bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
                >
                  {refreshing ? "Refreshing..." : "Refresh now"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmingDisconnect(true)}
                disabled={refreshing || disconnecting}
                className="border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Disconnect WHOOP
              </button>
            </div>
          )}

          {hasStoredConnection && confirmingDisconnect && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Confirm disconnection</h3>
              <p className="mt-2 text-sm text-muted">
                Delta will revoke WHOOP access and delete the encrypted access
                and refresh tokens stored for this account.
              </p>
              <label className="mt-4 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={deleteHistory}
                  onChange={(event) => setDeleteHistory(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  Also permanently delete normalized WHOOP recovery, sleep,
                  cycle, workout, and sync history stored by Delta.
                </span>
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={disconnect}
                  disabled={disconnecting}
                  className="bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {disconnecting
                    ? "Disconnecting..."
                    : deleteHistory
                      ? "Delete history and disconnect"
                      : "Confirm disconnect"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDisconnect(false);
                    setDeleteHistory(false);
                  }}
                  disabled={disconnecting}
                  className="border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-sm ${
                messageKind === "error" ? "text-red-500" : "text-muted"
              }`}
              role={messageKind === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 border-t border-border pt-6 text-sm text-muted">
          <p>
            This connection is read-only. Delta encrypts provider credentials,
            stores normalized WHOOP records, and does not persist raw provider
            responses. ChatGPT never receives WHOOP tokens.
          </p>
          <Link href="/privacy" className="mt-3 inline-block text-primary">
            Read the privacy policy
          </Link>
        </section>
      </div>
    </main>
  );
}
