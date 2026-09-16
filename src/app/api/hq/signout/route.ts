import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  // Use the served Host, not Next's normalized internal hostname. Do not trust
  // caller-supplied forwarded-host headers as an alternate allowed origin.
  const host = request.headers.get("host") || request.nextUrl.host;
  const expectedOrigin = `${request.nextUrl.protocol}//${host}`;
  if (request.headers.get("origin") !== expectedOrigin)
    return NextResponse.json(
      { error: "origin_rejected" },
      { status: 403, headers },
    );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    return NextResponse.json(
      { error: "auth_unavailable" },
      { status: 503, headers },
    );
  const response = NextResponse.json({ signedOut: true }, { headers });
  try {
    const client = createServerClient(url, key, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: AbortSignal.timeout(5000),
            cache: "no-store",
          }),
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) =>
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    });
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw new Error("signout_failed");
    return response;
  } catch {
    return NextResponse.json(
      { error: "signout_unavailable" },
      { status: 503, headers },
    );
  }
}
