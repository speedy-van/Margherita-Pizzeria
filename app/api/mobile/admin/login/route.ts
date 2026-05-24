import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { signMobileAdminToken } from "@/lib/auth/mobile-token";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { UserRole } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  "admin",
  "staff",
]);

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(200),
});

const INVALID_CREDENTIALS_BODY = {
  ok: false,
  error: {
    code: "INVALID_CREDENTIALS",
    message: "Email or password is incorrect.",
  },
} as const;

export async function POST(request: Request): Promise<Response> {
  let parsed: z.infer<typeof bodySchema>;
  try {
    const raw: unknown = await request.json();
    parsed = bodySchema.parse(raw);
  } catch {
    // Generic 401 — no enumeration about which field was bad.
    return NextResponse.json(INVALID_CREDENTIALS_BODY, { status: 401 });
  }

  try {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        hashedPw: users.hashedPw,
      })
      .from(users)
      .where(eq(users.email, parsed.email))
      .limit(1);

    if (!row || !row.hashedPw || !ALLOWED_ROLES.has(row.role)) {
      return NextResponse.json(INVALID_CREDENTIALS_BODY, { status: 401 });
    }

    const ok = await verifyPassword(parsed.password, row.hashedPw);
    if (!ok) {
      return NextResponse.json(INVALID_CREDENTIALS_BODY, { status: 401 });
    }

    const { token, expiresAt } = await signMobileAdminToken({
      userId: row.id,
      email: row.email,
      role: row.role,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          token,
          expiresAt,
          user: {
            id: row.id,
            email: row.email,
            role: row.role,
          },
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/mobile/admin/login] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "LOGIN_FAILED",
          message: "Could not sign in right now. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
