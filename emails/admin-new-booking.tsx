import type { CSSProperties, ReactElement } from "react";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailInfoRow } from "@/emails/components/EmailInfoRow";
import { EmailShell } from "@/emails/components/EmailShell";
import { emailBrand } from "@/emails/components/tokens";
import {
  formatEmailDate,
  formatEmailTime,
  formatShortReference,
} from "@/lib/resend/email-copy";
import type { AdminNewBookingPayload } from "@/lib/resend/types";

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

export function AdminNewBookingEmail({
  booking,
  siteUrl,
}: AdminNewBookingPayload): ReactElement {
  const base = siteUrl.replace(/\/+$/, "");
  const reference = formatShortReference(booking.id, booking.reference);
  const adminUrl = `${base}/admin/bookings/${booking.id}`;

  return (
    <EmailShell
      preview={`New booking request from ${booking.customerName} for ${formatEmailDate(booking.date)}.`}
      title="New booking request"
    >
      <p style={muted}>
        A new booking request has been received. Reference{" "}
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
        <EmailInfoRow label="Customer" value={booking.customerName} />
        <EmailInfoRow label="Email" value={booking.customerEmail} />
        <EmailInfoRow label="Phone" value={booking.customerPhone} />
      </div>

      <p style={{ margin: "8px 0 0" }}>
        <EmailButton href={adminUrl}>Open in admin</EmailButton>
      </p>
    </EmailShell>
  );
}

export default AdminNewBookingEmail;
