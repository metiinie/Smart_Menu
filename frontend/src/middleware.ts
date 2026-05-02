import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // E.g. hostname: tenant1.arifsmart.com
  const isSubdomain = hostname.includes('.') && !hostname.startsWith('www') && !hostname.startsWith('localhost');
  const subdomain = isSubdomain ? hostname.split('.')[0] : null;

  // 1. Subdomain Routing (Staff/Admin)
  if (subdomain) {
    // If they are trying to access the customer menu via subdomain, redirect to main domain
    // Or if they are at the root of the subdomain, rewrite to /admin
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/admin`, request.url));
    }
    // All other subdomain requests stay on their path
    return NextResponse.next();
  }

  // 2. Path-based Routing (Customers)
  // This is handled natively by Next.js App Router (/menu/[branchId]/[tableId])
  // No special middleware required here for customers unless we want to inject headers

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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
