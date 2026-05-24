import type { CSSProperties, ReactElement } from "react";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailInfoRow } from "@/emails/components/EmailInfoRow";
import { EmailShell } from "@/emails/components/EmailShell";
import { emailBrand } from "@/emails/components/tokens";
import { siteConfig } from "@/lib/config/site";
import {
  formatEmailDate,
  formatEmailTime,
  formatShortReference,
  getBookingStatusMessage,
} from "@/lib/resend/email-copy";
import type { BookingEmailPayload } from "@/lib/resend/types";
import type { BookingStatus } from "@/types/database";

export type BookingConfirmationEmailProps = BookingEmailPayload;

const panel: CSSProperties = {
  backgroundColor: emailBrand.panel,
  border: `1px solid ${emailBrand.border}`,
  borderRadius: "12px",
  padding: "20px",
  margin: "20px 0",
};

const muted: CSSProperties = {
  color: emailBrand.muted,
  fontSize: "14px",
  lineHeight: 1.6,
  margin: "0 0 12px",
};

export function BookingConfirmationEmail({
  booking,
  siteUrl,
}: BookingConfirmationEmailProps): ReactElement {
  const base = siteUrl.replace(/\/+$/, "");
  const successUrl = `${base}/book/success?bookingId=${booking.id}`;
  const status = booking.status as BookingStatus;
  const reference = formatShortReference(booking.id, booking.reference);
  const isConfirmed = status === "confirmed";
  const intro = getBookingStatusMessage(status, booking.depositPaid);
  const title = isConfirmed
    ? "Your table is confirmed"
    : "Booking request received";
  const preview = isConfirmed
    ? `Table confirmed for ${formatEmailDate(booking.date)} at ${formatEmailTime(booking.timeSlot)}.`
    : `We've received your booking request for ${formatEmailDate(booking.date)}.`;

  return (
    <EmailShell preview={preview} title={title}>
      <p style={muted}>
        Hi {booking.customerName} — {intro} Your reference is{" "}
        <strong style={{ color: emailBrand.fg }}>{reference}</strong>.
      </p>

      <div style={panel}>
        <EmailInfoRow label="Reference" value={reference} />
        <EmailInfoRow label="Date" value={formatEmailDate(booking.date)} />
        <EmailInfoRow label="Time" value={formatEmailTime(booking.timeSlot)} />
        <EmailInfoRow label="Covers" value={booking.covers} />
        <EmailInfoRow
          label="Deposit"
          value={booking.depositPaid ? "Paid" : "Not required"}
        />
        <EmailInfoRow label="Dining at" value={siteConfig.address} />
      </div>

      <p style={muted}>
        We&apos;ll assign a specific table on the night based on covers and
        timing.
      </p>

      <p style={{ margin: "8px 0 0" }}>
        <EmailButton href={successUrl}>View booking</EmailButton>
      </p>
    </EmailShell>
  );
}

export default BookingConfirmationEmail;
