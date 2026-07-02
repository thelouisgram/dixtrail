import type { NextAuthConfig } from 'next-auth';
import { CLEAR_SESSION_PATH } from '@/lib/auth-utils';

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const hasValidSession = !!(auth?.user?.id && auth?.user?.role);

      if (pathname === CLEAR_SESSION_PATH) {
        return true;
      }

      const isOnDashboard = pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (hasValidSession) return true;
        return false;
      }

      if (hasValidSession && (pathname === '/login' || pathname === '/')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (!token?.id || !token?.role || !session.user) {
        return session;
      }
      session.user.role = token.role as string;
      session.user.id = token.id as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
