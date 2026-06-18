/** @jest-environment node */

import { POST } from "./route";

const originalApiUrl = process.env.NEXT_PUBLIC_DELTA_API_URL;

function chatRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      user_id: "user-1",
      message: "hello",
    }),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("/api/chat proxy", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DELTA_API_URL = "http://127.0.0.1:8000";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_DELTA_API_URL;
    } else {
      process.env.NEXT_PUBLIC_DELTA_API_URL = originalApiUrl;
    }
  });

  it("rejects unauthenticated chat proxy requests", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    const response = await POST(chatRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain("Authorization bearer token");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards the Authorization header to the backend chat endpoint", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ response: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await POST(chatRequest({ Authorization: "Bearer test-token" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.response).toBe("ok");
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/chat",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
      }),
    );
  });
});
