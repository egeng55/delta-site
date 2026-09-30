const DEFAULT_HQ_URL = "http://127.0.0.1:3000/hq";
const DEFAULT_WORKSPACE_URL = "http://127.0.0.1:3000/workspace";
const DEFAULT_CONSOLE_URL = DEFAULT_WORKSPACE_URL;
const SERVICE_LOG_LIMIT = 200;
const PACKAGED_SERVICE_MANAGER_DISABLED_REASON =
  "Packaged Delta HQ does not start local development services. Start backend/site manually, then reload HQ.";

function resolveDesktopEntryUrl(env = process.env, warn = () => {}) {
  const configured = env.DELTA_HQ_URL || env.DELTA_DESKTOP_URL || env.DELTA_OS_CONSOLE_URL || DEFAULT_WORKSPACE_URL;
  try {
    const url = new URL(configured);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
      throw new Error("Delta HQ URL must be http or https.");
    }
    return url.toString();
  } catch {
    warn(`[Delta HQ] Invalid desktop URL; falling back to ${DEFAULT_WORKSPACE_URL}.`);
    return DEFAULT_WORKSPACE_URL;
  }
}

function resolveConsoleUrl(env = process.env, warn = () => {}) {
  return resolveDesktopEntryUrl(env, warn);
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
  DEFAULT_HQ_URL,
  DEFAULT_WORKSPACE_URL,
  DEFAULT_CONSOLE_URL,
  PACKAGED_SERVICE_MANAGER_DISABLED_REASON,
  SERVICE_LOG_LIMIT,
  resolveDesktopEntryUrl,
  resolveConsoleUrl,
  resolveDesktopRuntime,
};
