/** @jest-environment node */

import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));

const originalApiUrl = process.env.NEXT_PUBLIC_DELTA_API_URL;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function chatRequest(
  headers: Record<string, string> = {},
  body: Record<string, unknown> = {
    user_id: "attacker-selected-user",
    message: "hello",
  },
) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("/api/chat proxy", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DELTA_API_URL = "http://127.0.0.1:8000";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-fixture";
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "verified-user", email_confirmed_at: '2026-01-01' } },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockCreateClient.mockReset();
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_DELTA_API_URL;
    else process.env.NEXT_PUBLIC_DELTA_API_URL = originalApiUrl;
    if (originalSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    if (originalAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  });

  it("rejects unauthenticated chat requests before reading the account identity", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    const response = await POST(chatRequest());

    expect(response.status).toBe(401);
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("derives user identity from the bearer token and ignores browser-selected IDs", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ response: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await POST(
      chatRequest({ Authorization: "Bearer test-token" }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/chat",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ user_id: "verified-user", message: "hello" }),
      }),
    );
  });

  it("rejects an invalid session without forwarding the request", async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("private auth detail"),
        }),
      },
    } as unknown as ReturnType<typeof createClient>);
    const fetchSpy = jest.spyOn(global, "fetch");

    const response = await POST(
      chatRequest({ Authorization: "Bearer invalid-token" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(JSON.stringify(payload)).not.toContain("private auth detail");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before dispatch", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const response = await POST(
      chatRequest({
        Authorization: "Bearer fixture",
        "Content-Length": "65537",
      }),
    );
    expect(response.status).toBe(413);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a bounded failure without forwarding upstream error details", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("private upstream detail"));
    const response = await POST(
      chatRequest({ Authorization: "Bearer fixture" }),
    );
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("private upstream detail");
  });
});
