#!/usr/bin/env node

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";
const DOMAIN_PATH = "/behavioral-os/domains";

function parseArgs(argv) {
  const args = {
    backendUrl: process.env.NEXT_PUBLIC_DELTA_API_URL || DEFAULT_BACKEND_URL,
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

function skippedResult(reason, context = {}) {
  return {
    status: "skipped",
    reason,
    assertions: [],
    ...context,
  };
}

function failedResult(reason, assertions = [], context = {}) {
  return {
    status: "failed",
    reason,
    assertions,
    ...context,
  };
}

function passedResult(assertions, context = {}) {
  return {
    status: "passed",
    reason: "Live domain metadata endpoint satisfied read-only assertions.",
    assertions,
    ...context,
  };
}

function assertDomainMetadata(payload) {
  const assertions = [];
  const failures = [];

  function record(name, passed, detail) {
    assertions.push({ name, passed, detail });
    if (!passed) failures.push(`${name}: ${detail}`);
  }

  const lateCaffeine = payload.domains.find((domain) => domain.domain_id === "late_caffeine");
  record("late_caffeine_registered", Boolean(lateCaffeine), "late_caffeine domain should exist");

  if (lateCaffeine) {
    record(
      "late_caffeine_lifecycle_present",
      Boolean(lateCaffeine.lifecycle_stage && lateCaffeine.lifecycle_stage !== "unknown"),
      `lifecycle=${lateCaffeine.lifecycle_stage || "missing"}`,
    );
    record(
      "late_caffeine_privacy_present",
      Boolean(lateCaffeine.privacy_level && lateCaffeine.privacy_level !== "unknown"),
      `privacy=${lateCaffeine.privacy_level || "missing"}`,
    );
    record(
      "late_caffeine_feedback_capabilities_present",
      lateCaffeine.feedback_capabilities.length > 0,
      `feedback_capabilities=${lateCaffeine.feedback_capabilities.length}`,
    );
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

async function fetchDomainMetadata({ backendUrl, token }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    return await fetch(endpointUrl(backendUrl), {
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runLiveEval(options) {
  const token = process.env.DELTA_LIVE_EVAL_BEARER_TOKEN || "";
  const context = {
    mode: "local_live_domain_metadata",
    endpoint: endpointUrl(options.backendUrl),
    tokenProvided: Boolean(token),
    requireLive: options.requireLive,
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
    response = await fetchDomainMetadata({ backendUrl: options.backendUrl, token });
  } catch (error) {
    const reason = `Backend unavailable: ${error instanceof Error ? error.message : String(error)}`;
    return options.requireLive ? failedResult(reason, [], context) : skippedResult(reason, context);
  }

  if (response.status === 401 && !token) {
    const reason = "Domain metadata endpoint is protected/unavailable without token; no DELTA_LIVE_EVAL_BEARER_TOKEN was provided.";
    return options.requireLive ? failedResult(reason, [], { ...context, httpStatus: 401 }) : skippedResult(reason, { ...context, httpStatus: 401 });
  }

  if (!response.ok) {
    const reason = `Domain metadata endpoint returned HTTP ${response.status}.`;
    return options.requireLive ? failedResult(reason, [], { ...context, httpStatus: response.status }) : skippedResult(reason, { ...context, httpStatus: response.status });
  }

  let raw;
  try {
    raw = await response.json();
  } catch (error) {
    return failedResult(
      `Domain metadata endpoint returned non-JSON content: ${error instanceof Error ? error.message : String(error)}`,
      [],
      { ...context, httpStatus: response.status },
    );
  }

  const payload = normalizeDomainRegistryResponse(raw);
  if (!payload) {
    return failedResult(
      "Domain metadata response was malformed.",
      [{ name: "registry_payload_normalized", passed: false, detail: "normalizeDomainRegistryResponse returned null" }],
      { ...context, httpStatus: response.status },
    );
  }

  const { assertions, failures } = assertDomainMetadata(payload);
  if (failures.length > 0) {
    return failedResult("Live domain metadata assertions failed.", assertions, {
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
  console.log(`Token provided: ${result.tokenProvided ? "yes" : "no"}`);
  console.log(`Require live: ${result.requireLive ? "yes" : "no"}`);
  console.log(`Result: ${result.status}`);
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

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error("Usage: npm run agent:eval:live -- [--backend-url <url>] [--json] [--require-live]");
    process.exit(2);
  }

  const result = await runLiveEval(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    printText(result);
  }

  if (result.status === "failed") process.exit(1);
}

await main();
