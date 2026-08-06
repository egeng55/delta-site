import { NextRequest, NextResponse } from "next/server";
import { createAccessAdminClient, authorizeAccessOwner } from "@/lib/accessRequestServer";
import { parseAccessRequestInput } from "@/lib/accessRequests";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(ip);

  if (!current || current.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) return true;
  current.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseAccessRequestInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Honeypot submissions receive the same response without creating a record.
  if (parsed.value.company) {
    return NextResponse.json({ accepted: true }, { status: 202 });
  }

  try {
    const client = createAccessAdminClient();
    const { data: existing, error: lookupError } = await client
      .from("access_requests")
      .select("id,status")
      .eq("email", parsed.value.email)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!existing) {
      const { error } = await client.from("access_requests").insert({
        email: parsed.value.email,
        name: parsed.value.name,
        reason: parsed.value.reason,
        source: "delta-site/signup",
        privacy_notice_version: "2026-08-06",
      });
      if (error) throw error;
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
        .eq("status", "declined");
      if (error) throw error;
    }

    // The generic response prevents request or account enumeration.
    return NextResponse.json({ accepted: true }, { status: 202 });
  } catch (error) {
    console.error("Access request storage failed:", error);
    return NextResponse.json(
      { error: "Access requests are temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest) {
  const authorization = await authorizeAccessOwner(request);
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const { data, error } = await authorization.client
    .from("access_requests")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Access request review list failed:", error);
    return NextResponse.json({ error: "Could not load access requests." }, { status: 500 });
  }

  return NextResponse.json({ requests: data });
}
