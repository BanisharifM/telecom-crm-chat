export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/chat/:path*',
    '/dashboard/:path*',
    '/explorer/:path*',
    '/login',
  ],
}
