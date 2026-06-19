const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";
const DEFAULT_EXPECTED_DOMAIN = "late_caffeine";
const DOMAIN_PATH = "/behavioral-os/domains";
const EXPECTED_LATE_CAFFEINE_FEEDBACK = [
  "good_call",
  "too_much",
  "not_useful",
  "wrong_timing",
  "remind_earlier",
  "remind_later",
  "misunderstood",
  "suppress_topic",
];

function parseArgs(argv, env = process.env) {
  const args = {
    backendUrl: env.NEXT_PUBLIC_DELTA_API_URL || DEFAULT_BACKEND_URL,
    expectedDomain: DEFAULT_EXPECTED_DOMAIN,
    json: false,
    requireLive: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--require-live") {
      args.requireLive = true;
    } else if (arg === "--backend-url") {
      const value = argv[index + 1];
      if (!value) throw new Error("--backend-url requires a value");
      args.backendUrl = value;
      index += 1;
    } else if (arg === "--expected-domain") {
      const value = argv[index + 1];
      if (!value) throw new Error("--expected-domain requires a value");
      args.expectedDomain = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function booleanValue(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function stringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function normalizeDomainMetadata(raw) {
  if (!isRecord(raw)) return null;
  const domainId = stringValue(raw.domain_id);
  if (!domainId) return null;

  return {
    domain_id: domainId,
    name: stringValue(raw.name, domainId),
    description: stringValue(raw.description),
    lifecycle_stage: stringValue(raw.lifecycle_stage, "unknown"),
    privacy_level: stringValue(raw.privacy_level, "unknown"),
    event_types: stringArray(raw.event_types),
    state_fields: stringArray(raw.state_fields),
    prediction_types: stringArray(raw.prediction_types),
    intervention_types: stringArray(raw.intervention_types),
    feedback_capabilities: stringArray(raw.feedback_capabilities),
    storage_policy: stringValue(raw.storage_policy),
    readiness_requirements: stringArray(raw.readiness_requirements),
    eval_requirements: stringArray(raw.eval_requirements),
    proof_requirements: stringArray(raw.proof_requirements),
    notes: stringArray(raw.notes),
    introspection_mode: stringValue(raw.introspection_mode, "unknown"),
  };
}

function normalizeDomainRegistryResponse(raw) {
  if (!isRecord(raw) || !Array.isArray(raw.domains)) return null;

  const domains = raw.domains
    .map(normalizeDomainMetadata)
    .filter((domain) => Boolean(domain));
  const sideEffects = isRecord(raw.side_effects) ? raw.side_effects : {};
  const domainCount = typeof raw.domain_count === "number" && Number.isFinite(raw.domain_count)
    ? raw.domain_count
    : domains.length;

  return {
    domains,
    domain_count: domainCount,
    introspection_mode: stringValue(raw.introspection_mode, "unknown"),
    user_state_included: booleanValue(raw.user_state_included),
    side_effects: {
      supabase: booleanValue(sideEffects.supabase),
      memory_writes: booleanValue(sideEffects.memory_writes),
      notifications: booleanValue(sideEffects.notifications),
      tts: booleanValue(sideEffects.tts),
      live_mic: booleanValue(sideEffects.live_mic),
    },
  };
}

function endpointUrl(backendUrl) {
  const base = String(backendUrl || DEFAULT_BACKEND_URL).replace(/\/+$/, "");
  return `${base}${DOMAIN_PATH}`;
}

function sanitizeMessage(message, token) {
  if (!token) return message;
  return String(message).split(token).join("[redacted-token]");
}

function baseResult(status, classification, reason, assertions, context = {}) {
  return {
    status,
    classification,
    reason,
    assertions,
    ...context,
  };
}

function skippedResult(classification, reason, context = {}) {
  return baseResult("skipped", classification, reason, [], context);
}

function failedResult(classification, reason, assertions = [], context = {}) {
  return baseResult("failed", classification, reason, assertions, context);
}

function passedResult(assertions, context = {}) {
  return baseResult(
    "passed",
    "live_domain_metadata_passed",
    "Live domain metadata endpoint satisfied read-only assertions.",
    assertions,
    context,
  );
}

function assertDomainMetadata(payload, expectedDomain = DEFAULT_EXPECTED_DOMAIN) {
  const assertions = [];
  const failures = [];

  function record(name, passed, detail) {
    assertions.push({ name, passed, detail });
    if (!passed) failures.push(`${name}: ${detail}`);
  }

  record("registry_payload_normalized", Boolean(payload), "response normalized through the site contract parser");

  const expected = payload.domains.find((domain) => domain.domain_id === expectedDomain);
  record("expected_domain_registered", Boolean(expected), `${expectedDomain} domain should exist`);

  if (expected) {
    record(
      "expected_domain_lifecycle_present",
      Boolean(expected.lifecycle_stage && expected.lifecycle_stage !== "unknown"),
      `lifecycle=${expected.lifecycle_stage || "missing"}`,
    );
    record(
      "expected_domain_privacy_present",
      Boolean(expected.privacy_level && expected.privacy_level !== "unknown"),
      `privacy=${expected.privacy_level || "missing"}`,
    );
    record(
      "expected_domain_feedback_capabilities_present",
      expected.feedback_capabilities.length > 0,
      `feedback_capabilities=${expected.feedback_capabilities.length}`,
    );
    if (expectedDomain === DEFAULT_EXPECTED_DOMAIN) {
      const missing = EXPECTED_LATE_CAFFEINE_FEEDBACK.filter(
        (capability) => !expected.feedback_capabilities.includes(capability),
      );
      record(
        "late_caffeine_expected_feedback_capabilities",
        missing.length === 0,
        missing.length === 0 ? "all expected feedback labels present" : `missing=${missing.join(",")}`,
      );
    }
  }

  record(
    "metadata_only_no_user_state",
    payload.user_state_included === false,
    `user_state_included=${payload.user_state_included}`,
  );
  record(
    "metadata_only_no_supabase_side_effect",
    payload.side_effects.supabase === false,
    `side_effects.supabase=${payload.side_effects.supabase}`,
  );
  record(
    "metadata_only_no_memory_writes",
    payload.side_effects.memory_writes === false,
    `side_effects.memory_writes=${payload.side_effects.memory_writes}`,
  );
  record(
    "metadata_only_no_notifications",
    payload.side_effects.notifications === false,
    `side_effects.notifications=${payload.side_effects.notifications}`,
  );
  record(
    "metadata_only_no_tts",
    payload.side_effects.tts === false,
    `side_effects.tts=${payload.side_effects.tts}`,
  );
  record(
    "metadata_only_no_live_mic",
    payload.side_effects.live_mic === false,
    `side_effects.live_mic=${payload.side_effects.live_mic}`,
  );

  return { assertions, failures };
}

async function fetchDomainMetadata({ backendUrl, token, fetchImpl = fetch }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    return await fetchImpl(endpointUrl(backendUrl), {
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runLiveEval(options, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetchImpl || fetch;
  const token = env.DELTA_LIVE_EVAL_BEARER_TOKEN || "";
  const expectedDomain = options.expectedDomain || DEFAULT_EXPECTED_DOMAIN;
  const context = {
    mode: "local_live_domain_metadata",
    endpoint: endpointUrl(options.backendUrl),
    expectedDomain,
    tokenProvided: Boolean(token),
    requireLive: Boolean(options.requireLive),
    sideEffects: {
      startsServices: false,
      callsLlms: false,
      browserAutomation: false,
      mutatesFiles: false,
      mutatesSupabase: false,
      mic: false,
      tts: false,
      notifications: false,
      memoryWrites: false,
    },
  };

  let response;
  try {
    response = await fetchDomainMetadata({ backendUrl: options.backendUrl, token, fetchImpl });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const reason = `Backend unavailable: ${sanitizeMessage(rawMessage, token)}`;
    return options.requireLive
      ? failedResult("backend_unavailable", reason, [], context)
      : skippedResult("backend_unavailable", reason, context);
  }

  if ((response.status === 401 || response.status === 403) && !token) {
    const reason = "Domain metadata endpoint is protected/unavailable without token; no DELTA_LIVE_EVAL_BEARER_TOKEN was provided.";
    const resultContext = { ...context, httpStatus: response.status };
    return options.requireLive
      ? failedResult("protected_token_missing", reason, [], resultContext)
      : skippedResult("protected_token_missing", reason, resultContext);
  }

  if ((response.status === 401 || response.status === 403) && token) {
    return failedResult("token_unauthorized", `Token was provided but the endpoint returned HTTP ${response.status}.`, [], {
      ...context,
      httpStatus: response.status,
    });
  }

  if (!response.ok) {
    const reason = `Domain metadata endpoint returned HTTP ${response.status}.`;
    const resultContext = { ...context, httpStatus: response.status };
    return options.requireLive
      ? failedResult("http_error", reason, [], resultContext)
      : skippedResult("http_error", reason, resultContext);
  }

  let raw;
  try {
    raw = await response.json();
  } catch (error) {
    return failedResult(
      "non_json_response",
      `Domain metadata endpoint returned non-JSON content: ${sanitizeMessage(error instanceof Error ? error.message : String(error), token)}`,
      [],
      { ...context, httpStatus: response.status },
    );
  }

  const payload = normalizeDomainRegistryResponse(raw);
  if (!payload) {
    return failedResult(
      "malformed_payload",
      "Domain metadata response was malformed.",
      [{ name: "registry_payload_normalized", passed: false, detail: "normalizeDomainRegistryResponse returned null" }],
      { ...context, httpStatus: response.status },
    );
  }

  const { assertions, failures } = assertDomainMetadata(payload, expectedDomain);
  if (failures.length > 0) {
    return failedResult("assertion_failure", "Live domain metadata assertions failed.", assertions, {
      ...context,
      httpStatus: response.status,
      failures,
    });
  }

  return passedResult(assertions, {
    ...context,
    httpStatus: response.status,
    domainCount: payload.domain_count,
  });
}

function printText(result) {
  console.log("Delta optional local live eval");
  console.log("==============================");
  console.log("Mode: local, read-only, opt-in. No services are started and no LLM/browser automation is used.");
  console.log(`Endpoint: ${result.endpoint}`);
  console.log(`Expected domain: ${result.expectedDomain}`);
  console.log(`Token provided: ${result.tokenProvided ? "yes" : "no"}`);
  console.log(`Require live: ${result.requireLive ? "yes" : "no"}`);
  console.log(`Result: ${result.status}`);
  console.log(`Classification: ${result.classification}`);
  console.log(`Reason: ${result.reason}`);
  if (typeof result.httpStatus === "number") console.log(`HTTP status: ${result.httpStatus}`);
  if (typeof result.domainCount === "number") console.log(`Domain count: ${result.domainCount}`);
  if (result.assertions.length > 0) {
    console.log("");
    console.log("Assertions:");
    for (const assertion of result.assertions) {
      console.log(`- ${assertion.passed ? "pass" : "fail"} ${assertion.name}: ${assertion.detail}`);
    }
  }
  if (result.failures?.length) {
    console.log("");
    console.log("Failures:");
    for (const failure of result.failures) console.log(`- ${failure}`);
  }
}

module.exports = {
  DEFAULT_BACKEND_URL,
  DEFAULT_EXPECTED_DOMAIN,
  EXPECTED_LATE_CAFFEINE_FEEDBACK,
  assertDomainMetadata,
  endpointUrl,
  normalizeDomainMetadata,
  normalizeDomainRegistryResponse,
  parseArgs,
  printText,
  runLiveEval,
  sanitizeMessage,
};
