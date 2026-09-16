/** @jest-environment node */
import { createClient } from "@supabase/supabase-js";
import {
  authorizeAccessOwner,
  createAccessAdminClient,
} from "./accessRequestServer";

jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));
const originalFetch = global.fetch;
const originalEnvironment = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnvironment,
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.invalid",
    SUPABASE_SECRET_KEY: "test-only-placeholder",
    DELTA_ACCESS_OWNER_EMAILS: "owner@example.test",
  };
});
afterEach(() => {
  process.env = originalEnvironment;
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

it("adds a ten-second transport deadline, preserves caller cancellation, and disables caching", async () => {
  const timeout = jest.spyOn(AbortSignal, "timeout");
  global.fetch = jest.fn().mockResolvedValue(new Response("{}"));
  createAccessAdminClient();
  const options = jest.mocked(createClient).mock.calls.at(-1)?.[2];
  const controller = new AbortController();
  await options!.global!.fetch!("https://fixture.invalid", {
    signal: controller.signal,
  });
  expect(timeout).toHaveBeenCalledWith(10000);
  const init = jest.mocked(global.fetch).mock.calls[0][1]!;
  expect(init.cache).toBe("no-store");
  expect(init.signal?.aborted).toBe(false);
  controller.abort();
  expect(init.signal?.aborted).toBe(true);
  expect(options!.auth).toMatchObject({
    autoRefreshToken: false,
    persistSession: false,
  });
});

it("sanitizes an authentication transport failure", async () => {
  jest
    .mocked(createClient)
    .mockReturnValue({
      auth: {
        getUser: jest
          .fn()
          .mockRejectedValue(new Error("private-token-and-provider-detail")),
      },
    } as never);
  const result = await authorizeAccessOwner(
    new Request("http://localhost", {
      headers: { Authorization: "Bearer fixture" },
    }),
  );
  expect(result).toEqual({
    ok: false,
    status: 503,
    error: "Access review is temporarily unavailable.",
  });
  expect(JSON.stringify(result)).not.toContain("private-token");
});

it("keeps missing authentication and non-owner accounts denied", async () => {
  const getUser = jest
    .fn()
    .mockResolvedValue({
      data: { user: { id: "fixture", email: "not-owner@example.test" } },
      error: null,
    });
  jest.mocked(createClient).mockReturnValue({ auth: { getUser } } as never);
  expect(
    await authorizeAccessOwner(new Request("http://localhost")),
  ).toMatchObject({ ok: false, status: 401 });
  expect(getUser).not.toHaveBeenCalled();
  expect(
    await authorizeAccessOwner(
      new Request("http://localhost", {
        headers: { Authorization: "Bearer fixture" },
      }),
    ),
  ).toMatchObject({ ok: false, status: 403 });
});

it("preserves the configured owner's access", async () => {
  jest
    .mocked(createClient)
    .mockReturnValue({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({
            data: { user: { id: "fixture", email: "owner@example.test" } },
            error: null,
          }),
      },
    } as never);
  expect(
    await authorizeAccessOwner(
      new Request("http://localhost", {
        headers: { Authorization: "Bearer fixture" },
      }),
    ),
  ).toMatchObject({ ok: true, user: { id: "fixture" } });
});
