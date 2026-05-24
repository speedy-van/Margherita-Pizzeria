import { PasswordResetEmail } from "@/emails/password-reset";
import { getMailerOrSkip } from "@/lib/resend/server";
import type { EmailSendResult } from "@/lib/resend/types";
import { siteConfig } from "@/lib/config/site";
import { env } from "@/lib/env";

interface SendArgs {
  to: string;
  resetToken: string;
  expiresAt: Date;
}

function baseUrl(): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim() || siteConfig.url;
  return raw.replace(/\/+$/, "");
}

export async function sendPasswordResetEmail(
  args: SendArgs,
): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendPasswordResetEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(`[email] password reset skipped: ${mailer.reason}`);
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  const expiresInMinutes = Math.max(
    1,
    Math.round((args.expiresAt.getTime() - Date.now()) / 60_000),
  );
  const resetUrl = `${baseUrl()}/admin/reset-password?token=${encodeURIComponent(args.resetToken)}`;

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to: args.to,
      subject: `${siteConfig.shortName} admin password reset`,
      react: PasswordResetEmail({ resetUrl, expiresInMinutes }),
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(`[email] sendPasswordResetEmail: ${result.error.message}`);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, skipped: false, id: result.data?.id ?? null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[email] sendPasswordResetEmail threw: ${message}`);
    return { ok: false, error: message };
  }
}
