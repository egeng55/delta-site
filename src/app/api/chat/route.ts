import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

// Clean up stale entries every 5 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap) {
    if (now > data.resetAt) ipRequestMap.delete(ip);
  }
}, 5 * 60 * 1000);
(cleanupInterval as ReturnType<typeof setInterval> & { unref?: () => void }).unref?.();

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record || now > record.resetAt) {
    if (ipRequestMap.size >= 10000 && !record) return false;
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_DELTA_API_URL;
  if (!apiUrl) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json(
      { error: 'Authenticated chat proxy requires an Authorization bearer token.' },
      { status: 401 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (!Number.isFinite(length) || length < 0 || length > 65_536) {
      return NextResponse.json({ error: 'Chat request too large' }, { status: 413 });
    }
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: 'Request body required' }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    const cancelBody = () => { void reader.cancel(); };
    controller.signal.addEventListener('abort', cancelBody, { once: true });
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (controller.signal.aborted) return NextResponse.json({ error: 'Request timed out' }, { status: 408 });
        if (done) break;
        size += value.byteLength;
        if (size > 65_536) {
          await reader.cancel();
          return NextResponse.json({ error: 'Chat request too large' }, { status: 413 });
        }
        chunks.push(value);
      }
    } finally {
      controller.signal.removeEventListener('abort', cancelBody);
      reader.releaseLock();
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: controller.signal.aborted ? 'API timed out; check activity before resubmitting' : 'Failed to reach API' }, { status: controller.signal.aborted ? 504 : 502 });
  } finally {
    clearTimeout(timer);
  }
}
