import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { env } from "@/lib/env";
import type { UserRole } from "@/types/database";

/**
 * Mobile admin JWT helpers.
 *
 * The Android admin app uses a stateless Bearer token instead of the
 * NextAuth cookie session. We reuse `NEXTAUTH_SECRET` so we do not introduce
 * a second secret to manage, but keep a dedicated issuer/audience so a
 * NextAuth cookie can never be mistaken for a mobile token.
 *
 * No password, token, or secret is ever logged from this module.
 */

const ISSUER = "margherita-admin-mobile";
const AUDIENCE = "margherita-admin-app";
const ALG = "HS256";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const ALLOWED_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  "admin",
  "staff",
]);

export interface MobileAdminClaims {
  userId: string;
  email: string;
  role: UserRole;
}

interface MobileAdminPayload extends JWTPayload {
  email: string;
  role: UserRole;
}

function getSecretKey(): Uint8Array {
  const secret = env.NEXTAUTH_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error("Mobile admin token secret is not configured.");
  }
  return new TextEncoder().encode(secret);
}

export async function signMobileAdminToken(
  claims: MobileAdminClaims,
): Promise<{ token: string; expiresAt: string }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;

  const token = await new SignJWT({
    email: claims.email,
    role: claims.role,
  })
    .setProtectedHeader({ alg: ALG, typ: "JWT" })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getSecretKey());

  return {
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export async function verifyMobileAdminToken(
  token: string,
): Promise<MobileAdminClaims | null> {
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) {
    return null;
  }
  try {
    const { payload } = await jwtVerify<MobileAdminPayload>(
      token,
      getSecretKey(),
      {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: [ALG],
      },
    );
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const role = payload.role;
    if (!userId || !email || !role || !ALLOWED_ROLES.has(role)) return null;
    return { userId, email, role };
  } catch {
    // Do not log the token, error, or any of the payload.
    return null;
  }
}

/**
 * Read a Bearer token from a request `Authorization` header.
 * Returns the raw token string or `null` if missing/malformed.
 */
export function readBearerToken(
  authorizationHeader: string | null | undefined,
): string | null {
  if (!authorizationHeader) return null;
  const trimmed = authorizationHeader.trim();
  if (trimmed.length === 0 || trimmed.length > 4200) return null;
  const match = /^Bearer\s+([A-Za-z0-9._~+/=-]+)\s*$/.exec(trimmed);
  if (!match) return null;
  return match[1] ?? null;
}
