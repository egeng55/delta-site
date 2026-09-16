import { NextRequest, NextResponse } from "next/server";
import {
  createAccessAdminClient,
  authorizeAccessOwner,
} from "@/lib/accessRequestServer";
import {
  parseAccessRequestInput,
  ACCESS_REQUEST_PAGE_SIZE,
} from "@/lib/accessRequests";
import {
  createRequestLimiter,
  readLimitedJson,
  RequestInputError,
} from "@/lib/requestSafety";

const limitRequest = createRequestLimiter(5, 15 * 60 * 1000);
const noStore = { "Cache-Control": "private, no-store" };
const REQUEST_TIMEOUT_MS = 10000;

function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    status,
    headers: { ...noStore, ...headers },
  });
}

export async function POST(request: NextRequest) {
  const ip = (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  ).slice(0, 128);
  const retryAfter = limitRequest(ip);
  if (retryAfter)
    return json({ error: "Too many requests. Please try again later." }, 429, {
      "Retry-After": String(retryAfter),
    });

  let body: unknown;
  try {
    body = await readLimitedJson(request, 8192);
  } catch (error) {
    return json(
      { error: "Invalid or oversized request." },
      error instanceof RequestInputError ? error.status : 400,
    );
  }
  const parsed = parseAccessRequestInput(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  if (parsed.value.company) return json({ accepted: true }, 202);

  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  try {
    const client = createAccessAdminClient();
    const { data: existing, error: lookupError } = await client
      .from("access_requests")
      .select("id,status")
      .eq("email", parsed.value.email)
      .abortSignal(signal)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) {
      const { error } = await client
        .from("access_requests")
        .insert({
          email: parsed.value.email,
          name: parsed.value.name,
          reason: parsed.value.reason,
          source: "delta-site/signup",
          privacy_notice_version: "2026-08-06",
        })
        .abortSignal(signal);
      // The existing database email uniqueness constraint arbitrates cross-instance races.
      if (error && error.code !== "23505") throw error;
    } else if (existing.status === "declined") {
      const { error } = await client
        .from("access_requests")
        .update({
          name: parsed.value.name,
          reason: parsed.value.reason,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq("id", existing.id)
        .eq("status", "declined")
        .abortSignal(signal);
      if (error) throw error;
    }
    return json({ accepted: true }, 202);
  } catch {
    console.error(
      JSON.stringify({ event: "access_request_storage_failed", status: 503 }),
    );
    return json({ error: "Access requests are temporarily unavailable." }, 503);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeAccessOwner(request);
    if (!authorization.ok)
      return json({ error: authorization.error }, authorization.status);
    const offsetText = new URL(request.url).searchParams.get("offset") ?? "0";
    if (!/^(0|[1-9]\d*)$/.test(offsetText) || Number(offsetText) > 10000)
      return json({ error: "Invalid page." }, 400);
    const offset = Number(offsetText);
    const { data, error } = await authorization.client
      .from("access_requests")
      .select("id,email,name,reason,status,submitted_at")
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + ACCESS_REQUEST_PAGE_SIZE)
      .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS));
    if (error || !data) throw new Error("list_unavailable");
    const windowLimited =
      data.length > ACCESS_REQUEST_PAGE_SIZE &&
      offset + ACCESS_REQUEST_PAGE_SIZE > 10000;
    const hasMore = data.length > ACCESS_REQUEST_PAGE_SIZE && !windowLimited;
    return json({
      requests: data.slice(0, ACCESS_REQUEST_PAGE_SIZE),
      nextOffset: hasMore ? offset + ACCESS_REQUEST_PAGE_SIZE : null,
      windowLimited,
    });
  } catch {
    console.error(
      JSON.stringify({ event: "access_request_list_failed", status: 503 }),
    );
    return json({ error: "Could not load access requests." }, 503);
  }
}
