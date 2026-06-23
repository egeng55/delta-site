const DEFAULT_CONSOLE_URL = "http://127.0.0.1:3000/os";
const SERVICE_LOG_LIMIT = 200;
const PACKAGED_SERVICE_MANAGER_DISABLED_REASON =
  "Packaged Delta OS does not start local development services. Start backend/site manually, then reload the console.";

function resolveConsoleUrl(env = process.env, warn = () => {}) {
  const configured = env.DELTA_OS_CONSOLE_URL || DEFAULT_CONSOLE_URL;
  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Delta OS console URL must be http or https.");
    }
    return url.toString();
  } catch {
    warn(`[Delta OS] Invalid DELTA_OS_CONSOLE_URL; falling back to ${DEFAULT_CONSOLE_URL}.`);
    return DEFAULT_CONSOLE_URL;
  }
}

function resolveDesktopRuntime({ isPackaged = false } = {}) {
  const packaged = Boolean(isPackaged);
  return {
    mode: packaged ? "packaged" : "development",
    isPackaged: packaged,
    serviceManagerEnabled: !packaged,
    serviceManagerDisabledReason: packaged ? PACKAGED_SERVICE_MANAGER_DISABLED_REASON : null,
    productionPathStatus: packaged ? "packaged_local_shell_only" : "development_service_manager",
  };
}

module.exports = {
  DEFAULT_CONSOLE_URL,
  PACKAGED_SERVICE_MANAGER_DISABLED_REASON,
  SERVICE_LOG_LIMIT,
  resolveConsoleUrl,
  resolveDesktopRuntime,
};
