import { DELTA_API_URL, fetchWithRetry } from "@/lib/api";

export interface WhoopConnectionStatus {
  connected: boolean;
  status:
    | "not_connected"
    | "active"
    | "reauthorization_required"
    | "revoked"
    | "error";
  scopes?: string[];
  token_expires_at?: string;
  last_synced_at?: string | null;
}

export interface WhoopConnectResponse {
  authorization_url: string;
  scopes: string[];
  state_expires_in_seconds: number;
}

export interface WhoopSyncResponse {
  status: "completed";
  synced_at: string;
  counts: Record<string, number>;
  raw_provider_payloads_stored: false;
}

export interface WhoopDisconnectResponse {
  status: "disconnected";
  provider_access_revoked: boolean;
  credentials_deleted: boolean;
  history_deleted: boolean;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function getWhoopConnectionStatus(
  accessToken: string,
): Promise<WhoopConnectionStatus | null> {
  try {
    const response = await fetchWithRetry(
      `${DELTA_API_URL}/integrations/whoop/status`,
      { headers: authHeaders(accessToken) },
      0,
      10_000,
    );
    if (!response.ok) {
      return null;
    }
    const payload: unknown = await response.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof (payload as Record<string, unknown>).connected !== "boolean" ||
      typeof (payload as Record<string, unknown>).status !== "string"
    ) {
      return null;
    }
    return payload as WhoopConnectionStatus;
  } catch {
    return null;
  }
}

export async function startWhoopConnection(
  accessToken: string,
): Promise<WhoopConnectResponse | null> {
  try {
    const response = await fetchWithRetry(
      `${DELTA_API_URL}/integrations/whoop/connect`,
      {
        method: "POST",
        headers: authHeaders(accessToken),
      },
      0,
      10_000,
    );
    if (!response.ok) {
      return null;
    }
    const payload: unknown = await response.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof (payload as Record<string, unknown>).authorization_url !== "string"
    ) {
      return null;
    }
    return payload as WhoopConnectResponse;
  } catch {
    return null;
  }
}

export async function syncWhoopConnection(
  accessToken: string,
): Promise<WhoopSyncResponse | null> {
  try {
    const response = await fetchWithRetry(
      `${DELTA_API_URL}/integrations/whoop/sync`,
      {
        method: "POST",
        headers: authHeaders(accessToken),
      },
      0,
      30_000,
    );
    if (!response.ok) {
      return null;
    }
    const payload: unknown = await response.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      (payload as Record<string, unknown>).status !== "completed" ||
      typeof (payload as Record<string, unknown>).synced_at !== "string" ||
      (payload as Record<string, unknown>).raw_provider_payloads_stored !== false
    ) {
      return null;
    }
    return payload as WhoopSyncResponse;
  } catch {
    return null;
  }
}

export async function disconnectWhoopConnection(
  accessToken: string,
  deleteHistory: boolean,
): Promise<WhoopDisconnectResponse | null> {
  try {
    const response = await fetchWithRetry(
      `${DELTA_API_URL}/integrations/whoop/disconnect`,
      {
        method: "POST",
        headers: authHeaders(accessToken),
        body: JSON.stringify({ delete_history: deleteHistory }),
      },
      0,
      20_000,
    );
    if (!response.ok) {
      return null;
    }
    const payload: unknown = await response.json();
    if (
      !payload ||
      typeof payload !== "object" ||
      (payload as Record<string, unknown>).status !== "disconnected" ||
      typeof (payload as Record<string, unknown>).provider_access_revoked !==
        "boolean" ||
      typeof (payload as Record<string, unknown>).credentials_deleted !==
        "boolean" ||
      typeof (payload as Record<string, unknown>).history_deleted !== "boolean"
    ) {
      return null;
    }
    return payload as WhoopDisconnectResponse;
  } catch {
    return null;
  }
}
