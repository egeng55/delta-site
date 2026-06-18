import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_ROUTES = ['/dashboard', '/settings', '/account', '/insights'];
const AUTH_ROUTES = ['/login', '/signup'];
const OS_CONSOLE_ROUTE = '/os';

function isOsConsoleRoute(pathname: string): boolean {
  return pathname === OS_CONSOLE_ROUTE || pathname.startsWith(`${OS_CONSOLE_ROUTE}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isOsRoute = isOsConsoleRoute(pathname);

  // Delta OS Console is a local developer cockpit. Keep it available for
  // localhost/Electron development, but do not expose it from production
  // deployments until a full authenticated product boundary is implemented.
  if (isOsRoute) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Delta OS Console is available only in local development.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return response;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    if (isProtectedRoute) {
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
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/os/:path*', '/dashboard/:path*', '/settings/:path*', '/account/:path*', '/insights/:path*', '/login', '/signup'],
};
