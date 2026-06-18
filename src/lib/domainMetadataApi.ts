import { DELTA_API_URL, fetchWithRetry } from "./api";

export type BehavioralDomainMetadata = {
  domain_id: string;
  name: string;
  description: string;
  lifecycle_stage: string;
  privacy_level: string;
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

export type BehavioralDomainRegistryResponse = {
  domains: BehavioralDomainMetadata[];
  domain_count: number;
  introspection_mode: string;
  user_state_included: boolean;
  side_effects: {
    supabase: boolean;
    memory_writes: boolean;
    notifications: boolean;
    tts: boolean;
    live_mic: boolean;
  };
};

function isDomainMetadata(value: unknown): value is BehavioralDomainMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.domain_id === "string" &&
    typeof record.name === "string" &&
    typeof record.lifecycle_stage === "string" &&
    typeof record.privacy_level === "string" &&
    Array.isArray(record.feedback_capabilities)
  );
}

function isDomainRegistryResponse(value: unknown): value is BehavioralDomainRegistryResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.domains) && record.domains.every(isDomainMetadata);
}

export async function getBehavioralDomains(): Promise<BehavioralDomainRegistryResponse> {
  const response = await fetchWithRetry(`${DELTA_API_URL}/behavioral-os/domains`, {}, 0, 10000);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error("Domain metadata is unavailable in this environment.");
  }
  if (!isDomainRegistryResponse(payload)) {
    throw new Error("Domain metadata response was malformed.");
  }

  return payload;
}
