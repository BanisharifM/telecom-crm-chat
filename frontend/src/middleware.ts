import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/chat', '/dashboard', '/explorer']

// Routes that should redirect to /chat if already logged in
const AUTH_ROUTES = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for session token (NextAuth.js stores it as a cookie)
  const sessionToken = request.cookies.get('next-auth.session-token')?.value
    || request.cookies.get('__Secure-next-auth.session-token')?.value

  const isLoggedIn = !!sessionToken
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to chat if accessing login while already authenticated
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/dashboard/:path*',
    '/explorer/:path*',
    '/login',
  ],
}
