import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import type { UserRole } from "@/types/database";

/**
 * Server-side helpers for reading the current admin session.
 *
 * Use `getCurrentAdminSession()` from server components.
 * Use `requireAdminSession()` from API route handlers — it returns either
 * `{ ok: true, user }` or `{ ok: false, response }` ready to return.
 */

export interface AdminSessionUser {
  id: string;
  email: string;
  role: UserRole;
}

const ALLOWED: ReadonlySet<UserRole> = new Set<UserRole>(["admin", "staff"]);

const UNAUTHORIZED_BODY = {
  ok: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Admin authentication is required.",
  },
} as const;

const FORBIDDEN_BODY = {
  ok: false,
  error: {
    code: "FORBIDDEN",
    message: "This account does not have admin access.",
  },
} as const;

export async function getCurrentAdminSession(): Promise<AdminSessionUser | null> {
  try {
    const session = await auth();
    if (!session || !session.user) return null;
    const email = session.user.email ?? null;
    const role = session.user.role;
    const id = session.user.id;
    if (!id || !email || !role) return null;
    if (!ALLOWED.has(role)) return null;
    return { id, email, role };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[auth/session] failed to read session:", err);
    return null;
  }
}

export type RequireAdminSessionResult =
  | { ok: true; user: AdminSessionUser }
  | { ok: false; response: Response };

export async function requireAdminSession(): Promise<RequireAdminSessionResult> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return {
        ok: false,
        response: NextResponse.json(UNAUTHORIZED_BODY, { status: 401 }),
      };
    }
    const role = session.user.role;
    if (!role || !ALLOWED.has(role)) {
      return {
        ok: false,
        response: NextResponse.json(FORBIDDEN_BODY, { status: 403 }),
      };
    }
    const email = session.user.email;
    if (!email) {
      return {
        ok: false,
        response: NextResponse.json(UNAUTHORIZED_BODY, { status: 401 }),
      };
    }
    return {
      ok: true,
      user: { id: session.user.id, email, role },
    };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[auth/session] requireAdminSession failed:", err);
    return {
      ok: false,
      response: NextResponse.json(UNAUTHORIZED_BODY, { status: 401 }),
    };
  }
}
