import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  consumeResetToken,
  findValidResetToken,
} from "@/lib/auth/password-reset";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(10).max(512),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON." } },
      { status: 400 },
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Token and password are required.",
        },
      },
      { status: 400 },
    );
  }
  const strength = validatePasswordStrength(parsed.data.password);
  if (!strength.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "WEAK_PASSWORD",
          message: strength.message,
          fields: { password: strength.message },
        },
      },
      { status: 400 },
    );
  }

  const target = await findValidResetToken(parsed.data.token);
  if (!target) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_TOKEN",
          message: "This reset link is invalid or has expired.",
        },
      },
      { status: 400 },
    );
  }

  const hashed = await hashPassword(parsed.data.password);
  const consumed = await consumeResetToken(parsed.data.token);
  if (!consumed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_TOKEN",
          message: "This reset link is invalid or has expired.",
        },
      },
      { status: 400 },
    );
  }
  await db
    .update(users)
    .set({ hashedPw: hashed })
    .where(eq(users.id, target.userId));

  return NextResponse.json({
    ok: true,
    data: {
      email: target.email,
      message: "Your password has been updated.",
    },
  });
}
