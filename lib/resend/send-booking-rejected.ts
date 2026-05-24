import { BookingRejectedEmail } from "@/emails/booking-rejected";
import { siteConfig } from "@/lib/config/site";
import type { TableBooking } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/resend/email-copy";
import { getMailerOrSkip } from "@/lib/resend/server";
import type { EmailSendResult } from "@/lib/resend/types";

export async function sendBookingRejectedEmail(
  booking: TableBooking,
): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendBookingRejectedEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(
      `[email] booking ${booking.id.slice(0, 8)} rejection skipped: ${mailer.reason}`,
    );
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  const reference = booking.id.slice(0, 8).toUpperCase();
  const subject = `${siteConfig.name} — booking ${reference}`;
  const siteUrl = getSiteUrl();

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to: booking.customerEmail,
      subject,
      react: BookingRejectedEmail({ booking, siteUrl }),
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(
        `[email] sendBookingRejectedEmail: ${result.error.message}`,
      );
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendBookingRejectedEmail: ${message}`);
    return { ok: false, error: message };
  }
}
