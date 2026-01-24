import { fetchWithRetry, isLikelyRenderColdStart } from "./api";

const originalFetch = global.fetch;
const createResponse = (status = 200, body = ""): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => (body ? JSON.parse(body) : {}),
    text: async () => body,
  } as unknown as Response);

const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

describe("isLikelyRenderColdStart", () => {
  it("detects abort and network style errors", () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";

    expect(isLikelyRenderColdStart(abortError)).toBe(true);
    expect(isLikelyRenderColdStart(new Error("timeout while fetching"))).toBe(true);
    expect(isLikelyRenderColdStart(new Error("Failed to fetch"))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isLikelyRenderColdStart(new Error("boom"))).toBe(false);
    expect(isLikelyRenderColdStart("not-an-error")).toBe(false);
  });
});

describe("fetchWithRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    jest.clearAllMocks();
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it("returns a successful response without retrying", async () => {
    const response = createResponse(200, "ok");
    const fetchMock = jest.fn().mockResolvedValue(response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const requestPromise = fetchWithRetry("https://example.com", {}, 0, 10);
    await jest.runAllTimersAsync();
    const result = await requestPromise;

    expect(result).toBe(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once after an abort error then succeeds", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";

    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(createResponse(200, "ok"));

    global.fetch = fetchMock as unknown as typeof fetch;

    const requestPromise = fetchWithRetry("https://example.com", {}, 1, 5);
    await jest.runAllTimersAsync();
    const result = await requestPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  it("throws after exhausting retries", async () => {
    jest.useRealTimers();
    const abortError = new Error("timeout");
    abortError.name = "AbortError";

    const fetchMock = jest.fn().mockRejectedValue(abortError);
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchWithRetry("https://example.com", {}, 1, 5)).rejects.toThrow("timeout");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
