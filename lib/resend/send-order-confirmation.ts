import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { siteConfig } from "@/lib/config/site";
import type { Order } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/resend/email-copy";
import { getMailerOrSkip } from "@/lib/resend/server";
import type { EmailSendResult } from "@/lib/resend/types";

export async function sendOrderConfirmationEmail(
  order: Order,
): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendOrderConfirmationEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(
      `[email] order ${order.id.slice(0, 8)} skipped: ${mailer.reason}`,
    );
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  const reference = order.id.slice(0, 8).toUpperCase();
  const subject = `${siteConfig.name} — order ${reference} confirmed`;
  const siteUrl = getSiteUrl();

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to: order.customerEmail,
      subject,
      react: OrderConfirmationEmail({ order, siteUrl }),
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(
        `[email] sendOrderConfirmationEmail: ${result.error.message}`,
      );
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendOrderConfirmationEmail: ${message}`);
    return { ok: false, error: message };
  }
}
