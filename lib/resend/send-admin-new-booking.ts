import { AdminNewBookingEmail } from "@/emails/admin-new-booking";
import { env, isDevelopment, isProduction } from "@/lib/env";
import { getSiteUrl } from "@/lib/resend/email-copy";
import { getMailerOrSkip } from "@/lib/resend/server";
import type {
  AdminNewBookingPayload,
  EmailSendResult,
} from "@/lib/resend/types";
import { siteConfig } from "@/lib/config/site";

function resolveAdminInbox(): string | null {
  const admin = env.ADMIN_NOTIFICATION_EMAIL.trim();
  if (admin) return admin;
  if (isDevelopment) {
    const from = env.RESEND_FROM_EMAIL.trim();
    return from || null;
  }
  return null;
}

export async function sendAdminNewBookingEmail(
  booking: AdminNewBookingPayload["booking"],
): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendAdminNewBookingEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(`[email] admin new-booking skipped: ${mailer.reason}`);
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  const to = resolveAdminInbox();
  if (!to) {
    const reason = "ADMIN_NOTIFICATION_EMAIL not configured";
    if (isProduction) {
      // eslint-disable-next-line no-console
      console.error(`[email] sendAdminNewBookingEmail: ${reason}`);
      return { ok: false, error: reason };
    }
    // eslint-disable-next-line no-console
    console.warn(`[email] admin new-booking skipped: ${reason}`);
    return { ok: true, skipped: true, reason };
  }

  const siteUrl = getSiteUrl();
  const reference = booking.id.slice(0, 8).toUpperCase();
  const subject = `[${siteConfig.shortName}] New booking request ${reference}`;

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to,
      subject,
      react: AdminNewBookingEmail({ booking, siteUrl }),
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(
        `[email] sendAdminNewBookingEmail: ${result.error.message}`,
      );
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendAdminNewBookingEmail: ${message}`);
    return { ok: false, error: message };
  }
}
