import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { siteConfig } from "@/lib/config/site";
import type { TableBooking } from "@/lib/db/schema";
import { getSiteUrl } from "@/lib/resend/email-copy";
import { getMailerOrSkip } from "@/lib/resend/server";
import type { EmailSendResult } from "@/lib/resend/types";

export async function sendBookingConfirmationEmail(
  booking: TableBooking,
): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendBookingConfirmationEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(
      `[email] booking ${booking.id.slice(0, 8)} confirmation skipped: ${mailer.reason}`,
    );
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  const reference = booking.id.slice(0, 8).toUpperCase();
  const subject =
    booking.status === "confirmed"
      ? `${siteConfig.name} — booking ${reference} confirmed`
      : `${siteConfig.name} — booking ${reference} received`;
  const siteUrl = getSiteUrl();

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to: booking.customerEmail,
      subject,
      react: BookingConfirmationEmail({ booking, siteUrl }),
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(
        `[email] sendBookingConfirmationEmail: ${result.error.message}`,
      );
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendBookingConfirmationEmail: ${message}`);
    return { ok: false, error: message };
  }
}
