import type { CSSProperties, ReactElement } from "react";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailShell } from "@/emails/components/EmailShell";
import { emailBrand } from "@/emails/components/tokens";
import { siteConfig } from "@/lib/config/site";
import type { ContactEmailPayload } from "@/lib/resend/types";

export type ContactMessageEmailProps = ContactEmailPayload;

const panel: CSSProperties = {
  backgroundColor: emailBrand.panel,
  border: `1px solid ${emailBrand.border}`,
  borderRadius: "12px",
  padding: "20px",
  margin: "16px 0",
};

const label: CSSProperties = {
  color: emailBrand.muted,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  margin: "0 0 4px",
};

const value: CSSProperties = {
  color: emailBrand.fg,
  fontSize: "14px",
  margin: "0 0 14px",
  lineHeight: 1.5,
};

const body: CSSProperties = {
  color: emailBrand.fg,
  fontSize: "14px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  margin: 0,
};

const meta: CSSProperties = {
  color: emailBrand.muted,
  fontSize: "12px",
  marginTop: "20px",
};

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ContactMessageEmail({
  name,
  email,
  subject,
  message,
  receivedAt,
}: ContactMessageEmailProps): ReactElement {
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    `Re: ${subject}`,
  )}`;

  return (
    <EmailShell
      preview={`New contact message from ${name}: ${subject}`}
      title="New contact message"
    >
      <div style={panel}>
        <p style={label}>From</p>
        <p style={value}>
          {name}
          <br />
          {email}
        </p>

        <p style={label}>Subject</p>
        <p style={value}>{subject}</p>

        <p style={label}>Message</p>
        <p style={body}>{message}</p>
      </div>

      <p style={{ margin: "8px 0 0" }}>
        <EmailButton href={mailto}>Reply</EmailButton>
      </p>

      <p style={meta}>
        Received {formatTimestamp(receivedAt)} · Source: {siteConfig.domain}/contact
      </p>
    </EmailShell>
  );
}

export default ContactMessageEmail;
