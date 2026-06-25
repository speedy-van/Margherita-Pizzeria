import type { CSSProperties, ReactElement } from "react";

import { EmailInfoRow } from "@/emails/components/EmailInfoRow";
import { EmailMoneyRow } from "@/emails/components/EmailMoneyRow";
import { EmailShell } from "@/emails/components/EmailShell";
import { emailBrand } from "@/emails/components/tokens";
import type { InvoiceDocumentModel } from "@/lib/invoices/model";
import { buildInvoiceTemplate } from "@/lib/invoices/template";

export interface InvoiceEmailProps {
  invoice: InvoiceDocumentModel;
}

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

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  color: emailBrand.fg,
};

const th: CSSProperties = {
  color: emailBrand.muted,
  fontWeight: 600,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  textAlign: "left",
  padding: "0 0 8px",
  borderBottom: `1px solid ${emailBrand.border}`,
};

const td: CSSProperties = {
  padding: "10px 0",
  borderBottom: `1px solid ${emailBrand.border}`,
  verticalAlign: "top",
};

export function InvoiceEmail({ invoice }: InvoiceEmailProps): ReactElement {
  const template = buildInvoiceTemplate(invoice);

  return (
    <EmailShell
      preview={template.preview}
      title={template.title}
    >
      {invoice.business.logoUrl ? (
        <img
          src={invoice.business.logoUrl}
          alt={`${invoice.business.name} logo`}
          width="64"
          height="64"
          style={{ display: "block", margin: "0 0 16px", borderRadius: "12px" }}
        />
      ) : null}

      <p style={muted}>
        {template.emailGreeting} {template.emailIntro}
      </p>

      <div style={panel}>
        {template.details.map((line) => (
          <EmailInfoRow
            key={line.label}
            label={line.label}
            value={line.value}
          />
        ))}
      </div>

      <div style={panel}>
        <table style={table} role="presentation" cellPadding={0} cellSpacing={0}>
          <thead>
            <tr>
              <th style={th}>Item</th>
              <th style={{ ...th, textAlign: "center", width: "52px" }}>Qty</th>
              <th style={{ ...th, textAlign: "right", width: "88px" }}>Unit</th>
              <th style={{ ...th, textAlign: "right", width: "88px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {template.items.length === 0 ? (
              <tr>
                <td style={td} colSpan={4}>
                  No invoice items
                </td>
              </tr>
            ) : (
              template.items.map((item) => (
                <tr key={item.id}>
                  <td style={td}>{item.name}</td>
                  <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ ...td, textAlign: "right" }}>{item.unitPrice}</td>
                  <td style={{ ...td, textAlign: "right" }}>{item.rowTotal}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ marginTop: "12px" }}>
          {template.totals.map((line) => (
            <EmailMoneyRow
              key={line.id}
              label={line.label}
              value={line.value}
              emphasis={line.emphasis}
            />
          ))}
        </div>
      </div>

      <p style={muted}>
        {template.attachmentNote} Thank you for choosing {invoice.business.shortName}.
      </p>
    </EmailShell>
  );
}

export default InvoiceEmail;
