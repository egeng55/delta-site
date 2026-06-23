/** @jest-environment node */

const {
  DEFAULT_CONSOLE_URL,
  PACKAGED_SERVICE_MANAGER_DISABLED_REASON,
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

  it("accepts http and https console URLs", () => {
    expect(resolveConsoleUrl({ DELTA_OS_CONSOLE_URL: "https://delta.local/os" })).toBe("https://delta.local/os");
    expect(resolveConsoleUrl({ DELTA_OS_CONSOLE_URL: "http://127.0.0.1:3000/os" })).toBe(DEFAULT_CONSOLE_URL);
  });

  it("falls back for malformed or non-http console URLs", () => {
    const warn = jest.fn();
    expect(resolveConsoleUrl({ DELTA_OS_CONSOLE_URL: "delta://os" }, warn)).toBe(DEFAULT_CONSOLE_URL);
    expect(resolveConsoleUrl({ DELTA_OS_CONSOLE_URL: "not a url" }, warn)).toBe(DEFAULT_CONSOLE_URL);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
