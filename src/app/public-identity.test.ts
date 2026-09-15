import { readFileSync } from "fs";
import path from "path";
import {
  CURATED_PUBLIC_PROOFS,
  PUBLIC_ACCESS_POLICY,
  PUBLIC_CAPABILITIES,
  PUBLIC_CAPABILITY_STATE_DEFINITIONS,
} from "@/lib/publicCapabilityManifest";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Delta public identity", () => {
  it("defines every public maturity state in one canonical manifest", () => {
    expect(Object.keys(PUBLIC_CAPABILITY_STATE_DEFINITIONS)).toEqual([
      "core",
      "available",
      "private_preview",
      "proof",
      "research",
      "internal",
    ]);

    expect(PUBLIC_CAPABILITIES.filter(item => item.state === "available")).toHaveLength(0);
    expect(
      PUBLIC_CAPABILITIES.filter(item => item.state === "private_preview").map(item => item.id),
    ).toEqual(["whoop-connected-context", "preview-control-surface"]);
    expect(PUBLIC_CAPABILITIES.filter(item => item.state === "proof").map(item => item.id)).toEqual([
      "late-caffeine-adaptation",
      "weather-fueling-composition",
    ]);
    expect(PUBLIC_CAPABILITIES.filter(item => item.state === "internal")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "engineering-agent-system", publiclyVisible: false }),
        expect.objectContaining({ id: "technical-cockpits", publiclyVisible: false }),
      ]),
    );
  });

  it("uses request access rather than open registration", () => {
    const signup = readSource("src/app/(auth)/signup/page.tsx");
    const navigation = readSource("src/components/Navigation.tsx");
    const pricing = readSource("src/app/(marketing)/pricing/page.tsx");

    expect(PUBLIC_ACCESS_POLICY.mode).toBe("request_access");
    expect(signup).toContain("Request access to Delta");
    expect(signup).toContain("does not create an account or guarantee approval");
    expect(signup).not.toContain("signup(");
    expect(signup).not.toContain("Create account");
    expect(navigation).toContain("Request access");
    expect(pricing).toContain('redirect("/access")');
  });

  it("presents the product loop and only the two curated public proofs", () => {
    const homepage = readSource("src/app/(marketing)/page.tsx");
    const product = readSource("src/app/(marketing)/product/page.tsx");
    const metadata = readSource("src/app/layout.tsx");

    expect(homepage).toContain("Personal intelligence that improves with evidence.");
    expect(homepage).toContain("getPublicCapabilitiesForSurface(\"home\")");
    expect(product).toContain("Six questions connect one moment to the next.");
    expect(product).toContain("CURATED_PUBLIC_PROOFS");
    expect(CURATED_PUBLIC_PROOFS.map(item => item.capabilityId)).toEqual([
      "late-caffeine-adaptation",
      "weather-fueling-composition",
    ]);
    expect(homepage).not.toContain("Supervised automation");
    expect(product).not.toContain("Engineering agent system");
    expect(metadata).toContain('title: "Delta Personal Intelligence"');
    expect(metadata).not.toContain("AI Health Intelligence");
  });

  it("removes unsupported health, premium, mobile, and historical claims", () => {
    const about = readSource("src/app/(marketing)/about/page.tsx");
    const insights = readSource("src/app/(auth)/insights/page.tsx");

    expect(about).not.toContain("dedicated health intelligence system");
    expect(about).not.toContain('label: "Founded"');
    expect(about).toContain("Eric Geng");
    expect(about).toContain("Rahib Malik");
    expect(about).toContain("Ann Arbor, Michigan");
    expect(insights).not.toContain("hasPremiumAccess");
    expect(insights).not.toContain("apps.apple.com");
    expect(insights).not.toContain("Health Score");
  });

  it("keeps technical cockpits local-only", () => {
    const middleware = readSource("middleware.ts");

    expect(middleware).toContain("const LOCAL_ONLY_ROUTES = ['/os', '/demo', '/dashboard']");
    expect(middleware).toContain("isInternalRoute && process.env.NODE_ENV === 'production'");
    expect(middleware).toContain("status: 404");
    expect(middleware).toContain("const OWNER_HQ_ROUTE = '/hq'");
    expect(middleware).toContain("OWNER_HQ_ROUTE,");
  });
});
