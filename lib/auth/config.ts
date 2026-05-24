import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/auth/password";
import type { UserRole } from "@/types/database";

/**
 * NextAuth.js v5 (Auth.js) configuration.
 *
 * - Credentials provider only (no OAuth in Phase 8).
 * - JWT session strategy — no database sessions, keeps Neon load low and
 *   keeps a path open for native (Android) JWT consumption later.
 * - Roles allowed: "admin" and "staff".
 * - Generic error message on invalid email or password (no enumeration).
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}

const ALLOWED_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  "admin",
  "staff",
]);

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 255) return null;
  return trimmed;
}

function normalisePassword(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > 200) return null;
  return value;
}

export const authConfig: NextAuthConfig = {
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const email = normaliseEmail(rawCredentials?.email);
        const password = normalisePassword(rawCredentials?.password);
        if (!email || !password) return null;

        try {
          const [row] = await db
            .select({
              id: users.id,
              email: users.email,
              role: users.role,
              hashedPw: users.hashedPw,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!row || !row.hashedPw) return null;
          if (!ALLOWED_ROLES.has(row.role)) return null;

          const ok = await verifyPassword(password, row.hashedPw);
          if (!ok) return null;

          return {
            id: row.id,
            email: row.email,
            role: row.role,
          };
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error("[auth] authorize failed:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (typeof token.role === "string")
        session.user.role = token.role as UserRole;
      return session;
    },
  },
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
