/* eslint-disable @typescript-eslint/no-require-imports */
const {
  DEFAULT_EXPECTED_DOMAIN,
  EXPECTED_LATE_CAFFEINE_EVENT_TYPES,
  EXPECTED_LATE_CAFFEINE_FEEDBACK,
  EXPECTED_LATE_CAFFEINE_FEEDBACK_SIGNALS,
  liveEvalReportFilename,
  liveEvalReportPath,
  parseArgs,
  renderLiveEvalReport,
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
        event_types: EXPECTED_LATE_CAFFEINE_EVENT_TYPES,
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
      "--write",
      "--force",
    ], {})).toEqual({
      backendUrl: "http://localhost:9000",
      expectedDomain: "focus_routine",
      force: true,
      json: true,
      requireLive: true,
      write: true,
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

    const report = renderLiveEvalReport(result, new Date("2026-06-19T13:00:00Z"));
    expect(report).toContain("Classification: `token_unauthorized`");
    expect(report).toContain("Token present: `yes`");
    expect(report).toContain("Token value stored: `false`");
    expect(report).not.toContain(token);
    expect(report).not.toContain("Authorization");
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
    expect(result.coverage.domain_metadata.status).toBe("passed");
    expect(result.coverage.event_taxonomy_metadata.status).toBe("passed");
    expect(result.coverage.feedback_policy_metadata.status).toBe("not_exposed");
    expect(result.coverage.capability_matrix_metadata.status).toBe("not_exposed");
    expect(result.assertions).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "registry_payload_normalized", passed: true }),
      expect.objectContaining({ name: "expected_domain_registered", passed: true }),
      expect.objectContaining({ name: "late_caffeine_expected_event_types", passed: true }),
      expect.objectContaining({ name: "late_caffeine_expected_feedback_capabilities", passed: true }),
      expect.objectContaining({ name: "metadata_only_no_user_state", passed: true }),
      expect.objectContaining({ name: "metadata_only_no_supabase_side_effect", passed: true }),
    ]));
  });

  it("validates optional event taxonomy, feedback policy, and capability fields when present", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: true },
      {
        env: {},
        fetchImpl: jest.fn().mockResolvedValue(response(200, registryPayload({
          domains: [
            {
              ...registryPayload().domains[0],
              supported_event_categories: ["substance", "sleep", "feedback"],
              supported_event_types: EXPECTED_LATE_CAFFEINE_EVENT_TYPES,
              event_sources: ["manual_user_report", "derived_inference"],
              event_sensitivity_levels: ["personal", "sensitive_health"],
              supported_feedback_signals: EXPECTED_LATE_CAFFEINE_FEEDBACK_SIGNALS,
              feedback_sources: ["manual_user_feedback", "intervention_response"],
              feedback_learning_modes: ["domain_policy_update", "aggregate_only"],
              feedback_sensitivity_levels: ["personal", "sensitive_inference"],
              intervention_feedback_supported: true,
              feedback_policy_ready: true,
              safe_for_metadata_introspection: true,
              requires_user_state: true,
              requires_external_provider: false,
            },
          ],
        }))),
      },
    );

    expect(result.status).toBe("passed");
    expect(result.coverage.event_taxonomy_metadata.status).toBe("passed");
    expect(result.coverage.feedback_policy_metadata.status).toBe("passed");
    expect(result.coverage.capability_matrix_metadata.status).toBe("passed");
    expect(result.assertions).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "late_caffeine_expected_feedback_policy_signals", passed: true }),
      expect.objectContaining({ name: "feedback_policy_intervention_support_boolean", passed: true }),
      expect.objectContaining({ name: "capability_matrix_metadata_introspection_safe", passed: true }),
      expect.objectContaining({ name: "capability_matrix_requires_user_state_boolean", passed: true }),
      expect.objectContaining({ name: "capability_matrix_requires_external_provider_boolean", passed: true }),
    ]));
  });

  it("treats absent optional feedback policy and capability fields as not exposed, not failed", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: true },
      {
        env: {},
        fetchImpl: jest.fn().mockResolvedValue(response(200, registryPayload())),
      },
    );

    expect(result.status).toBe("passed");
    expect(result.coverage.feedback_policy_metadata).toEqual(expect.objectContaining({ status: "not_exposed" }));
    expect(result.coverage.capability_matrix_metadata).toEqual(expect.objectContaining({ status: "not_exposed" }));
  });

  it("fails when optional event taxonomy metadata is present but malformed", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: true },
      {
        env: {},
        fetchImpl: jest.fn().mockResolvedValue(response(200, registryPayload({
          domains: [
            {
              ...registryPayload().domains[0],
              supported_event_types: "substance.caffeine_intake",
            },
          ],
        }))),
      },
    );

    expect(result.status).toBe("failed");
    expect(result.classification).toBe("assertion_failure");
    expect(result.coverage.event_taxonomy_metadata.status).toBe("failed");
    expect(result.failures.join("\n")).toContain("event_taxonomy_optional_shape");
  });

  it("fails when optional feedback policy metadata is present but malformed", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: true },
      {
        env: {},
        fetchImpl: jest.fn().mockResolvedValue(response(200, registryPayload({
          domains: [
            {
              ...registryPayload().domains[0],
              supported_feedback_signals: "explicit_helpful",
            },
          ],
        }))),
      },
    );

    expect(result.status).toBe("failed");
    expect(result.classification).toBe("assertion_failure");
    expect(result.coverage.feedback_policy_metadata.status).toBe("failed");
    expect(result.failures.join("\n")).toContain("feedback_policy_optional_shape");
  });

  it("generates timestamped live eval report paths", () => {
    const date = new Date("2026-06-19T13:14:15Z");

    expect(liveEvalReportFilename(date)).toBe("2026-06-19T13-14-15Z-live-domain-eval.md");
    expect(liveEvalReportPath("/tmp/agent/runs", date)).toBe(
      "/tmp/agent/runs/2026-06-19T13-14-15Z-live-domain-eval.md",
    );
  });

  it("renders skipped reports with classification and next command", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: false },
      {
        env: {},
        fetchImpl: jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
      },
    );

    const report = renderLiveEvalReport(result, new Date("2026-06-19T13:00:00Z"));

    expect(report).toContain("Timestamp: 2026-06-19T13:00:00.000Z");
    expect(report).toContain("Status: `skipped`");
    expect(report).toContain("Classification: `backend_unavailable`");
    expect(report).toContain("domain_metadata: `skipped`");
    expect(report).toContain("No assertions were checked");
    expect(report).toContain("Start the local backend");
  });

  it("keeps JSON output data parser-clean after report metadata is attached", async () => {
    const result = await runLiveEval(
      { backendUrl: "http://localhost:8000", expectedDomain: DEFAULT_EXPECTED_DOMAIN, requireLive: false },
      {
        env: {},
        fetchImpl: jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
      },
    );
    const withReport = {
      ...result,
      report: {
        written: true,
        path: "agent/runs/2026-06-19T13-14-15Z-live-domain-eval.md",
        absolutePath: "/tmp/agent/runs/2026-06-19T13-14-15Z-live-domain-eval.md",
      },
    };

    expect(JSON.parse(JSON.stringify(withReport))).toEqual(withReport);
  });
});
