import { existsSync, readFileSync } from "fs";
import path from "path";

describe("route hygiene", () => {
  it("keeps internal technical surfaces local-only in middleware", () => {
    const middlewareSource = readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");

    expect(middlewareSource).toContain("LOCAL_ONLY_ROUTES = ['/os', '/demo', '/dashboard', '/observatory-preview']");
    expect(middlewareSource).toContain("process.env.NODE_ENV === 'production'");
    expect(middlewareSource).toContain("status: 404");
    expect(middlewareSource).toContain("'/os/:path*'");
    expect(middlewareSource).toContain("'/demo/:path*'");
    expect(middlewareSource).toContain("'/dashboard/:path*'");
  });

  it("treats HQ as a protected owner web app route", () => {
    const middlewareSource = readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");

    expect(middlewareSource).toContain("OWNER_HQ_ROUTE = '/hq'");
    expect(middlewareSource).toContain("PROTECTED_ROUTES = [");
    expect(middlewareSource).toContain("OWNER_HQ_ROUTE,");
    expect(middlewareSource).toContain("isDevelopmentOwnerHq");
    expect(middlewareSource).toContain("'/hq/:path*'");
  });

  it("keeps the protected settings route backed by a page", () => {
    const middlewareSource = readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");
    const settingsPath = path.join(process.cwd(), "src/app/(auth)/settings/page.tsx");
    const settingsSource = readFileSync(settingsPath, "utf8");

    expect(middlewareSource).toContain("'/settings'");
    expect(existsSync(settingsPath)).toBe(true);
    expect(settingsSource).toContain("Protected route");
    expect(settingsSource).toContain("No memory writes, notifications, mic capture, or TTS are enabled here.");
  });
});
