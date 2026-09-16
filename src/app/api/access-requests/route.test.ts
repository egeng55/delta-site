/** @jest-environment node */
import { POST, GET } from "./route";
import {
  createAccessAdminClient,
  authorizeAccessOwner,
} from "@/lib/accessRequestServer";
jest.mock("@/lib/accessRequestServer", () => ({
  createAccessAdminClient: jest.fn(),
  authorizeAccessOwner: jest.fn(),
}));

let sequence = 0;
function post(email = "fixture@example.test", ip = String(++sequence)) {
  return new Request("http://localhost/api/access-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ name: "Fixture", email, reason: "" }),
  }) as unknown as Parameters<typeof POST>[0];
}
function storage(
  options: { rows?: object[]; lookupError?: object; insertError?: object } = {},
) {
  const seen = new Set();
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: null, error: options.lookupError ?? null }),
    then: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data: options.rows ?? [], error: null }).then(resolve),
  };
  const client = {
    from: jest.fn().mockReturnValue({
      ...query,
      insert: jest.fn((row: { email: string }) => {
        const error =
          options.insertError ??
          (seen.has(row.email) ? { code: "23505" } : null);
        if (!error) seen.add(row.email);
        return { abortSignal: jest.fn().mockResolvedValue({ error }) };
      }),
    }),
  };
  return { client, query, seen };
}
afterEach(() => jest.restoreAllMocks());

it("coalesces simultaneous same-email insert races through the existing unique constraint", async () => {
  const { client, seen } = storage();
  jest.mocked(createAccessAdminClient).mockReturnValue(client as never);
  const results = await Promise.all(
    Array.from({ length: 30 }, () => POST(post())),
  );
  expect(results.every((result) => result.status === 202)).toBe(true);
  expect(seen.size).toBe(1);
  for (const response of results)
    expect(await response.json()).toEqual({ accepted: true });
});
it("rate-limits concurrent requests before database access", async () => {
  const { client } = storage();
  jest
    .mocked(createAccessAdminClient)
    .mockClear()
    .mockReturnValue(client as never);
  const results = await Promise.all(
    Array.from({ length: 25 }, () =>
      POST(post("fixture@example.test", "same-client")),
    ),
  );
  expect(results.filter((result) => result.status === 202)).toHaveLength(5);
  expect(results.filter((result) => result.status === 429)).toHaveLength(20);
  expect(createAccessAdminClient).toHaveBeenCalledTimes(5);
  expect(
    results.find((result) => result.status === 429)?.headers.get("Retry-After"),
  ).toBeTruthy();
});
it("rejects oversized access submissions before storage", async () => {
  jest.mocked(createAccessAdminClient).mockClear();
  const req = new Request("http://localhost/api/access-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": String(++sequence),
    },
    body: "x".repeat(8193),
  });
  expect((await POST(req as never)).status).toBe(413);
  expect(createAccessAdminClient).not.toHaveBeenCalled();
});
it("logs fixed codes only and returns no database detail", async () => {
  const { client } = storage({
    lookupError: {
      message: "private database details",
      email: "private@example.test",
    },
  });
  jest.mocked(createAccessAdminClient).mockReturnValue(client as never);
  const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
  const response = await POST(post());
  expect(response.status).toBe(503);
  expect(JSON.stringify([await response.json(), log.mock.calls])).not.toMatch(
    /private database|private@example/,
  );
});
it("paginates in deterministic order, selects only review fields, and forbids shared caching", async () => {
  const { client, query } = storage({
    rows: Array.from({ length: 51 }, (_, id) => ({ id })),
  });
  jest
    .mocked(authorizeAccessOwner)
    .mockResolvedValue({ ok: true, client, user: { id: "owner" } } as never);
  const response = await GET(
    new Request("http://localhost/api/access-requests?offset=50") as never,
  );
  const payload = await response.json();
  expect(payload.requests).toHaveLength(50);
  expect(payload.nextOffset).toBe(100);
  expect(payload.windowLimited).toBe(false);
  expect(query.range).toHaveBeenCalledWith(50, 100);
  expect(query.order.mock.calls).toEqual([
    ["submitted_at", { ascending: false }],
    ["id", { ascending: false }],
  ]);
  expect(query.select).toHaveBeenCalledWith(
    "id,email,name,reason,status,submitted_at",
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("discloses a truncated review window instead of claiming the list is complete", async () => {
  const { client } = storage({
    rows: Array.from({ length: 51 }, (_, id) => ({ id })),
  });
  jest
    .mocked(authorizeAccessOwner)
    .mockResolvedValue({ ok: true, client, user: { id: "owner" } } as never);
  const response = await GET(
    new Request("http://localhost/api/access-requests?offset=10000") as never,
  );
  expect(await response.json()).toMatchObject({
    nextOffset: null,
    windowLimited: true,
  });
});
it("rejects invalid pagination and unauthenticated readers without queries", async () => {
  const { client } = storage();
  jest
    .mocked(authorizeAccessOwner)
    .mockResolvedValue({
      ok: false,
      status: 401,
      error: "Authentication required.",
    });
  expect(
    (await GET(new Request("http://localhost/api/access-requests") as never))
      .status,
  ).toBe(401);
  expect(client.from).not.toHaveBeenCalled();
  jest
    .mocked(authorizeAccessOwner)
    .mockResolvedValue({ ok: true, client, user: { id: "owner" } } as never);
  for (const offset of ["-1", "1.2", "Infinity", "10001"])
    expect(
      (
        await GET(
          new Request(
            `http://localhost/api/access-requests?offset=${offset}`,
          ) as never,
        )
      ).status,
    ).toBe(400);
  expect(client.from).not.toHaveBeenCalled();
});
