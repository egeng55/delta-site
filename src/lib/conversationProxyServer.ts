import { createClient } from '@supabase/supabase-js';

export async function conversationProxy(request: Request, threadId?: string): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const api = process.env.NEXT_PUBLIC_DELTA_API_URL;
  const authorization = request.headers.get('authorization');
  if (!authorization?.match(/^Bearer \S+$/)) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (!url || !key || !api) return Response.json({ error: 'Service unavailable' }, { status: 503 });
  if (threadId && !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(threadId)) return Response.json({ error: 'Invalid conversation' }, { status: 400 });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(10000)]);
  try {
    const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal, cache: 'no-store' }) } });
    const { data, error } = await client.auth.getUser(authorization.slice(7));
    if (error || !data.user || data.user.is_anonymous || !data.user.email_confirmed_at) return Response.json({ error: 'Authentication required' }, { status: 401 });
    let body: string | undefined;
    if (request.method === 'POST') {
      const reader = request.body?.getReader();
      if (!reader) return Response.json({ error: 'Body required' }, { status: 400 });
      let bytes = 0;
      const chunks: Uint8Array[] = [];
      const cancel = () => { void reader.cancel().catch(() => undefined); };
      signal.addEventListener('abort', cancel, { once: true });
      try {
        while (true) {
          signal.throwIfAborted();
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (bytes > 2048) return Response.json({ error: 'Body too large' }, { status: 413 });
          chunks.push(value);
        }
      } finally { signal.removeEventListener('abort', cancel); await reader.cancel(); }
      signal.throwIfAborted();
      const joined = new Uint8Array(bytes);
      let position = 0;
      for (const chunk of chunks) { joined.set(chunk, position); position += chunk.length; }
      let value;
      try { value = JSON.parse(new TextDecoder().decode(joined)); }
      catch { return Response.json({ error: 'Invalid body' }, { status: 400 }); }
      if (!value || typeof value !== 'object' || Array.isArray(value)) return Response.json({ error: 'Invalid body' }, { status: 400 });
      body = JSON.stringify({ id: value.id, title: value.title });
    }
    const params = new URL(request.url).searchParams;
    const offset = Math.floor(Math.max(0, Math.min(10000, Number(params.get('offset') || 0) || 0)));
    const suffix = threadId ? `/${threadId}/messages` : '';
    const response = await fetch(`${api.replace(/\/$/, '')}/conversations/${encodeURIComponent(data.user.id)}${suffix}?limit=50&offset=${offset}`, {
      method: request.method, headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body, signal, cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) return Response.json({ error: 'Conversation unavailable' }, { status: [401,403,404,409,422,429].includes(response.status) ? response.status : 503 });
    return Response.json(await response.json(), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return Response.json({ error: 'Conversation unavailable' }, { status: 503 }); }
}
