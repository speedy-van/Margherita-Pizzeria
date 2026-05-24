import { NextResponse } from "next/server";
import { z } from "zod";

import { issuePasswordResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/resend/send-password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email().max(255) });

const GENERIC_OK = {
  ok: true as const,
  data: {
    message:
      "If that email is registered, a password reset link is on its way.",
  },
};

/**
 * Mobile-facing mirror of the web forgot-password endpoint. Same generic
 * response — never leaks whether the email is registered. The reset link
 * itself opens the web admin reset page (no app deep-link required).
 */
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
    return NextResponse.json(GENERIC_OK, { status: 200 });
  }

  try {
    const issued = await issuePasswordResetToken(parsed.data.email);
    if (issued) {
      try {
        await sendPasswordResetEmail({
          to: issued.email,
          resetToken: issued.token.rawToken,
          expiresAt: issued.token.expiresAt,
        });
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          "[api/mobile/admin/auth/forgot-password] mail send failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(
      "[api/mobile/admin/auth/forgot-password] issue failed:",
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json(GENERIC_OK, { status: 200 });
}
