"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ACCESS_REQUEST_PAGE_SIZE,
  isAccessRequestStatus,
  type AccessRequestListRecord,
  type AccessRequestStatus,
} from "@/lib/accessRequests";
import { requestJson } from "@/lib/requestJson";

interface PageResult {
  requests: AccessRequestListRecord[];
  nextOffset: number | null;
  windowLimited: boolean;
}
function parsePage(data: unknown): PageResult {
  if (!data || typeof data !== "object") throw new Error("invalid_page");
  const page = data as PageResult;
  if (
    typeof page.windowLimited !== "boolean" ||
    !Array.isArray(page.requests) ||
    page.requests.length > ACCESS_REQUEST_PAGE_SIZE ||
    !(
      page.nextOffset === null ||
      (Number.isSafeInteger(page.nextOffset) &&
        page.nextOffset >= 0 &&
        page.nextOffset <= 10000)
    )
  )
    throw new Error("invalid_page");
  for (const row of page.requests) {
    if (
      !row ||
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      typeof row.email !== "string" ||
      !(row.reason === null || typeof row.reason === "string") ||
      !isAccessRequestStatus(row.status)
    )
      throw new Error("invalid_page");
  }
  return page;
}

export default function AccessRequestsPage() {
  const { session, user, isLoading } = useAuth();
  const accessToken = session?.access_token;
  const [offset, setOffset] = useState(0);
  const [generation, setGeneration] = useState(0);
  const key = `${accessToken}:${offset}:${generation}`;
  const [page, setPage] = useState<{
    key: string;
    result: PageResult | null;
    error: string;
  } | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const actionLock = useRef(false);
  const loading = Boolean(accessToken) && page?.key !== key;
  const result = page?.key === key ? page.result : null;
  const requests = result?.requests ?? [];
  const error = actionError || (page?.key === key ? page.error : "");

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    void requestJson(`/api/access-requests?offset=${offset}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("request_failed");
        const result = parsePage(response.data);
        if (!controller.signal.aborted) setPage({ key, result, error: "" });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setPage({
            key,
            result: null,
            error: "Could not load access requests. Try reloading this page.",
          });
      });
    return () => controller.abort();
  }, [accessToken, offset, key]);

  async function mutate(id: string, status?: AccessRequestStatus) {
    if (!accessToken || actionLock.current || loading) return;
    actionLock.current = true;
    setBusyId(id);
    setActionError("");
    try {
      const response = await requestJson(
        `/api/access-requests/${id}${status ? "" : "/invite"}`,
        {
          method: status ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(status ? { "Content-Type": "application/json" } : {}),
          },
          ...(status ? { body: JSON.stringify({ status }) } : {}),
        },
      );
      if (!response.ok) throw new Error("action_failed");
      setGeneration((value) => value + 1);
    } catch {
      setActionError(
        "Could not confirm the action. Reload and check the current state before trying again.",
      );
    } finally {
      actionLock.current = false;
      setBusyId(null);
    }
  }
  const updateStatus = (id: string, status: AccessRequestStatus) =>
    mutate(id, status);
  const sendInvitation = (id: string) => mutate(id);

  if (isLoading) {
    return (
      <main className="p-8 text-sm text-muted">Loading access review…</main>
    );
  }

  if (!user || (user.role !== "developer" && user.role !== "admin")) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Owner authorization required</h1>
        <Link
          href="/account"
          className="mt-6 inline-block text-primary hover:underline"
        >
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
          <h1 className="mt-2 text-3xl font-semibold">
            Private-preview access requests
          </h1>
        </div>
        <Link
          href="/account"
          className="text-sm text-muted hover:text-foreground"
        >
          Account
        </Link>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Review requests deliberately. Approval does not create an account;
        sending an invitation is a separate owner action.
      </p>

      {error && (
        <div className="mt-6">
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
          <button
            type="button"
            disabled={loading || busyId !== null}
            className="mt-3 border px-3 py-2"
            onClick={() => {
              setActionError("");
              setGeneration((value) => value + 1);
            }}
          >
            Reload requests
          </button>
        </div>
      )}

      {result?.windowLimited && (
        <p role="status" className="mt-6 text-sm text-muted">
          More requests exist beyond this review window. Older requests are not
          included.
        </p>
      )}
      <div className="mt-8 border-t border-border">
        {loading ? (
          <p role="status" className="py-8">
            Loading access requests...
          </p>
        ) : !result ? null : requests.length === 0 ? (
          <p className="py-8 text-sm text-muted">No access requests.</p>
        ) : (
          requests.map((accessRequest) => (
            <article
              key={accessRequest.id}
              className="border-b border-border py-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{accessRequest.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {accessRequest.email}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                    {accessRequest.reason || "No optional note provided."}
                  </p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {accessRequest.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(accessRequest.status === "submitted" ||
                  accessRequest.status === "declined") && (
                  <button
                    type="button"
                    disabled={busyId !== null || loading}
                    onClick={() => updateStatus(accessRequest.id, "reviewing")}
                    className="border border-border px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Start review
                  </button>
                )}
                {accessRequest.status === "reviewing" && (
                  <button
                    type="button"
                    disabled={busyId !== null || loading}
                    onClick={() => updateStatus(accessRequest.id, "approved")}
                    className="bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {accessRequest.status === "approved" && (
                  <button
                    type="button"
                    disabled={busyId !== null || loading}
                    onClick={() => sendInvitation(accessRequest.id)}
                    className="bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
                  >
                    Send invitation
                  </button>
                )}
                {accessRequest.status !== "declined" &&
                  accessRequest.status !== "invited" && (
                    <button
                      type="button"
                      disabled={busyId !== null || loading}
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
      {result && (
        <nav
          aria-label="Access request pages"
          className="mt-6 flex items-center gap-4"
        >
          <button
            type="button"
            className="border px-3 py-2 disabled:opacity-50"
            disabled={loading || busyId !== null || offset === 0}
            onClick={() => {
              setActionError("");
              setOffset((value) =>
                Math.max(0, value - ACCESS_REQUEST_PAGE_SIZE),
              );
            }}
          >
            Previous
          </button>
          <span>Page {Math.floor(offset / ACCESS_REQUEST_PAGE_SIZE) + 1}</span>
          <button
            type="button"
            className="border px-3 py-2 disabled:opacity-50"
            disabled={loading || busyId !== null || result.nextOffset === null}
            onClick={() => {
              if (result.nextOffset !== null) {
                setActionError("");
                setOffset(result.nextOffset);
              }
            }}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
