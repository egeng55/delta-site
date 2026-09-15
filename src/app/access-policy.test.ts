import { readFileSync } from "fs";
import path from "path";
import { PUBLIC_ACCESS_POLICY } from "@/lib/publicCapabilityManifest";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("request-only access enforcement", () => {
  it("has no client-side Supabase signup path", () => {
    const authContext = readSource("src/context/AuthContext.tsx");
    const signupPage = readSource("src/app/(auth)/signup/page.tsx");
    const supabaseClient = readSource("src/lib/supabase.ts");

    expect(authContext).not.toContain("auth.signUp");
    expect(authContext).not.toContain("signup:");
    expect(signupPage).toContain("AccessRequestForm");
    expect(supabaseClient).toContain("createBrowserClient");
    expect(PUBLIC_ACCESS_POLICY.requestPath).toBe("/signup");
  });

  it("keeps local Auth signup disabled and records the five-state lifecycle", () => {
    const supabaseConfig = readSource("supabase/config.toml");
    const migration = readSource(
      "supabase/migrations/20260806203546_request_only_access.sql",
    );

    expect(supabaseConfig).toContain("enable_signup = false");
    expect(migration).toContain("'submitted', 'reviewing', 'approved', 'declined', 'invited'");
    expect(migration).toContain("access_request_events");
    expect(migration).toContain("REVOKE ALL ON TABLE public.access_requests");
  });

  it("keeps owner review authenticated and invitation server-only", () => {
    const ownerServer = readSource("src/lib/accessRequestServer.ts");
    const invitation = readSource("src/app/api/access-requests/[id]/invite/route.ts");
    const middleware = readSource("middleware.ts");

    expect(ownerServer).toContain("DELTA_ACCESS_OWNER_EMAILS");
    expect(ownerServer).not.toContain("NEXT_PUBLIC_DELTA_ACCESS_OWNER_EMAILS");
    expect(invitation).toContain("auth.admin.inviteUserByEmail");
    expect(invitation).toContain('accessRequest.status !== "approved"');
    expect(middleware).toContain("'/account/:path*'");
  });
});
