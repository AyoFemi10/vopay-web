import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-server';

const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
const LOGIN_PAGE = '/auth/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through non-protected routes immediately
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Validate the Supabase session from cookies.
  // createMiddlewareClient also refreshes the session automatically when
  // the access token is close to expiry, writing the updated cookies back.
  const supabase = createMiddlewareClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PAGE;
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
