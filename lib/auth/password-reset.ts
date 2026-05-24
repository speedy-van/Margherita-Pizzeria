import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, gt } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";

const TOKEN_BYTES = 32; // 256-bit
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface IssuedResetToken {
  /** Raw token to embed in the reset URL. Never store this. */
  rawToken: string;
  expiresAt: Date;
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Issue a password reset token for the given email if the user exists.
 * Returns the token + expiry, or null if the user does not exist.
 * Callers MUST respond with a generic message either way to avoid leaking
 * which addresses are registered.
 */
export async function issuePasswordResetToken(
  email: string,
): Promise<{ userId: string; email: string; token: IssuedResetToken } | null> {
  const lower = email.trim().toLowerCase();
  if (!lower) return null;
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, lower))
    .limit(1);
  if (!user) return null;

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    userId: user.id,
    email: user.email,
    token: { rawToken, expiresAt },
  };
}

export interface ConsumedResetToken {
  userId: string;
  email: string;
}

/**
 * Look up an unused, unexpired token by raw value. Does NOT mark used.
 * Use `consumeResetToken` after the new password has been hashed.
 */
export async function findValidResetToken(
  rawToken: string,
): Promise<ConsumedResetToken | null> {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const [row] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      email: users.email,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);
  if (!row) return null;
  return { userId: row.userId, email: row.email };
}

/**
 * Atomically mark the token used. Returns true if it was previously unused.
 */
export async function consumeResetToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const result = await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .returning({ id: passwordResetTokens.id });
  return result.length > 0;
}
