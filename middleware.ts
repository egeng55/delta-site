import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const OWNER_HQ_ROUTE = '/hq';
const PROTECTED_ROUTES = [
  OWNER_HQ_ROUTE,
  '/command',
  '/dashboard',
  '/settings',
  '/account',
  '/insights',
  '/integrations/whoop',
];
const AUTH_ROUTES = ['/login', '/signup'];
const OS_CONSOLE_ROUTE = '/os';
const LOCAL_ONLY_ROUTES = ['/os', '/demo', '/dashboard'];

function isOsConsoleRoute(pathname: string): boolean {
  return pathname === OS_CONSOLE_ROUTE || pathname.startsWith(`${OS_CONSOLE_ROUTE}/`);
}

function isLocalOnlyRoute(pathname: string): boolean {
  return LOCAL_ONLY_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isOsRoute = isOsConsoleRoute(pathname);
  const isInternalRoute = isLocalOnlyRoute(pathname);

  if (isInternalRoute && process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // The OS console has no product authentication boundary and is available
  // only from an explicitly started local development environment.
  if (isOsRoute) {
    return response;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isDevelopmentOwnerHq = pathname.startsWith(OWNER_HQ_ROUTE) && process.env.NODE_ENV !== 'production';
    if (isProtectedRoute && !isDevelopmentOwnerHq) {
      return new NextResponse('Service unavailable', { status: 503 });
    }
    return NextResponse.next();
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

  const { data: { user } } = await supabase.auth.getUser();

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

  if (isAuthRoute && user) {
    return redirectWithCookies(new URL('/command', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/hq/:path*',
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
