// One attempt, including response-body parsing in the deadline. Never retry writes.
export async function requestJson(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectDeadline: (reason: Error) => void = () => undefined;
  const cancel = () => {
    controller.abort();
    rejectDeadline(new Error("request_cancelled"));
  };
  if (options.signal?.aborted) throw new Error("request_cancelled");
  const deadline = new Promise<never>((_, reject) => {
    rejectDeadline = reject;
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("request_timeout"));
    }, timeoutMs);
  });
  options.signal?.addEventListener("abort", cancel, { once: true });
  try {
    return await Promise.race([
      deadline,
      (async () => {
        const response = await fetch(url, {
          ...options,
          cache: "no-store",
          signal: controller.signal,
        });
        // Error payloads are neither needed nor safe to expose to a visitor.
        if (!response.ok) {
          void response.body?.cancel().catch(() => undefined);
          return { ok: false, status: response.status, data: null };
        }
        const data: unknown = await response.json();
        return { ok: true, status: response.status, data };
      })(),
    ]);
  } catch {
    throw new Error(
      controller.signal.aborted ? "request_interrupted" : "request_failed",
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", cancel);
  }
}
