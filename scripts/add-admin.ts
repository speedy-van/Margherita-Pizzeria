/**
 * One-off admin creation / promotion script.
 *
 * Run with: npx tsx scripts/add-admin.ts
 *
 * Reads credentials from environment variables (never hardcoded):
 *   - ADMIN_SEED_EMAIL    (required)
 *   - ADMIN_SEED_PASSWORD (required)
 *
 * Idempotent: if the email already exists the role is promoted to "admin"
 * and the password hash is rotated. Otherwise a new admin user is created.
 *
 * Note: `npm run db:seed` already performs the same bootstrap when the
 * ADMIN_SEED_* vars are present. This script exists as a focused one-off
 * for rotating the admin password without re-running the full data seed.
 */

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { env } from "@/lib/env";

async function main() {
  const email = env.ADMIN_SEED_EMAIL.trim().toLowerCase();
  const password = env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must both be set in the environment.",
    );
  }

  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    throw new Error(`Password rejected: ${strength.message}`);
  }

  const hashedPw = await hashPassword(password);

  const existing = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ role: "admin", hashedPw })
      .where(eq(users.email, email));
    console.log(`Updated existing user ${email} -> role=admin, password rotated.`);
    return;
  }

  const inserted = await db
    .insert(users)
    .values({ email, role: "admin", hashedPw })
    .returning({ id: users.id });

  const created = inserted[0];
  if (!created) {
    throw new Error("Failed to insert admin user (no row returned).");
  }

  console.log(`Created admin ${email} (id=${created.id}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
