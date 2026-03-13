import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define protected routes
  const isProtectedRoute = path.startsWith('/dashboard');

  // Get token from cookies (used only for basic route protection)
  // Note: sessionStorage on client handles actual per-tab authentication
  const token = request.cookies.get('mantrac_auth_token')?.value;

  // Redirect to login if trying to access protected route without any token
  // This is a basic check - actual auth is handled client-side per tab
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow access to all routes (no auto-redirect from login page)
  // This prevents issues when multiple users are logged in different tabs
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
