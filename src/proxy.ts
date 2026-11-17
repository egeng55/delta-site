import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { authRedirect } from './lib/authRedirect';
import { accountAdmission } from './lib/accountAdmission';

const OWNER_HQ_ROUTE = '/hq';
// Deny-by-default boundary for owner APIs: a handler that forgets its own owner
// check is still unreachable. Mirrors requireObservatoryOwner's status codes.
const HQ_API_ROUTE = '/api/hq';
const OWNER_ID = /^[a-f0-9-]{36}$/i;
const PROTECTED_ROUTES = [
  OWNER_HQ_ROUTE,
  '/app',
  '/workspace',
  '/command',
  '/dashboard',
  '/settings',
  '/account',
  '/insights',
  '/integrations/whoop',
];
const AUTH_ROUTES = ['/login', '/signup'];
const OS_CONSOLE_ROUTE = '/os';
const LOCAL_ONLY_ROUTES = ['/os', '/demo', '/dashboard', '/observatory-preview', '/workspace-preview'];

function isOsConsoleRoute(pathname: string): boolean {
  return pathname === OS_CONSOLE_ROUTE || pathname.startsWith(`${OS_CONSOLE_ROUTE}/`);
}

function isHqApiRoute(pathname: string): boolean {
  return pathname === HQ_API_ROUTE || pathname.startsWith(`${HQ_API_ROUTE}/`);
}

function hqApiDenied(status: 401 | 403 | 503): NextResponse {
  return NextResponse.json({ error: 'owner_access_required' }, {
    status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' },
  });
}

function isLocalOnlyRoute(pathname: string): boolean {
  return LOCAL_ONLY_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isOsRoute = isOsConsoleRoute(pathname);
  const isInternalRoute = isLocalOnlyRoute(pathname);
  const isHqApi = isHqApiRoute(pathname);
  const ownerId = process.env.DELTA_HQ_OWNER_USER_ID;

  if (isInternalRoute && process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // The OS console has no product authentication boundary and is available
  // only from an explicitly started local development environment.
  if (isOsRoute || (pathname === '/workspace-preview' && process.env.NODE_ENV === 'development')) {
    return response;
  }

  if (isHqApi && (!supabaseUrl || !supabaseAnonKey || !ownerId || !OWNER_ID.test(ownerId))) return hqApiDenied(503);

  if (!supabaseUrl || !supabaseAnonKey) {
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isDevelopmentOwnerHq = pathname.startsWith(OWNER_HQ_ROUTE) && process.env.NODE_ENV !== 'production';
    if (isProtectedRoute && !isDevelopmentOwnerHq) {
      return new NextResponse('Service unavailable', { status: 503 });
    }
    return NextResponse.next();
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000), cache: 'no-store' }) },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user;
  try { const result = await supabase.auth.getUser(); user = result.data.user; }
  catch { return new NextResponse('Authentication temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'private, no-store' } }); }

  if (isHqApi) {
    if (!user) return hqApiDenied(401);
    if (user.id !== ownerId || user.is_anonymous || !user.email_confirmed_at) return hqApiDenied(403);
    return response;
  }

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  const redirectWithCookies = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  };

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return redirectWithCookies(loginUrl);
  }

  if (isProtected && user) {
    if (user.is_anonymous || !user.email_confirmed_at) return new NextResponse('Access denied', { status: 403 });
    let data;
    try { ({ data } = await supabase.auth.getSession()); }
    catch { return new NextResponse('Authentication temporarily unavailable', { status: 503 }); }
    const admission = await accountAdmission(data.session?.access_token || '', user.id);
    if (admission !== 'approved') return new NextResponse('Account access unavailable', {
      status: admission === 'denied' ? 403 : 503, headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  if (isAuthRoute && user) {
    const fallback = user.id === process.env.DELTA_HQ_OWNER_USER_ID ? '/hq' : '/app';
    return redirectWithCookies(new URL(authRedirect(request.nextUrl.searchParams.get('redirect'), fallback), request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/hq/:path*',
    '/api/hq/:path*',
    '/app/:path*',
    '/workspace/:path*',
    '/workspace-preview/:path*',
    '/observatory-preview/:path*',
    '/os/:path*',
    '/demo/:path*',
    '/command/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/account/:path*',
    '/insights/:path*',
    '/integrations/whoop/:path*',
    '/login',
    '/signup',
  ],
};
