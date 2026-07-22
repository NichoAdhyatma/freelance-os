import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/clients',
  '/dashboard/finance',
  '/dashboard/settings',
  '/dashboard/invoices',
];

// Public routes - redirect to dashboard if logged in
const publicRoutes = ['/', '/login', '/register', '/activate'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has session cookie
  const sessionCookie = request.cookies.get('session_token');
  const isLoggedIn = !!sessionCookie?.value;

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current route is public (redirect if logged in)
  const isPublicRoute = publicRoutes.includes(pathname);

  // 1. Accessing protected route without login → redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Accessing public route while logged in → redirect to dashboard
  if (isPublicRoute && isLoggedIn) {
    // Only redirect if not already going to a protected route
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
