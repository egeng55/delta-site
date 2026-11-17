// Same-origin check for product routes: compare Origin with the served Host, never
// Next's normalized internal hostname or a forwarded host. HQ keeps its own
// configured-origin check (hqOrigin.ts) so the two can move to separate hosts.
export function isSiteOrigin(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin === `${url.protocol}//${request.headers.get('host') || url.host}`;
}
