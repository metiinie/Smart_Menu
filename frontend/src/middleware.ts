import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Improved subdomain detection
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname.split(':')[0]);
  const isLocalhost = hostname.startsWith('localhost');
  const isVercel = hostname.endsWith('.vercel.app');
  
  const parts = hostname.split('.');
  // A subdomain exists if:
  // - On Vercel: more than 3 parts (e.g., branch1.smart-menu.vercel.app)
  // - On Custom Domain: more than 2 parts (e.g., branch1.example.com)
  const isSubdomain = !isIpAddress && !isLocalhost && !hostname.startsWith('www') && (
    isVercel ? parts.length > 3 : parts.length > 2
  );
  
  const subdomain = isSubdomain ? parts[0] : null;

  // 1. Subdomain Routing (Staff/Admin)
  if (subdomain) {
    // If at the root of a subdomain, rewrite to the admin dashboard
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/admin/dashboard`, request.url));
    }
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
