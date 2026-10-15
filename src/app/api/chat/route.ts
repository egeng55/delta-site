import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

type AuthenticatedUserResult =
  | { userId: string }
  | { response: NextResponse };

async function authenticateBearer(
  authorization: string | null,
): Promise<AuthenticatedUserResult> {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    return {
      response: NextResponse.json(
        { error: 'Authenticated chat requires a bearer token.' },
        { status: 401 },
      ),
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return {
      response: NextResponse.json(
        { error: 'Authentication is not configured.' },
        { status: 503 },
      ),
    };
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(5000) }) },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id || data.user.is_anonymous || !data.user.email_confirmed_at) {
      return {
        response: NextResponse.json(
          { error: 'Authenticated session required.' },
          { status: 401 },
        ),
      };
    }
    return { userId: data.user.id };
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Authentication could not be verified.' },
        { status: 503 },
      ),
    };
  }
}

function boundedString(value: unknown, maximum: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || value.length > maximum) return undefined;
  return value;
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
  const authenticated = await authenticateBearer(authorization);
  if ('response' in authenticated) return authenticated.response;

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
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 });
    }
    const candidate = body as Record<string, unknown>;
    const message = boundedString(candidate.message, 12_000)?.trim();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    const unitSystem = boundedString(candidate.unit_system, 16);
    if (unitSystem && unitSystem !== 'metric' && unitSystem !== 'imperial') {
      return NextResponse.json({ error: 'Invalid unit system' }, { status: 400 });
    }
    const weatherContext = boundedString(candidate.weather_context, 4_000);
    const clientTimezone = boundedString(candidate.client_timezone, 128);
    const upstreamBody = {
      user_id: authenticated.userId,
      message,
      ...(unitSystem ? { unit_system: unitSystem } : {}),
      ...(weatherContext ? { weather_context: weatherContext } : {}),
      ...(clientTimezone ? { client_timezone: clientTimezone } : {}),
      ...(typeof candidate.conversation_id === 'string' ? { conversation_id: candidate.conversation_id } : {}),
      ...(typeof candidate.request_id === 'string' ? { request_id: candidate.request_id } : {}),
    };
    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization!,
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
      redirect: 'error',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: controller.signal.aborted ? 'API timed out; check activity before resubmitting' : 'Failed to reach API' }, { status: controller.signal.aborted ? 504 : 502 });
  } finally {
    clearTimeout(timer);
  }
}
