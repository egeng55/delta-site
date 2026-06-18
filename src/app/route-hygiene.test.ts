import { existsSync, readFileSync } from "fs";
import path from "path";

describe("route hygiene", () => {
  it("makes the OS Console route explicitly local-only in middleware", () => {
    const middlewareSource = readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");

    expect(middlewareSource).toContain("OS_CONSOLE_ROUTE = '/os'");
    expect(middlewareSource).toContain("Delta OS Console is a local developer cockpit");
    expect(middlewareSource).toContain("process.env.NODE_ENV === 'production'");
    expect(middlewareSource).toContain("Delta OS Console is available only in local development.");
    expect(middlewareSource).toContain("'/os/:path*'");
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
