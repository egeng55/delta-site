/** @jest-environment node */

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns a stable revision and deployment response shape", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "ok",
      service: "delta-site",
      revision: {
        repository: "egeng55/delta-site",
        commit: expect.any(String),
        branch: expect.any(String),
        source: expect.stringMatching(/^(vercel|git|unknown)$/),
      },
      deployment: {
        platform: expect.stringMatching(/^(vercel|local|unknown)$/),
        environment: expect.any(String),
        url: payload.deployment.url,
      },
    });
    expect(
      payload.deployment.url === null || typeof payload.deployment.url === "string",
    ).toBe(true);
  });
});
