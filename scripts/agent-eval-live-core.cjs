const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";
const DEFAULT_EXPECTED_DOMAIN = "late_caffeine";
const DOMAIN_PATH = "/behavioral-os/domains";
const LIVE_EVAL_REPORT_SUFFIX = "live-domain-eval";
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
const EXPECTED_LATE_CAFFEINE_EVENT_TYPES = [
  "substance.caffeine_intake",
];
const EXPECTED_LATE_CAFFEINE_FEEDBACK_SIGNALS = [
  "explicit_helpful",
  "explicit_not_helpful",
  "explicit_dismissed",
  "explicit_snoozed",
];
const COVERAGE_AREAS = [
  "domain_metadata",
  "event_taxonomy_metadata",
  "feedback_policy_metadata",
  "capability_matrix_metadata",
];

function parseArgs(argv, env = process.env) {
  const args = {
    backendUrl: env.NEXT_PUBLIC_DELTA_API_URL || DEFAULT_BACKEND_URL,
    expectedDomain: DEFAULT_EXPECTED_DOMAIN,
    force: false,
    json: false,
    requireLive: false,
    write: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
    } else if (arg === "--write") {
      args.write = true;
    } else if (arg === "--force") {
      args.force = true;
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

function timestampForFilename(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
}

function liveEvalReportFilename(date = new Date()) {
  return `${timestampForFilename(date)}-${LIVE_EVAL_REPORT_SUFFIX}.md`;
}

function liveEvalReportPath(runsDir, date = new Date()) {
  return `${String(runsDir).replace(/\/+$/, "")}/${liveEvalReportFilename(date)}`;
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

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function optionalStringArrayField(record, key) {
  if (!hasOwn(record, key)) {
    return { present: false, valid: true, value: [] };
  }
  if (!Array.isArray(record[key])) {
    return { present: true, valid: false, value: [] };
  }
  return { present: true, valid: true, value: stringArray(record[key]) };
}

function optionalBooleanField(record, key) {
  if (!hasOwn(record, key)) {
    return { present: false, valid: true, value: null };
  }
  if (typeof record[key] !== "boolean") {
    return { present: true, valid: false, value: null };
  }
  return { present: true, valid: true, value: record[key] };
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
    optional_metadata: {
      supported_event_categories: optionalStringArrayField(raw, "supported_event_categories"),
      supported_event_types: optionalStringArrayField(raw, "supported_event_types"),
      event_sources: optionalStringArrayField(raw, "event_sources"),
      event_sensitivity_levels: optionalStringArrayField(raw, "event_sensitivity_levels"),
      supported_feedback_signals: optionalStringArrayField(raw, "supported_feedback_signals"),
      feedback_sources: optionalStringArrayField(raw, "feedback_sources"),
      feedback_learning_modes: optionalStringArrayField(raw, "feedback_learning_modes"),
      feedback_sensitivity_levels: optionalStringArrayField(raw, "feedback_sensitivity_levels"),
      intervention_feedback_supported: optionalBooleanField(raw, "intervention_feedback_supported"),
      feedback_policy_ready: optionalBooleanField(raw, "feedback_policy_ready"),
      safe_for_metadata_introspection: optionalBooleanField(raw, "safe_for_metadata_introspection"),
      requires_user_state: optionalBooleanField(raw, "requires_user_state"),
      requires_external_provider: optionalBooleanField(raw, "requires_external_provider"),
    },
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

function coverageWith(status, reason) {
  return Object.fromEntries(
    COVERAGE_AREAS.map((area) => [area, { status, reason }]),
  );
}

function nextRecommendedCommand(result) {
  if (result.status === "passed") {
    return "Record the result in the phase report and continue with normal verification.";
  }
  if (result.classification === "backend_unavailable") {
    return "Start the local backend, then rerun npm run agent:eval:live -- --backend-url http://127.0.0.1:8000.";
  }
  if (result.classification === "protected_token_missing") {
    return "Provide DELTA_LIVE_EVAL_BEARER_TOKEN only when intentionally running an authenticated local check.";
  }
  if (result.classification === "token_unauthorized") {
    return "Refresh the local bearer token without printing it, then rerun with --require-live.";
  }
  if (result.classification === "malformed_payload" || result.classification === "assertion_failure") {
    return "Review backend domain metadata contracts and site normalization before relying on the live result.";
  }
  return "Review the live eval output and rerun after resolving the reported condition.";
}

function renderLiveEvalReport(result, date = new Date()) {
  const timestamp = date.toISOString();
  const lines = [
    "# Live Domain Eval Result",
    "",
    `Timestamp: ${timestamp}`,
    "",
    "## Summary",
    "",
    `- Backend URL: \`${result.endpoint}\``,
    `- Expected domain: \`${result.expectedDomain}\``,
    `- Status: \`${result.status}\``,
    `- Classification: \`${result.classification}\``,
    `- Reason: ${result.reason}`,
    `- Token present: \`${result.tokenProvided ? "yes" : "no"}\``,
    "- Token value stored: `false`",
    "- Request headers stored: `false`",
    "- Sensitive payload stored: `false`",
  ];

  if (typeof result.httpStatus === "number") {
    lines.push(`- HTTP status: \`${result.httpStatus}\``);
  }
  if (typeof result.domainCount === "number") {
    lines.push(`- Domain count: \`${result.domainCount}\``);
  }

  lines.push("", "## Coverage", "");
  if (result.coverage) {
    for (const area of COVERAGE_AREAS) {
      const item = result.coverage[area] || { status: "unknown", reason: "not reported" };
      lines.push(`- ${area}: \`${item.status}\` - ${item.reason}`);
    }
  } else {
    lines.push("- Coverage summary was not reported.");
  }

  lines.push("", "## Assertions", "");
  if (result.assertions.length === 0) {
    lines.push("- No assertions were checked because the live endpoint was unavailable or protected.");
  } else {
    for (const assertion of result.assertions) {
      lines.push(`- ${assertion.passed ? "pass" : "fail"} \`${assertion.name}\`: ${assertion.detail}`);
    }
  }

  if (result.failures?.length) {
    lines.push("", "## Failures", "");
    for (const failure of result.failures) {
      lines.push(`- ${failure}`);
    }
  }

  lines.push(
    "",
    "## Side Effects",
    "",
    `- Services started: \`${result.sideEffects.startsServices ? "yes" : "no"}\``,
    `- LLM calls: \`${result.sideEffects.callsLlms ? "yes" : "no"}\``,
    `- Browser automation: \`${result.sideEffects.browserAutomation ? "yes" : "no"}\``,
    `- File mutations outside this report: \`${result.sideEffects.mutatesFiles ? "yes" : "no"}\``,
    `- Supabase mutation: \`${result.sideEffects.mutatesSupabase ? "yes" : "no"}\``,
    `- Mic: \`${result.sideEffects.mic ? "yes" : "no"}\``,
    `- TTS: \`${result.sideEffects.tts ? "yes" : "no"}\``,
    `- Notifications: \`${result.sideEffects.notifications ? "yes" : "no"}\``,
    `- Memory writes: \`${result.sideEffects.memoryWrites ? "yes" : "no"}\``,
    "",
    "## Next Recommended Command",
    "",
    "```bash",
    nextRecommendedCommand(result),
    "```",
    "",
    "## Notes",
    "",
    "- This report is local evidence only; it is not a CI gate.",
    "- Live evals remain optional and are not part of default deterministic evals.",
    "- Token values, request headers, and sensitive response payloads are intentionally omitted.",
  );

  return `${lines.join("\n")}\n`;
}

function assertDomainMetadata(payload, expectedDomain = DEFAULT_EXPECTED_DOMAIN) {
  const assertions = [];
  const failures = [];
  const coverage = {
    domain_metadata: { status: "passed", reason: "core domain metadata assertions passed" },
    event_taxonomy_metadata: { status: "not_exposed", reason: "event taxonomy fields were not exposed" },
    feedback_policy_metadata: { status: "not_exposed", reason: "feedback policy fields were not exposed" },
    capability_matrix_metadata: { status: "not_exposed", reason: "capability matrix fields were not exposed" },
  };

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
    recordEventTaxonomyMetadata(expected, expectedDomain, record, coverage);
    recordFeedbackPolicyMetadata(expected, expectedDomain, record, coverage);
    recordCapabilityMatrixMetadata(expected, record, coverage);
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

  if (failures.length > 0) {
    coverage.domain_metadata = {
      status: "failed",
      reason: "one or more live domain metadata assertions failed",
    };
  }

  return { assertions, failures, coverage };
}

function recordEventTaxonomyMetadata(domain, expectedDomain, record, coverage) {
  const optional = domain.optional_metadata;
  const eventTypeSource = optional.supported_event_types.present
    ? optional.supported_event_types
    : { present: domain.event_types.length > 0, valid: true, value: domain.event_types };
  const categorySource = optional.supported_event_categories;

  if (!eventTypeSource.present && !categorySource.present) {
    return;
  }

  if (!eventTypeSource.valid || !categorySource.valid) {
    coverage.event_taxonomy_metadata = {
      status: "failed",
      reason: "optional event taxonomy metadata was present but malformed",
    };
    record(
      "event_taxonomy_optional_shape",
      false,
      `supported_event_types_valid=${eventTypeSource.valid}; supported_event_categories_valid=${categorySource.valid}`,
    );
    return;
  }

  record(
    "event_taxonomy_event_types_array",
    Array.isArray(eventTypeSource.value),
    `event_type_count=${eventTypeSource.value.length}`,
  );

  if (expectedDomain === DEFAULT_EXPECTED_DOMAIN) {
    const missing = EXPECTED_LATE_CAFFEINE_EVENT_TYPES.filter(
      (eventType) => !eventTypeSource.value.includes(eventType),
    );
    record(
      "late_caffeine_expected_event_types",
      missing.length === 0,
      missing.length === 0 ? "late caffeine event types present" : `missing=${missing.join(",")}`,
    );
  }

  coverage.event_taxonomy_metadata = {
    status: "passed",
    reason: optional.supported_event_types.present
      ? "explicit event taxonomy metadata fields validated"
      : "event taxonomy validated through domain event_types",
  };
}

function recordFeedbackPolicyMetadata(domain, expectedDomain, record, coverage) {
  const optional = domain.optional_metadata;
  const fields = [
    optional.supported_feedback_signals,
    optional.feedback_sources,
    optional.feedback_learning_modes,
    optional.feedback_sensitivity_levels,
  ];
  const present = fields.some((field) => field.present) || optional.intervention_feedback_supported.present || optional.feedback_policy_ready.present;
  if (!present) return;

  const malformed = fields.some((field) => field.present && !field.valid)
    || (optional.intervention_feedback_supported.present && !optional.intervention_feedback_supported.valid)
    || (optional.feedback_policy_ready.present && !optional.feedback_policy_ready.valid);
  if (malformed) {
    coverage.feedback_policy_metadata = {
      status: "failed",
      reason: "optional feedback policy metadata was present but malformed",
    };
    record(
      "feedback_policy_optional_shape",
      false,
      "feedback policy arrays must be arrays and support flags must be booleans when present",
    );
    return;
  }

  record(
    "feedback_policy_signals_array",
    optional.supported_feedback_signals.present,
    optional.supported_feedback_signals.present
      ? `signal_count=${optional.supported_feedback_signals.value.length}`
      : "supported_feedback_signals not exposed",
  );

  if (expectedDomain === DEFAULT_EXPECTED_DOMAIN && optional.supported_feedback_signals.present) {
    const missing = EXPECTED_LATE_CAFFEINE_FEEDBACK_SIGNALS.filter(
      (signal) => !optional.supported_feedback_signals.value.includes(signal),
    );
    record(
      "late_caffeine_expected_feedback_policy_signals",
      missing.length === 0,
      missing.length === 0 ? "late caffeine feedback policy signals present" : `missing=${missing.join(",")}`,
    );
  }

  if (optional.intervention_feedback_supported.present) {
    record(
      "feedback_policy_intervention_support_boolean",
      optional.intervention_feedback_supported.valid,
      `intervention_feedback_supported=${optional.intervention_feedback_supported.value}`,
    );
  }

  coverage.feedback_policy_metadata = {
    status: "passed",
    reason: "optional feedback policy metadata fields validated",
  };
}

function recordCapabilityMatrixMetadata(domain, record, coverage) {
  const optional = domain.optional_metadata;
  const fields = [
    optional.safe_for_metadata_introspection,
    optional.requires_user_state,
    optional.requires_external_provider,
  ];
  const present = fields.some((field) => field.present);
  if (!present) return;

  const malformed = fields.some((field) => field.present && !field.valid);
  if (malformed) {
    coverage.capability_matrix_metadata = {
      status: "failed",
      reason: "optional capability matrix metadata was present but malformed",
    };
    record(
      "capability_matrix_optional_shape",
      false,
      "capability matrix requirement/safety fields must be booleans when present",
    );
    return;
  }

  if (optional.safe_for_metadata_introspection.present) {
    record(
      "capability_matrix_metadata_introspection_safe",
      optional.safe_for_metadata_introspection.value === true,
      `safe_for_metadata_introspection=${optional.safe_for_metadata_introspection.value}`,
    );
  }
  if (optional.requires_user_state.present) {
    record(
      "capability_matrix_requires_user_state_boolean",
      typeof optional.requires_user_state.value === "boolean",
      `requires_user_state=${optional.requires_user_state.value}`,
    );
  }
  if (optional.requires_external_provider.present) {
    record(
      "capability_matrix_requires_external_provider_boolean",
      typeof optional.requires_external_provider.value === "boolean",
      `requires_external_provider=${optional.requires_external_provider.value}`,
    );
  }

  coverage.capability_matrix_metadata = {
    status: "passed",
    reason: "optional capability matrix metadata fields validated",
  };
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
    coverage: coverageWith("skipped", "live endpoint was unavailable or protected before assertions"),
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
      {
        ...context,
        httpStatus: response.status,
        coverage: coverageWith("failed", "domain metadata payload could not be normalized"),
      },
    );
  }

  const { assertions, failures, coverage } = assertDomainMetadata(payload, expectedDomain);
  if (failures.length > 0) {
    return failedResult("assertion_failure", "Live domain metadata assertions failed.", assertions, {
      ...context,
      httpStatus: response.status,
      failures,
      coverage,
    });
  }

  return passedResult(assertions, {
    ...context,
    httpStatus: response.status,
    domainCount: payload.domain_count,
    coverage,
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
  if (result.coverage) {
    console.log("");
    console.log("Coverage:");
    for (const area of COVERAGE_AREAS) {
      const item = result.coverage[area] || { status: "unknown", reason: "not reported" };
      console.log(`- ${area}: ${item.status} (${item.reason})`);
    }
  }
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
  COVERAGE_AREAS,
  EXPECTED_LATE_CAFFEINE_EVENT_TYPES,
  EXPECTED_LATE_CAFFEINE_FEEDBACK,
  EXPECTED_LATE_CAFFEINE_FEEDBACK_SIGNALS,
  LIVE_EVAL_REPORT_SUFFIX,
  assertDomainMetadata,
  endpointUrl,
  liveEvalReportFilename,
  liveEvalReportPath,
  normalizeDomainMetadata,
  normalizeDomainRegistryResponse,
  parseArgs,
  printText,
  renderLiveEvalReport,
  runLiveEval,
  sanitizeMessage,
  timestampForFilename,
};
