import type { CSSProperties, ReactElement } from "react";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailInfoRow } from "@/emails/components/EmailInfoRow";
import { EmailShell } from "@/emails/components/EmailShell";
import { emailBrand } from "@/emails/components/tokens";
import {
  formatEmailDate,
  formatEmailTime,
} from "@/lib/resend/email-copy";
import type { BookingEmailPayload } from "@/lib/resend/types";

export type BookingRejectedEmailProps = BookingEmailPayload;

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

export function BookingRejectedEmail({
  booking,
  siteUrl,
}: BookingRejectedEmailProps): ReactElement {
  const base = siteUrl.replace(/\/+$/, "");
  const bookUrl = `${base}/book`;

  return (
    <EmailShell
      preview={`We couldn't accept your booking for ${formatEmailDate(booking.date)}.`}
      title="Booking not available"
    >
      <p style={muted}>
        Hi {booking.customerName} — unfortunately we&apos;re unable to accept
        your booking request for the time below. We&apos;re sorry for the
        inconvenience.
      </p>

      <div style={panel}>
        <EmailInfoRow label="Date" value={formatEmailDate(booking.date)} />
        <EmailInfoRow label="Time" value={formatEmailTime(booking.timeSlot)} />
        <EmailInfoRow label="Covers" value={booking.covers} />
      </div>

      <p style={muted}>
        You&apos;re welcome to try a different date or time — our small dining
        room books up quickly.
      </p>

      <p style={{ margin: "8px 0 0" }}>
        <EmailButton href={bookUrl}>Try another time</EmailButton>
      </p>
    </EmailShell>
  );
}

export default BookingRejectedEmail;
