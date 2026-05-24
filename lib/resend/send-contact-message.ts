import { ContactMessageEmail } from "@/emails/contact-message";
import { siteConfig } from "@/lib/config/site";
import { env, isDevelopment, isProduction } from "@/lib/env";
import { getMailerOrSkip } from "@/lib/resend/server";
import type { EmailSendResult } from "@/lib/resend/types";
import type { ContactMessageInput } from "@/lib/validations/contact";

/**
 * Resolve the inbox that should receive contact messages.
 *
 * Order of preference:
 *  1. CONTACT_TO_EMAIL if explicitly set.
 *  2. ADMIN_NOTIFICATION_EMAIL if set.
 *  3. RESEND_FROM_EMAIL as a development-only fallback.
 */
function resolveContactInbox(): string | null {
  const explicit = env.CONTACT_TO_EMAIL.trim();
  if (explicit) return explicit;
  const admin = env.ADMIN_NOTIFICATION_EMAIL.trim();
  if (admin) return admin;
  if (isDevelopment) {
    const from = env.RESEND_FROM_EMAIL.trim();
    return from || null;
  }
  return null;
}

export async function sendContactMessageEmail(
  input: ContactMessageInput,
): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendContactMessageEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(`[email] contact message skipped: ${mailer.reason}`);
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  const to = resolveContactInbox();
  if (!to) {
    const reason =
      "No contact recipient configured (set CONTACT_TO_EMAIL, ADMIN_NOTIFICATION_EMAIL, or RESEND_FROM_EMAIL)";
    if (isProduction) {
      // eslint-disable-next-line no-console
      console.error(`[email] sendContactMessageEmail: ${reason}`);
      return { ok: false, error: reason };
    }
    // eslint-disable-next-line no-console
    console.warn(`[email] contact message skipped: ${reason}`);
    return { ok: true, skipped: true, reason };
  }

  const receivedAt = new Date();
  const subject = `[${siteConfig.shortName}] Contact: ${input.subject}`;

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to,
      replyTo: input.email,
      subject,
      react: ContactMessageEmail({
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        receivedAt,
      }),
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(
        `[email] sendContactMessageEmail: ${result.error.message}`,
      );
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendContactMessageEmail: ${message}`);
    return { ok: false, error: message };
  }
}
