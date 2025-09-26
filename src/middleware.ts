import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple client-side auth gate: if no session cookie, allow; UI will prompt login.
// If you want strict gating, redirect unauthenticated users to /login for protected paths.

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const isProtected = url.pathname.startsWith('/profile') || url.pathname.startsWith('/challenge/create');
  // We rely on client to handle session; optional redirect could be added here.
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/challenge/create'],
};



