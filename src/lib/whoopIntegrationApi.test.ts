import {
  disconnectWhoopConnection,
  getWhoopConnectionStatus,
  startWhoopConnection,
  syncWhoopConnection,
} from "./whoopIntegrationApi";

describe("WHOOP integration API", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("uses the Delta bearer token without logging it", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue(
      {
        ok: true,
        json: async () => ({
          authorization_url: "https://whoop.example/authorize",
          scopes: ["offline", "read:recovery"],
          state_expires_in_seconds: 600,
        }),
      } as Response,
    );

    const result = await startWhoopConnection("private-delta-token");

    expect(result?.authorization_url).toBe("https://whoop.example/authorize");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/integrations/whoop/connect"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer private-delta-token",
        }),
      }),
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-delta-token");
  });

  it("returns null for malformed or unavailable status payloads", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response);

    await expect(getWhoopConnectionStatus("token")).resolves.toBeNull();
    await expect(getWhoopConnectionStatus("token")).resolves.toBeNull();
  });

  it("refreshes normalized WHOOP data without accepting raw storage", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "completed",
        synced_at: "2026-08-03T12:00:00Z",
        counts: { recoveries: 1 },
        raw_provider_payloads_stored: false,
      }),
    } as Response);

    await expect(syncWhoopConnection("token")).resolves.toMatchObject({
      status: "completed",
      raw_provider_payloads_stored: false,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/integrations/whoop/sync"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("disconnects with explicit history deletion intent", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "disconnected",
        provider_access_revoked: true,
        credentials_deleted: true,
        history_deleted: true,
      }),
    } as Response);

    await expect(disconnectWhoopConnection("token", true)).resolves.toMatchObject({
      status: "disconnected",
      history_deleted: true,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/integrations/whoop/disconnect"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ delete_history: true }),
      }),
    );
  });
});
