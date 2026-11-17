import { readFileSync } from "fs";
import path from "path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Delta HQ web route", () => {
  it("renders the owner-gated Observatory without replacing the OS Console", () => {
    const pageSource = readSource("src/app/(hq)/hq/page.tsx");
    expect(pageSource).toContain("Delta HQ");
    expect(pageSource).toContain("requireObservatoryOwner()");
    expect(pageSource).toContain("<Observatory initialReport={await readObservatoryReport()} />");
    expect(pageSource).toContain('dynamic = "force-dynamic"');
  });

  it("keeps HQ pages and every HQ API behind the middleware owner boundary", () => {
    const middlewareSource = readSource("src/proxy.ts");
    expect(middlewareSource).toContain("OWNER_HQ_ROUTE = '/hq'");
    expect(middlewareSource).toContain("PROTECTED_ROUTES = [");
    expect(middlewareSource).toContain("'/hq/:path*'");
    expect(middlewareSource).toContain("'/api/hq/:path*'");
    expect(middlewareSource).toContain("'/os/:path*'");
  });
});
