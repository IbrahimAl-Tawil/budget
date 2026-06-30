import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      onboardingDone: boolean;
    };
  }
  interface User {
    onboardingDone?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    onboardingDone: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          onboardingDone: user.onboardingDone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.onboardingDone = user.onboardingDone ?? false;
      }
      // Allow updating the token when session is updated (e.g. after onboarding,
      // or when the user renames themselves in Settings)
      if (trigger === "update" && session) {
        token.onboardingDone = session.onboardingDone ?? token.onboardingDone;
        if (session.name) token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.onboardingDone = token.onboardingDone;
      return session;
    },
  },
});
