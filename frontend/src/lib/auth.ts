import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  debug: process.env.AUTH_DEBUG === 'true',
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Route protection: runs in middleware
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Protected routes require auth
      const protectedRoutes = ['/chat', '/dashboard', '/explorer']
      const isProtected = protectedRoutes.some(r => pathname.startsWith(r))

      if (isProtected && !isLoggedIn) {
        return false // NextAuth redirects to signIn page automatically
      }

      // Redirect logged-in users away from login page
      if (pathname.startsWith('/login') && isLoggedIn) {
        return Response.redirect(new URL('/chat', nextUrl))
      }

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
