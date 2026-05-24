import type { CSSProperties, ReactElement } from "react";

import { EmailButton } from "@/emails/components/EmailButton";
import { EmailInfoRow } from "@/emails/components/EmailInfoRow";
import { EmailItemsTable } from "@/emails/components/EmailItemsTable";
import { EmailMoneyRow } from "@/emails/components/EmailMoneyRow";
import { EmailShell } from "@/emails/components/EmailShell";
import { emailBrand } from "@/emails/components/tokens";
import { siteConfig } from "@/lib/config/site";
import {
  formatShortReference,
  getOrderStatusMessage,
  getOrderTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/resend/email-copy";
import type { OrderEmailPayload } from "@/lib/resend/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export type OrderConfirmationEmailProps = OrderEmailPayload;

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

export function OrderConfirmationEmail({
  order,
  siteUrl,
}: OrderConfirmationEmailProps): ReactElement {
  const base = siteUrl.replace(/\/+$/, "");
  const reference = formatShortReference(order.id, order.reference);
  const isDelivery = order.type === "delivery";
  const successUrl = `${base}/order/success?orderId=${order.id}`;
  const trackUrl = `${base}/track/${order.id}`;
  const items = Array.isArray(order.items) ? order.items : [];
  const statusMessage = getOrderStatusMessage(order.status);

  return (
    <EmailShell
      preview={`Order ${reference} confirmed${
        order.estimatedTime ? ` — ${order.estimatedTime.toLowerCase()}` : ""
      }.`}
      title={isDelivery ? "Order on the way" : "Order received"}
    >
      <p style={muted}>
        Thanks {order.customerName} — {statusMessage} Your reference is{" "}
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
        {isDelivery && order.address ? (
          <EmailInfoRow label="Delivery to" value={order.address} />
        ) : (
          <EmailInfoRow label="Collect from" value={siteConfig.address} />
        )}
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

      <p style={muted}>
        Times are estimates and may shift slightly during busy periods.
      </p>

      <p style={{ margin: "8px 0 0" }}>
        {isDelivery ? (
          <>
            <EmailButton href={trackUrl}>Track delivery</EmailButton>
            <EmailButton href={successUrl} variant="secondary">
              View order
            </EmailButton>
          </>
        ) : (
          <EmailButton href={successUrl}>View order</EmailButton>
        )}
      </p>
    </EmailShell>
  );
}

export default OrderConfirmationEmail;
