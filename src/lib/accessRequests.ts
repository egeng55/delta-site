export const ACCESS_REQUEST_STATUSES = [
  "submitted",
  "reviewing",
  "approved",
  "declined",
  "invited",
] as const;

export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];

export interface AccessRequestRecord {
  id: string;
  email: string;
  name: string;
  reason: string | null;
  status: AccessRequestStatus;
  source: string;
  privacy_notice_version: string;
  submitted_at: string;
  reviewed_at: string | null;
  invited_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidAccessRequestInput {
  email: string;
  name: string;
  reason: string | null;
  company: string;
}

export type AccessRequestValidationResult =
  | { ok: true; value: ValidAccessRequestInput }
  | { ok: false; error: string };

const OWNER_TRANSITIONS: Record<AccessRequestStatus, AccessRequestStatus[]> = {
  submitted: ["reviewing", "declined"],
  reviewing: ["approved", "declined"],
  approved: ["reviewing", "declined"],
  declined: ["reviewing"],
  invited: [],
};

function readString(input: unknown, key: string): string {
  if (typeof input !== "object" || input === null) return "";
  const value = Reflect.get(input, key);
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAccessRequestEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAccessRequestInput(input: unknown): AccessRequestValidationResult {
  const name = readString(input, "name");
  const email = normalizeAccessRequestEmail(readString(input, "email"));
  const reason = readString(input, "reason");
  const company = readString(input, "company");

  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Enter your name using 2 to 120 characters." };
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (reason.length > 1200) {
    return { ok: false, error: "Keep the optional note under 1,200 characters." };
  }

  return {
    ok: true,
    value: {
      email,
      name,
      reason: reason || null,
      company,
    },
  };
}

export function isAccessRequestStatus(value: unknown): value is AccessRequestStatus {
  return typeof value === "string" && ACCESS_REQUEST_STATUSES.some(status => status === value);
}

export function canOwnerTransitionAccessRequest(
  from: AccessRequestStatus,
  to: AccessRequestStatus,
): boolean {
  return OWNER_TRANSITIONS[from].includes(to);
}
