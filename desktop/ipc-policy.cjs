const OWNER_CHECK_TIMEOUT_MS = 5000;
const OWNER_RESPONSE_LIMIT = 16384;
const COPY_TEXT_LIMIT = 65536;
const URL_LIMIT = 4096;

function denied() {
  return new Error("Desktop access denied. Sign in as the platform owner in Delta and try again.");
}

function isTrustedNavigation(value, { entryUrl, fallbackUrl }, allowFallback = false) {
  try {
    const target = new URL(value);
    const entry = new URL(entryUrl);
    if (target.username || target.password) return false;
    if (["http:", "https:"].includes(target.protocol) && target.origin === entry.origin) return true;
    if (!allowFallback || target.protocol !== "file:") return false;
    const fallback = new URL(fallbackUrl);
    return target.protocol === fallback.protocol && target.host === fallback.host && target.pathname === fallback.pathname;
  } catch {
    return false;
  }
}

function assertTrustedSender(event, window, urls, allowFallback = false) {
  if (!window || window.isDestroyed() || !event?.sender || event.sender.isDestroyed()) throw denied();
  const contents = window.webContents;
  if (event.sender !== contents || !event.senderFrame || event.senderFrame !== contents.mainFrame) throw denied();
  if (!isTrustedNavigation(event.senderFrame.url, urls, allowFallback) ||
      !isTrustedNavigation(contents.getURL(), urls, allowFallback)) throw denied();
  return { contents, frame: event.senderFrame, url: event.senderFrame.url };
}

function validateArguments(kind, args, entryUrl) {
  if (kind === "none") {
    if (args.length !== 0) throw new Error("This desktop action takes no arguments.");
    return args;
  }
  if (args.length !== 1 || typeof args[0] !== "string") throw new Error("Desktop action requires one text value.");
  const value = args[0];
  if (kind === "copy") {
    if (value.length > COPY_TEXT_LIMIT || value.includes("\0")) throw new Error("Clipboard text exceeds desktop limits.");
  } else if (kind === "url") {
    if (!value || value.length > URL_LIMIT || !isTrustedNavigation(value, { entryUrl }, false)) {
      throw new Error("Only the configured Delta origin can be opened from the desktop bridge.");
    }
  } else {
    throw new Error("Unknown desktop argument policy.");
  }
  return args;
}

async function readBoundedJson(response) {
  if (!response.body || !response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw denied();
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > OWNER_RESPONSE_LIMIT)) throw denied();
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > OWNER_RESPONSE_LIMIT) throw denied();
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    await reader.cancel().catch(() => {});
  }
}

async function verifyOwnerSession(contents, entryUrl, timeoutMs = OWNER_CHECK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Cookies stay in the owning Electron session. Renderer claims and tokens are never inputs.
    const response = await contents.session.fetch(new URL("/api/workspace/access", entryUrl).toString(), {
      method: "GET",
      credentials: "include",
      redirect: "error",
      cache: "no-store",
      bypassCustomProtocolHandlers: true,
      headers: { Accept: "application/json", "Cache-Control": "no-store" },
      signal: controller.signal,
    });
    if (response.status !== 200 || response.redirected) throw denied();
    const { access } = await readBoundedJson(response);
    if (!access || typeof access.userId !== "string" || !access.userId.trim() || access.userId.length > 256 ||
        access.role !== "owner" || !Array.isArray(access.permissions) || !access.permissions.includes("runtime.execute")) {
      throw denied();
    }
  } catch {
    // Avoid returning request URLs, cookies, backend errors, or auth response content across IPC.
    throw denied();
  } finally {
    clearTimeout(timer);
  }
}

function createDesktopHandler({ getWindow, entryUrl, fallbackUrl, owner = false, arguments: kind = "none", action }) {
  const urls = { entryUrl, fallbackUrl };
  return async (event, ...args) => {
    const snapshot = assertTrustedSender(event, getWindow(), urls, !owner);
    validateArguments(kind, args, entryUrl);
    if (owner) {
      await verifyOwnerSession(snapshot.contents, entryUrl);
      const current = assertTrustedSender(event, getWindow(), urls, false);
      if (current.frame !== snapshot.frame || current.url !== snapshot.url) throw denied();
    }
    return action(...args);
  };
}

module.exports = {
  COPY_TEXT_LIMIT, OWNER_RESPONSE_LIMIT, OWNER_CHECK_TIMEOUT_MS, URL_LIMIT,
  isTrustedNavigation, assertTrustedSender, validateArguments, verifyOwnerSession, createDesktopHandler,
};
