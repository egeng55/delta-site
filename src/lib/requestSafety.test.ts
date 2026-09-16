/** @jest-environment node */
import { createRequestLimiter, readLimitedJson } from "./requestSafety";
import { requestJson } from "./requestJson";

describe("bounded request admission", () => {
  it("admits exactly five simultaneous requests per key and isolates other users", async () => {
    const limit = createRequestLimiter(5, 60000);
    const results = await Promise.all(
      Array.from({ length: 100 }, () => Promise.resolve(limit("one", 0))),
    );
    expect(results.filter((result) => result === 0)).toHaveLength(5);
    expect(limit("two", 0)).toBe(0);
    expect(limit("one", 60000)).toBe(0);
  });
  it("bounds memory, rejects new keys at capacity, and expires old keys", () => {
    const limit = createRequestLimiter(2, 1000, 2);
    expect(limit("a", 0)).toBe(0);
    expect(limit("b", 0)).toBe(0);
    expect(limit("c", 0)).toBe(1);
    expect(limit("c", 1000)).toBe(0);
  });
  const request = (body: string, headers = {}) =>
    new Request("http://localhost", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json", ...headers },
    });
  it("validates actual bytes, not only declared length", async () => {
    await expect(readLimitedJson(request('{"ok":true}'), 20)).resolves.toEqual({
      ok: true,
    });
    await expect(
      readLimitedJson(request("x".repeat(40), { "content-length": "1" }), 20),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      readLimitedJson(request("{}", { "content-length": "NaN" }), 20),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      readLimitedJson(
        request("{}", { "content-type": "multipart/form-data" }),
        20,
      ),
    ).rejects.toMatchObject({ status: 415 });
    await expect(
      readLimitedJson(request("not-json"), 20),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("terminates a stalled request body without parsing or dispatching", async () => {
    jest.useFakeTimers();
    const cancel = jest.fn();
    const body = new ReadableStream({ cancel });
    const req = new Request("http://localhost", {
      method: "POST",
      body,
      duplex: "half",
      headers: { "content-type": "application/json" },
    } as RequestInit);
    const result = expect(readLimitedJson(req, 100, 50)).rejects.toMatchObject({
      status: 408,
    });
    await jest.advanceTimersByTimeAsync(50);
    await result;
    expect(cancel).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});

describe("single-attempt client requests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  it("bounds response parsing as well as headers and does not retry", async () => {
    jest.useFakeTimers();
    const fetch = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: () => new Promise(() => undefined),
      } as unknown as Response);
    const result = expect(
      requestJson("/fixture", { method: "POST" }, 50),
    ).rejects.toThrow("request_interrupted");
    await jest.advanceTimersByTimeAsync(50);
    await result;
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch.mock.calls[0][1]?.signal as AbortSignal).aborted).toBe(true);
  });
  it("does not parse or expose private error payloads", async () => {
    const json = jest.fn();
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue({
        ok: false,
        status: 500,
        json,
      } as unknown as Response);
    await expect(requestJson("/fixture")).resolves.toEqual({
      ok: false,
      status: 500,
      data: null,
    });
    expect(json).not.toHaveBeenCalled();
  });
  it("refuses pre-aborted requests before dispatch", async () => {
    const fetch = jest.spyOn(global, "fetch");
    await expect(
      requestJson("/fixture", { signal: AbortSignal.abort() }),
    ).rejects.toThrow("request_cancelled");
    expect(fetch).not.toHaveBeenCalled();
  });
});
