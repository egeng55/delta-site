import {
  getWhoopConnectionStatus,
  startWhoopConnection,
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
});
