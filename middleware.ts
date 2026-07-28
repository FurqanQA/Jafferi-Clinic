import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Public routes that do not require authentication.
 */
const publicRoutes = [
  '/',
  '/about',
  '/features',
  '/pricing',
  '/contact',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

/**
 * Authentication routes that authenticated users should be redirected from.
 */
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

/**
 * Protected route prefixes that require authentication.
 */
const protectedRoutePrefixes = [
  '/dashboard',
  '/patients',
  '/doctors',
  '/appointments',
  '/billing',
  '/reports',
  '/settings',
  '/profile',
  '/notifications',
];

/**
 * Determines if a path is a public route.
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Determines if a path is an authentication route.
 */
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Determines if a path is a protected route.
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

/**
 * Next.js middleware for route protection and session management.
 * This middleware:
 * - Refreshes expired sessions automatically
 * - Redirects unauthenticated users from protected routes to login
 * - Redirects authenticated users from auth pages to dashboard
 * - Uses the existing Supabase middleware helper for session updates
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Create response and update session
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Update session using the existing helper
  const updatedResponse = await updateSession(request, response);

  // Create Supabase client to check authentication status
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          updatedResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name);
          updatedResponse.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get current user to check authentication status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle auth routes - redirect authenticated users to dashboard
  if (isAuthRoute(pathname) && isAuthenticated) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return updatedResponse;
}

/**
 * Matcher configuration to control when middleware runs.
 * Excludes static assets, API routes, and other paths that don't need authentication.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     * - API routes (unless authentication is required)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};
