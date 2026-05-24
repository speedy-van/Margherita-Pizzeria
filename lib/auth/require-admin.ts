import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  readBearerToken,
  verifyMobileAdminToken,
} from "@/lib/auth/mobile-token";
import { requireAdminSession } from "@/lib/auth/session";
import { isProduction } from "@/lib/env";
import type { UserRole } from "@/types/database";

/**
 * Admin guard for API mutation routes.
 *
 * Resolution order:
 *   1. NextAuth session cookie (web admin).
 *   2. `Authorization: Bearer <jwt>` token (Android admin app, Phase 10).
 *   3. Dev-only `x-dev-admin: true` header — non-production only.
 *
 * Returns either `{ ok: true, userId, role, email? }` or a ready-to-return
 * `Response` with the correct status code and `{ ok: false, error }` body.
 */

export type RequireAdminResult =
  | { ok: true; userId: string; role: UserRole | "dev"; email?: string }
  | { ok: false; response: Response };

const UNAUTHORIZED_BODY = {
  ok: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Admin authentication is required.",
  },
} as const;

export async function requireAdmin(): Promise<RequireAdminResult> {
  // 1. NextAuth session (web).
  const session = await requireAdminSession();
  if (session.ok) {
    return {
      ok: true,
      userId: session.user.id,
      role: session.user.role,
      email: session.user.email,
    };
  }

  const hdrs = await headers();

  // 2. Mobile Bearer token (Android admin app).
  const bearer = readBearerToken(hdrs.get("authorization"));
  if (bearer) {
    const claims = await verifyMobileAdminToken(bearer);
    if (claims) {
      return {
        ok: true,
        userId: claims.userId,
        role: claims.role,
        email: claims.email,
      };
    }
    // Bearer was provided but invalid/expired — return 401 immediately so
    // a stale token cannot silently fall through to the dev-header path.
    return {
      ok: false,
      response: NextResponse.json(UNAUTHORIZED_BODY, { status: 401 }),
    };
  }

  // 3. Dev-only fallback. Never honoured in production.
  if (!isProduction) {
    const devAdmin = hdrs.get("x-dev-admin");
    if (devAdmin === "true") {
      return { ok: true, userId: "dev-admin", role: "dev" };
    }
  }

  if (session.response instanceof Response) {
    return { ok: false, response: session.response };
  }
  return {
    ok: false,
    response: NextResponse.json(UNAUTHORIZED_BODY, { status: 401 }),
  };
}
