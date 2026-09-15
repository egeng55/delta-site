import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

interface AccessOwnerAuthorization {
  ok: true;
  client: SupabaseClient;
  user: User;
}

interface AccessOwnerAuthorizationFailure {
  ok: false;
  status: 401 | 403 | 503;
  error: string;
}

export type AccessOwnerAuthorizationResult =
  | AccessOwnerAuthorization
  | AccessOwnerAuthorizationFailure;

export function createAccessAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error("Access request storage is not configured");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getOwnerEmails(): string[] {
  return (process.env.DELTA_ACCESS_OWNER_EMAILS ?? "")
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function authorizeAccessOwner(
  request: Request,
): Promise<AccessOwnerAuthorizationResult> {
  let client: SupabaseClient;

  try {
    client = createAccessAdminClient();
  } catch {
    return { ok: false, status: 503, error: "Access review is not configured." };
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  const token = authorization.slice("Bearer ".length).trim();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user?.email) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  const ownerEmails = getOwnerEmails();
  if (ownerEmails.length === 0) {
    return { ok: false, status: 503, error: "Access review is not configured." };
  }

  if (!ownerEmails.includes(data.user.email.toLowerCase())) {
    return { ok: false, status: 403, error: "Owner authorization required." };
  }

  return { ok: true, client, user: data.user };
}
