import type { CSSProperties, ReactElement } from "react";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailInfoRow } from "@/emails/components/EmailInfoRow";
import { EmailItemsTable } from "@/emails/components/EmailItemsTable";
import { EmailMoneyRow } from "@/emails/components/EmailMoneyRow";
import { EmailShell } from "@/emails/components/EmailShell";
import { emailBrand } from "@/emails/components/tokens";
import {
  formatShortReference,
  getOrderTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/resend/email-copy";
import type { AdminNewOrderPayload } from "@/lib/resend/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

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

export function AdminNewOrderEmail({
  order,
  siteUrl,
}: AdminNewOrderPayload): ReactElement {
  const base = siteUrl.replace(/\/+$/, "");
  const reference = formatShortReference(order.id, order.reference);
  const isDelivery = order.type === "delivery";
  const adminUrl = `${base}/admin/orders/${order.id}`;
  const trackUrl = `${base}/track/${order.id}`;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <EmailShell
      preview={`New ${order.type} order ${reference} — ${formatGBPFromPence(order.totalPence)}.`}
      title="New order received"
    >
      <p style={muted}>
        A new {getOrderTypeLabel(order.type).toLowerCase()} order has been
        placed. Reference{" "}
        <strong style={{ color: emailBrand.fg }}>{reference}</strong>.
      </p>

      <div style={panel}>
        <EmailInfoRow label="Reference" value={reference} />
        <EmailInfoRow label="Type" value={getOrderTypeLabel(order.type)} />
        <EmailInfoRow
          label="Payment"
          value={getPaymentMethodLabel(order.paymentMethod)}
        />
        {order.estimatedTime ? (
          <EmailInfoRow label="Estimated" value={order.estimatedTime} />
        ) : null}
        <EmailInfoRow label="Customer" value={order.customerName} />
        <EmailInfoRow label="Email" value={order.customerEmail} />
        <EmailInfoRow label="Phone" value={order.customerPhone} />
        {isDelivery && order.address ? (
          <EmailInfoRow label="Delivery to" value={order.address} />
        ) : null}
      </div>

      <div style={panel}>
        <EmailItemsTable items={items} />
        <div style={{ marginTop: "12px" }}>
          <EmailMoneyRow
            label="Subtotal"
            value={formatGBPFromPence(order.subtotalPence)}
          />
          {order.deliveryFeePence > 0 ? (
            <EmailMoneyRow
              label="Delivery fee"
              value={formatGBPFromPence(order.deliveryFeePence)}
            />
          ) : null}
          <EmailMoneyRow
            label="Total"
            value={formatGBPFromPence(order.totalPence)}
            emphasis
          />
        </div>
      </div>

      <p style={{ margin: "8px 0 0" }}>
        <EmailButton href={adminUrl}>Open in admin</EmailButton>
        {isDelivery ? (
          <EmailButton href={trackUrl} variant="secondary">
            Customer tracking
          </EmailButton>
        ) : null}
      </p>
    </EmailShell>
  );
}

export default AdminNewOrderEmail;
