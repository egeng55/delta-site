import { DELTA_API_URL, fetchWithRetry } from "./api";
import {
  normalizeDomainRegistryResponse,
  type DomainMetadata,
  type DomainRegistryResponse,
} from "./domainMetadataTypes";

export type BehavioralDomainMetadata = DomainMetadata;
export type BehavioralDomainRegistryResponse = DomainRegistryResponse;

export async function getBehavioralDomains(): Promise<BehavioralDomainRegistryResponse> {
  const response = await fetchWithRetry(`${DELTA_API_URL}/behavioral-os/domains`, {}, 0, 10000);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error("Domain metadata is unavailable in this environment.");
  }
  const normalized = normalizeDomainRegistryResponse(payload);
  if (!normalized) {
    throw new Error("Domain metadata response was malformed.");
  }

  return normalized;
}
