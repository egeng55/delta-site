export class RequestInputError extends Error {
  constructor(public readonly status: 400 | 408 | 413 | 415) {
    super("invalid_request");
  }
}

// Instance-local defense only. A Vercel fleet needs a shared edge/global limit.
export function createRequestLimiter(
  limit: number,
  windowMs: number,
  capacity = 10000,
) {
  const entries = new Map<string, { count: number; expires: number }>();
  return (key: string, now = Date.now()): number => {
    for (const [id, entry] of entries)
      if (entry.expires <= now) entries.delete(id);
    const entry = entries.get(key);
    if (!entry) {
      if (entries.size >= capacity) return Math.ceil(windowMs / 1000);
      entries.set(key, { count: 1, expires: now + windowMs });
      return 0;
    }
    if (entry.count >= limit)
      return Math.max(1, Math.ceil((entry.expires - now) / 1000));
    entry.count++;
    return 0;
  };
}

export async function readLimitedJson(
  request: Request,
  maxBytes: number,
  timeoutMs = 5000,
): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new RequestInputError(415);
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes))
    throw new RequestInputError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestInputError(400);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  const read = async () => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (expired) throw new RequestInputError(408);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        cancel();
        throw new RequestInputError(413);
      }
      chunks.push(value);
    }
    try {
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      return JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
    } catch {
      throw new RequestInputError(400);
    }
  };
  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          cancel();
          reject(new RequestInputError(408));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
