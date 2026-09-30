/** @jest-environment node */
const {
  COPY_TEXT_LIMIT, OWNER_RESPONSE_LIMIT,
  isTrustedNavigation, createDesktopHandler, verifyOwnerSession,
} = require("./ipc-policy.cjs");
const { createDiagnosticRedactor, LOG_LINE_LIMIT } = require("./diagnostic-redaction.cjs");

const entryUrl = "https://delta.example/workspace";
const fallbackUrl = "file:///app/desktop/fallback.html";
const ownerAccess = { access: { userId: "owner-id", role: "owner", permissions: ["runtime.execute"] } };

function response(body = ownerAccess, options = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    headers: { "content-type": "application/json" }, ...options,
  });
}

function fixture({ owner = true, kind = "none" } = {}) {
  const mainFrame = { url: entryUrl };
  const fetch = jest.fn(async () => response());
  const contents = { mainFrame, getURL: () => mainFrame.url, isDestroyed: () => false, session: { fetch } };
  const window = { webContents: contents, isDestroyed: () => false };
  const event = { sender: contents, senderFrame: mainFrame };
  const action = jest.fn(() => "performed");
  const handler = createDesktopHandler({ getWindow: () => window, entryUrl, fallbackUrl, owner, arguments: kind, action });
  return { mainFrame, fetch, contents, window, event, action, handler };
}

describe("desktop IPC authority", () => {
  it("uses only its own session for a fresh server owner check", async () => {
    const f = fixture();
    await expect(f.handler(f.event)).resolves.toBe("performed");
    await f.handler(f.event);
    expect(f.fetch).toHaveBeenCalledTimes(2);
    expect(f.fetch).toHaveBeenCalledWith("https://delta.example/api/workspace/access", expect.objectContaining({
      method: "GET", credentials: "include", redirect: "error", cache: "no-store", bypassCustomProtocolHandlers: true,
    }));
    const headers = f.fetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty("Cookie");
    expect(headers).not.toHaveProperty("Authorization");
  });

  it.each([
    "https://delta.example.evil.test/workspace", "http://delta.example/workspace", "https://evil.test/workspace",
    "file:///app/desktop/other.html", fallbackUrl, "about:blank", "data:text/html,hello",
  ])("rejects privileged sender URL %s before requesting auth", async (url) => {
    const f = fixture();
    f.mainFrame.url = url;
    await expect(f.handler(f.event)).rejects.toThrow("Desktop access denied");
    expect(f.fetch).not.toHaveBeenCalled();
    expect(f.action).not.toHaveBeenCalled();
  });

  it("rejects same-origin iframes, other windows and detached senders", async () => {
    const f = fixture();
    for (const event of [
      { ...f.event, senderFrame: { url: entryUrl } },
      { ...f.event, sender: { ...f.contents } },
      { ...f.event, senderFrame: null },
    ]) await expect(f.handler(event)).rejects.toThrow("Desktop access denied");
    f.window.isDestroyed = () => true;
    await expect(f.handler(f.event)).rejects.toThrow("Desktop access denied");
    expect(f.fetch).not.toHaveBeenCalled();
  });

  it("does not accept a renderer-provided owner or cookie claim", async () => {
    const f = fixture();
    await expect(f.handler(f.event, { role: "owner", cookie: "forged" })).rejects.toThrow("takes no arguments");
    expect(f.fetch).not.toHaveBeenCalled();
    expect(f.action).not.toHaveBeenCalled();
  });

  it.each([
    { access: { userId: "consumer", role: "consumer", permissions: ["runtime.execute"] } },
    { access: { userId: "owner", role: "owner", permissions: [] } },
    { access: { userId: "", role: "owner", permissions: ["runtime.execute"] } },
    { authenticated: true, role: "owner" }, {}, null,
  ])("denies invalid server access documents", async (body) => {
    const f = fixture();
    f.fetch.mockImplementation(async () => response(body));
    await expect(f.handler(f.event)).rejects.toThrow("Desktop access denied");
    expect(f.action).not.toHaveBeenCalled();
  });

  it.each([401, 403, 302, 500])("denies HTTP %i without invoking the operation", async (status) => {
    const f = fixture();
    f.fetch.mockImplementation(async () => response(ownerAccess, { status }));
    await expect(f.handler(f.event)).rejects.toThrow("Desktop access denied");
    expect(f.action).not.toHaveBeenCalled();
  });

  it("denies redirect, HTML, malformed JSON and oversized responses", async () => {
    const f = fixture();
    const redirected = response();
    Object.defineProperty(redirected, "redirected", { value: true });
    for (const invalid of [
      redirected,
      response("<html>Login</html>", { headers: { "content-type": "text/html" } }),
      response("bad json"),
      response(" ".repeat(OWNER_RESPONSE_LIMIT + 1)),
      response(ownerAccess, { headers: { "content-type": "application/json", "content-length": String(OWNER_RESPONSE_LIMIT + 1) } }),
    ]) {
      f.fetch.mockResolvedValueOnce(invalid);
      await expect(f.handler(f.event)).rejects.toThrow("Desktop access denied");
    }
    expect(f.action).not.toHaveBeenCalled();
  });

  it("bounds stalled authorization and hides upstream credentials/errors", async () => {
    const f = fixture();
    f.fetch.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("upstream cookie=private")), { once: true });
    }));
    await expect(verifyOwnerSession(f.contents, entryUrl, 5)).rejects.toThrow(/^Desktop access denied\./);
    f.fetch.mockRejectedValue(new Error("https://user:secret@example.test cookie=private"));
    await expect(f.handler(f.event)).rejects.not.toThrow("private");
    expect(f.action).not.toHaveBeenCalled();
  });

  it("rechecks the main frame after authorization before any effect", async () => {
    const f = fixture();
    f.fetch.mockImplementation(async () => {
      f.mainFrame.url = "https://delta.example/login";
      return response();
    });
    await expect(f.handler(f.event)).rejects.toThrow("Desktop access denied");
    expect(f.action).not.toHaveBeenCalled();
  });

  it("permits only recovery copy/open/reload through explicitly safe handlers", async () => {
    const f = fixture({ owner: false, kind: "copy" });
    f.mainFrame.url = `${fallbackUrl}?reason=offline`;
    await expect(f.handler(f.event, "Connection is offline")).resolves.toBe("performed");
    expect(f.fetch).not.toHaveBeenCalled();
    f.mainFrame.url = "file:///other/fallback.html";
    await expect(f.handler(f.event, "text")).rejects.toThrow("Desktop access denied");
  });

  it("bounds and validates clipboard and URL arguments", async () => {
    const copy = fixture({ owner: false, kind: "copy" });
    for (const value of [{ role: "owner" }, "x".repeat(COPY_TEXT_LIMIT + 1), "a\0b"]) {
      await expect(copy.handler(copy.event, value)).rejects.toThrow();
    }
    const url = fixture({ owner: false, kind: "url" });
    for (const value of ["https://evil.test", "https://user:secret@delta.example/workspace", "javascript:alert(1)", entryUrl + "?" + "a".repeat(4096)]) {
      await expect(url.handler(url.event, value)).rejects.toThrow();
    }
    await expect(url.handler(url.event, "https://delta.example/hq")).resolves.toBe("performed");
  });

  it("limits fallback navigation to the bundled document", () => {
    const urls = { entryUrl, fallbackUrl };
    expect(isTrustedNavigation(`${fallbackUrl}?reason=offline`, urls, true)).toBe(true);
    expect(isTrustedNavigation("file:///etc/passwd", urls, true)).toBe(false);
    expect(isTrustedNavigation("https://delta.example@evil.test", urls)).toBe(false);
  });
});

describe("desktop diagnostic redaction", () => {
  it("redacts registered environment secrets and common credential formats", () => {
    const redactor = createDiagnosticRedactor();
    redactor.registerEnvironment({ DELTA_API_KEY: "the-secret-value", SERVICE_TOKEN: "another-secret" });
    for (const value of [
      "failed the-secret-value another-secret", "Authorization: Bearer private-token", "Cookie: session=private-token",
      'api_key="private-token"', "https://user:private-token@service.test/path", "access_token=private-token&x=ok",
      "sk-testlongsecretvalue1234", "eyJ0eXAiOiJKV1Q.test.sig", "sk_live_testsecret1234",
    ]) {
      const result = redactor.redact(value);
      expect(result).not.toMatch(/the-secret-value|another-secret|private-token|testlongsecret|eyJ|testsecret1234/);
      expect(result).toContain("redacted");
    }
    expect(redactor.redact("x".repeat(3000))).toHaveLength(LOG_LINE_LIMIT);
  });
});
