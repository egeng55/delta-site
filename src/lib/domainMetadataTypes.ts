const LIFECYCLE_LABELS: Record<string, string> = {
  proposed: "Proposed",
  scaffolded: "Scaffolded",
  local_demo: "Local Demo",
  proof_backed: "Proof Backed",
  user_facing_alpha: "User-facing Alpha",
  production_ready: "Production Ready",
  unknown: "Unknown",
};

const PRIVACY_LABELS: Record<string, string> = {
  low: "Low - generic preference or display metadata",
  medium: "Medium - behavior context with retention controls",
  high: "High - sleep, caffeine, and routine behavior",
  critical: "Critical - requires explicit privacy review",
  unknown: "Unknown",
};

const FEEDBACK_LABELS: Record<string, string> = {
  good_call: "good call",
  too_much: "too much",
  not_useful: "not useful",
  wrong_timing: "wrong timing",
  remind_earlier: "remind earlier",
  remind_later: "remind later",
  misunderstood: "misunderstood",
  suppress_topic: "suppress topic",
};

export type DomainLifecycleStage =
  | "proposed"
  | "scaffolded"
  | "local_demo"
  | "proof_backed"
  | "user_facing_alpha"
  | "production_ready"
  | "unknown"
  | (string & {});

export type DomainPrivacyLevel =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "unknown"
  | (string & {});

export type DomainSideEffects = {
  supabase: boolean;
  memory_writes: boolean;
  notifications: boolean;
  tts: boolean;
  live_mic: boolean;
};

export type DomainMetadata = {
  domain_id: string;
  name: string;
  description: string;
  lifecycle_stage: DomainLifecycleStage;
  privacy_level: DomainPrivacyLevel;
  event_types: string[];
  state_fields: string[];
  prediction_types: string[];
  intervention_types: string[];
  feedback_capabilities: string[];
  storage_policy: string;
  readiness_requirements: string[];
  eval_requirements: string[];
  proof_requirements: string[];
  notes: string[];
  introspection_mode: string;
};

export type DomainRegistryResponse = {
  domains: DomainMetadata[];
  domain_count: number;
  introspection_mode: string;
  user_state_included: boolean;
  side_effects: DomainSideEffects;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function nameFromDomainId(domainId: string): string {
  return titleCase(domainId || "unknown domain");
}

export function normalizeDomainMetadata(raw: unknown): DomainMetadata | null {
  if (!isRecord(raw)) return null;

  const domainId = stringValue(raw.domain_id);
  if (!domainId) return null;

  return {
    domain_id: domainId,
    name: stringValue(raw.name, nameFromDomainId(domainId)),
    description: stringValue(raw.description),
    lifecycle_stage: stringValue(raw.lifecycle_stage, "unknown") as DomainLifecycleStage,
    privacy_level: stringValue(raw.privacy_level, "unknown") as DomainPrivacyLevel,
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

export function normalizeDomainRegistryResponse(raw: unknown): DomainRegistryResponse | null {
  if (!isRecord(raw) || !Array.isArray(raw.domains)) return null;

  const domains = raw.domains
    .map(normalizeDomainMetadata)
    .filter((domain): domain is DomainMetadata => Boolean(domain));
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

export function formatDomainLifecycleStage(value: string): string {
  const normalized = stringValue(value, "unknown").toLowerCase();
  return LIFECYCLE_LABELS[normalized] ?? titleCase(normalized);
}

export function formatDomainPrivacyLevel(value: string): string {
  const normalized = stringValue(value, "unknown").toLowerCase();
  return PRIVACY_LABELS[normalized] ?? titleCase(normalized);
}

export function formatFeedbackCapability(value: string): string {
  const normalized = stringValue(value).toLowerCase();
  return FEEDBACK_LABELS[normalized] ?? normalized.replace(/_/g, " ");
}
