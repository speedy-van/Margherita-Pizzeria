import { AdminNewOrderEmail } from "@/emails/admin-new-order";
import { env, isDevelopment, isProduction } from "@/lib/env";
import { getSiteUrl } from "@/lib/resend/email-copy";
import { getMailerOrSkip } from "@/lib/resend/server";
import type { AdminNewOrderPayload, EmailSendResult } from "@/lib/resend/types";
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

export async function sendAdminNewOrderEmail(
  order: AdminNewOrderPayload["order"],
): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendAdminNewOrderEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(`[email] admin new-order skipped: ${mailer.reason}`);
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  const to = resolveAdminInbox();
  if (!to) {
    const reason = "ADMIN_NOTIFICATION_EMAIL not configured";
    if (isProduction) {
      // eslint-disable-next-line no-console
      console.error(`[email] sendAdminNewOrderEmail: ${reason}`);
      return { ok: false, error: reason };
    }
    // eslint-disable-next-line no-console
    console.warn(`[email] admin new-order skipped: ${reason}`);
    return { ok: true, skipped: true, reason };
  }

  const siteUrl = getSiteUrl();
  const reference = order.id.slice(0, 8).toUpperCase();
  const subject = `[${siteConfig.shortName}] New ${order.type} order ${reference}`;

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to,
      subject,
      react: AdminNewOrderEmail({ order, siteUrl }),
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(
        `[email] sendAdminNewOrderEmail: ${result.error.message}`,
      );
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendAdminNewOrderEmail: ${message}`);
    return { ok: false, error: message };
  }
}
