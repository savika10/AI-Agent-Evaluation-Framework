import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refreshes the session if needed and sets the session cookies
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;
  const protectedPaths = ['/dashboard', '/settings', '/evals'];

  // Redirect unauthenticated users away from protected routes
  if (!session && protectedPaths.some(path => pathname.startsWith(path))) {
    // Redirect to the login page
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If on the login page and authenticated, redirect to the dashboard
  if (session && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Exclude API routes, static files, and Next.js internal paths
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};