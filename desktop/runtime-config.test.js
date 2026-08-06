/** @jest-environment node */

const {
  DEFAULT_CONSOLE_URL,
  DEFAULT_HQ_URL,
  PACKAGED_SERVICE_MANAGER_DISABLED_REASON,
  resolveDesktopEntryUrl,
  resolveConsoleUrl,
  resolveDesktopRuntime,
} = require("./runtime-config.cjs");

describe("desktop runtime config", () => {
  it("keeps the service manager enabled for development mode", () => {
    expect(resolveDesktopRuntime({ isPackaged: false })).toEqual({
      mode: "development",
      isPackaged: false,
      serviceManagerEnabled: true,
      serviceManagerDisabledReason: null,
      productionPathStatus: "development_service_manager",
    });
  });

  it("disables dev service launching in packaged mode", () => {
    expect(resolveDesktopRuntime({ isPackaged: true })).toEqual({
      mode: "packaged",
      isPackaged: true,
      serviceManagerEnabled: false,
      serviceManagerDisabledReason: PACKAGED_SERVICE_MANAGER_DISABLED_REASON,
      productionPathStatus: "packaged_local_shell_only",
    });
  });

  it("accepts http and https HQ URLs", () => {
    expect(resolveDesktopEntryUrl({ DELTA_HQ_URL: "https://delta.local/hq" })).toBe("https://delta.local/hq");
    expect(resolveDesktopEntryUrl({ DELTA_HQ_URL: "http://127.0.0.1:3000/hq" })).toBe(DEFAULT_HQ_URL);
    expect(resolveConsoleUrl({ DELTA_OS_CONSOLE_URL: "http://127.0.0.1:3000/os" })).toBe("http://127.0.0.1:3000/os");
    expect(DEFAULT_CONSOLE_URL).toBe(DEFAULT_HQ_URL);
  });

  it("falls back for malformed or non-http HQ URLs", () => {
    const warn = jest.fn();
    expect(resolveDesktopEntryUrl({ DELTA_HQ_URL: "delta://hq" }, warn)).toBe(DEFAULT_HQ_URL);
    expect(resolveDesktopEntryUrl({ DELTA_HQ_URL: "not a url" }, warn)).toBe(DEFAULT_HQ_URL);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
