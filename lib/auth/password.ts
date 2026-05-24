import { compare, hash } from "bcryptjs";

/**
 * Password helpers for admin/staff accounts.
 *
 * - bcrypt cost factor 12 (good balance for serverless workloads)
 * - Minimum 10 characters, at least one letter and one number
 * - Hashes are stored on `users.hashedPw` (nullable on schema; required for login)
 */

const BCRYPT_ROUNDS = 12;
const MIN_LENGTH = 10;

export type PasswordStrengthResult =
  | { ok: true }
  | { ok: false; message: string };

export function validatePasswordStrength(
  password: string,
): PasswordStrengthResult {
  if (typeof password !== "string") {
    return { ok: false, message: "Password must be a string." };
  }
  if (password.length < MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_LENGTH} characters long.`,
    };
  }
  if (password.length > 200) {
    return { ok: false, message: "Password is too long." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { ok: false, message: "Password must contain at least one letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: "Password must contain at least one number." };
  }
  return { ok: true };
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashed: string,
): Promise<boolean> {
  if (!password || !hashed) return false;
  try {
    return await compare(password, hashed);
  } catch {
    return false;
  }
}
