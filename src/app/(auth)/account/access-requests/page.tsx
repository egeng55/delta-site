"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { AccessRequestRecord, AccessRequestStatus } from "@/lib/accessRequests";

async function fetchAccessRequests(accessToken: string): Promise<AccessRequestRecord[]> {
  const response = await fetch("/api/access-requests", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Could not load access requests.");
  }

  return payload.requests;
}

export default function AccessRequestsPage() {
  const { session, user, isLoading } = useAuth();
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const accessToken = session?.access_token;

  async function loadRequests(token: string) {
    try {
      const nextRequests = await fetchAccessRequests(token);
      setError("");
      setRequests(nextRequests);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not connect to access review.");
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    let active = true;

    void fetchAccessRequests(accessToken)
      .then(nextRequests => {
        if (!active) return;
        setError("");
        setRequests(nextRequests);
      })
      .catch(requestError => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Could not connect to access review.");
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  async function updateStatus(id: string, status: AccessRequestStatus) {
    if (!session?.access_token) return;
    setBusyId(id);
    setError("");

    try {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) setError(payload.error || "Could not update request.");
      await loadRequests(session.access_token);
    } catch {
      setError("Could not connect to access review.");
    } finally {
      setBusyId(null);
    }
  }

  async function sendInvitation(id: string) {
    if (!session?.access_token) return;
    setBusyId(id);
    setError("");

    try {
      const response = await fetch(`/api/access-requests/${id}/invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await response.json();
      if (!response.ok) setError(payload.error || "Could not send invitation.");
      await loadRequests(session.access_token);
    } catch {
      setError("Could not connect to access review.");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-sm text-muted">Loading access review…</main>;
  }

  if (!user || (user.role !== "developer" && user.role !== "admin")) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Owner authorization required</h1>
        <Link href="/account" className="mt-6 inline-block text-primary hover:underline">
          Return to account
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Owner review</p>
          <h1 className="mt-2 text-3xl font-semibold">Private-preview access requests</h1>
        </div>
        <Link href="/account" className="text-sm text-muted hover:text-foreground">
          Account
        </Link>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Review requests deliberately. Approval does not create an account; sending
        an invitation is a separate owner action.
      </p>

      {error && <p role="alert" className="mt-6 text-sm text-red-500">{error}</p>}

      <div className="mt-8 border-t border-border">
        {requests.length === 0 ? (
          <p className="py-8 text-sm text-muted">No access requests.</p>
        ) : (
          requests.map(accessRequest => (
            <article key={accessRequest.id} className="border-b border-border py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{accessRequest.name}</h2>
                  <p className="mt-1 text-sm text-muted">{accessRequest.email}</p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                    {accessRequest.reason || "No optional note provided."}
                  </p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {accessRequest.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(accessRequest.status === "submitted" || accessRequest.status === "declined") && (
                  <button
                    type="button"
                    disabled={busyId === accessRequest.id}
                    onClick={() => updateStatus(accessRequest.id, "reviewing")}
                    className="border border-border px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Start review
                  </button>
                )}
                {accessRequest.status === "reviewing" && (
                  <button
                    type="button"
                    disabled={busyId === accessRequest.id}
                    onClick={() => updateStatus(accessRequest.id, "approved")}
                    className="bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {accessRequest.status === "approved" && (
                  <button
                    type="button"
                    disabled={busyId === accessRequest.id}
                    onClick={() => sendInvitation(accessRequest.id)}
                    className="bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
                  >
                    Send invitation
                  </button>
                )}
                {accessRequest.status !== "declined" && accessRequest.status !== "invited" && (
                  <button
                    type="button"
                    disabled={busyId === accessRequest.id}
                    onClick={() => updateStatus(accessRequest.id, "declined")}
                    className="border border-border px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Decline
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
