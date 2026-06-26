import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";
import {
  clearLoginFailures,
  getClientIp,
  isLoginRateLimited,
  recordLoginFailure,
} from "@/lib/rate-limit";

class RateLimited extends CredentialsSignin {
  code = "rate_limit";
}

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        return token;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true },
        });

        if (!dbUser) {
          return { ...token, id: undefined, role: undefined };
        }

        token.role = dbUser.role;
      }

      return token;
    },
    session({ session, token }) {
      if (!token?.id || !session.user) {
        return session;
      }
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const parsedCredentials = loginSchema.safeParse(credentials);
        if (!parsedCredentials.success) {
          throw new InvalidCredentials();
        }

        const { email, password } = parsedCredentials.data;
        const normalizedEmail = email.toLowerCase();
        const ip = request ? getClientIp(request) : "unknown";
        const emailKey = `email:${normalizedEmail}`;
        const ipKey = `ip:${ip}`;

        if (isLoginRateLimited(emailKey) || isLoginRateLimited(ipKey)) {
          throw new RateLimited();
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user?.password) {
          recordLoginFailure(emailKey);
          recordLoginFailure(ipKey);
          throw new InvalidCredentials();
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          recordLoginFailure(emailKey);
          recordLoginFailure(ipKey);
          throw new InvalidCredentials();
        }

        clearLoginFailures(emailKey, ipKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
