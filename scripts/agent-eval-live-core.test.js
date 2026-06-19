/* eslint-disable @typescript-eslint/no-require-imports */
const {
  DEFAULT_EXPECTED_DOMAIN,
  EXPECTED_LATE_CAFFEINE_FEEDBACK,
  parseArgs,
  runLiveEval,
} = require("./agent-eval-live-core.cjs");

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

function registryPayload(overrides = {}) {
  return {
    domains: [
      {
        domain_id: DEFAULT_EXPECTED_DOMAIN,
        name: "Late Caffeine",
        description: "Metadata for late caffeine behavior.",
        lifecycle_stage: "proof_backed",
        privacy_level: "high",
        event_types: ["caffeine_intake"],
        state_fields: ["cooldown", "tone"],
        prediction_types: ["sleep_risk"],
        intervention_types: ["timing_guidance"],
        feedback_capabilities: EXPECTED_LATE_CAFFEINE_FEEDBACK,
        storage_policy: "read-only metadata",
        readiness_requirements: ["domain metadata is registered"],
        eval_requirements: ["deterministic metadata checks"],
        proof_requirements: ["late caffeine proof report exists"],
        notes: ["First proof-backed Behavioral OS domain."],
        introspection_mode: "read_only_metadata",
      },
    ],
    domain_count: 1,
    introspection_mode: "read_only_metadata",
    user_state_included: false,
    side_effects: {
      supabase: false,
      memory_writes: false,
      notifications: false,
      tts: false,
      live_mic: false,
    },
    ...overrides,
  };
}

describe("agent live eval core", () => {
  it("parses expected-domain and live eval flags", () => {
    expect(parseArgs([
      "--backend-url",
      "http://localhost:9000",
      "--expected-domain",
      "focus_routine",
      "--json",
      "--require-live",
    ], {})).toEqual({
      backendUrl: "http://localhost:9000",
      expectedDomain: "focus_routine",
      json: true,
      requireLive: true,
    });
  });

  it("skips cleanly when the backend is unavailable by default", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: false },
      {
        env: {},
        fetchImpl: jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
      },
    );

    expect(result.status).toBe("skipped");
    expect(result.classification).toBe("backend_unavailable");
  });

  it("reports protected/no-token separately from backend unavailability", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: false },
      {
        env: {},
        fetchImpl: jest.fn().mockResolvedValue(response(401, {})),
      },
    );

    expect(result.status).toBe("skipped");
    expect(result.classification).toBe("protected_token_missing");
    expect(result.tokenProvided).toBe(false);
  });

  it("does not include token values in unauthorized JSON output", async () => {
    const token = "secret-token-value";
    const fetchImpl = jest.fn().mockResolvedValue(response(401, {}));
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: true },
      {
        env: { DELTA_LIVE_EVAL_BEARER_TOKEN: token },
        fetchImpl,
      },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:8000/behavioral-os/domains",
      expect.objectContaining({
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(result.status).toBe("failed");
    expect(result.classification).toBe("token_unauthorized");
    expect(result.tokenProvided).toBe(true);
    expect(JSON.stringify(result)).not.toContain(token);
  });

  it("fails malformed domain metadata payloads", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: true },
      {
        env: {},
        fetchImpl: jest.fn().mockResolvedValue(response(200, { domains: "late_caffeine" })),
      },
    );

    expect(result.status).toBe("failed");
    expect(result.classification).toBe("malformed_payload");
  });

  it("passes successful normalized late caffeine metadata", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: true },
      {
        env: {},
        fetchImpl: jest.fn().mockResolvedValue(response(200, registryPayload())),
      },
    );

    expect(result.status).toBe("passed");
    expect(result.classification).toBe("live_domain_metadata_passed");
    expect(result.assertions).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "registry_payload_normalized", passed: true }),
      expect.objectContaining({ name: "expected_domain_registered", passed: true }),
      expect.objectContaining({ name: "late_caffeine_expected_feedback_capabilities", passed: true }),
      expect.objectContaining({ name: "metadata_only_no_user_state", passed: true }),
      expect.objectContaining({ name: "metadata_only_no_supabase_side_effect", passed: true }),
    ]));
  });
});
