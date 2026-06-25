import * as Print from "expo-print";

import type { AdminOrderDetail, InvoiceDocumentModel, OrderItemSnapshot } from "@/api/types";
import { formatCurrencyGBP, inferPaymentStatus } from "@/lib/order-operations";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function itemMetaLines(item: OrderItemSnapshot): string[] {
  const raw = item as unknown as Record<string, unknown>;
  const lines: string[] = [];
  const notes = raw.notes ?? raw.note;
  if (typeof notes === "string" && notes.trim()) lines.push(`Note: ${notes.trim()}`);
  for (const key of ["modifiers", "options"]) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      lines.push(value.trim());
    } else {
      const entries = unknownArray(value)
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && "name" in entry) {
            return String((entry as { name?: unknown }).name ?? "");
          }
          return "";
        })
        .filter(Boolean);
      if (entries.length > 0) lines.push(entries.join(", "));
    }
  }
  return lines;
}

function baseHtml(title: string, body: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; margin: 24px; }
    h1 { font-size: 28px; margin: 0 0 6px; }
    h2 { font-size: 18px; margin: 22px 0 8px; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
    .muted { color: #4b5563; }
    .row { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; }
    .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .item-name { font-weight: 700; font-size: 17px; }
    .meta { color: #4b5563; font-size: 13px; margin-top: 3px; }
    .total { font-weight: 800; font-size: 20px; border-top: 2px solid #111827; margin-top: 8px; padding-top: 10px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

export function buildKitchenTicketHtml(order: AdminOrderDetail): string {
  const ref = order.reference ?? order.id.slice(0, 8);
  const items = order.items
    .map((item) => {
      const meta = itemMetaLines(item)
        .map((line) => `<div class="meta">${escapeHtml(line)}</div>`)
        .join("");
      return `<div class="item"><div class="item-name">${item.quantity} x ${escapeHtml(
        item.name,
      )}</div>${meta}</div>`;
    })
    .join("");
  return baseHtml(
    `Kitchen ${ref}`,
    `<h1>Kitchen ticket</h1>
    <div class="muted">Order ${escapeHtml(ref)} · ${escapeHtml(order.type)} · ${escapeHtml(
      new Date(order.createdAt).toLocaleString("en-GB"),
    )}</div>
    <h2>Items</h2>
    ${items || '<p class="muted">No items on this order.</p>'}`,
  );
}

export function buildCustomerReceiptHtml({
  order,
  invoice,
}: {
  order: AdminOrderDetail;
  invoice?: InvoiceDocumentModel | null;
}): string {
  const ref = order.reference ?? order.id.slice(0, 8);
  const payment = inferPaymentStatus(order);
  const business = invoice?.business.name ? `<h1>${escapeHtml(invoice.business.name)}</h1>` : "<h1>Receipt</h1>";
  const items = order.items
    .map(
      (item) =>
        `<div class="row"><span>${item.quantity} x ${escapeHtml(
          item.name,
        )}</span><strong>${formatCurrencyGBP(item.totalPence)}</strong></div>`,
    )
    .join("");
  return baseHtml(
    `Receipt ${ref}`,
    `${business}
    <div class="muted">Order ${escapeHtml(ref)} · ${escapeHtml(
      new Date(order.createdAt).toLocaleString("en-GB"),
    )}</div>
    <h2>Items</h2>
    ${items || '<p class="muted">No items on this order.</p>'}
    <h2>Totals</h2>
    <div class="row"><span>Subtotal</span><strong>${formatCurrencyGBP(order.subtotalPence)}</strong></div>
    <div class="row"><span>Delivery</span><strong>${formatCurrencyGBP(order.deliveryFeePence)}</strong></div>
    ${
      order.discountPence > 0
        ? `<div class="row"><span>Discount${
            order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""
          }</span><strong>-${formatCurrencyGBP(order.discountPence)}</strong></div>`
        : ""
    }
    <div class="row total"><span>Total</span><span>${formatCurrencyGBP(order.totalPence)}</span></div>
    <p class="muted">Payment: ${escapeHtml(payment.label)}</p>`,
  );
}

export async function printKitchenTicket(order: AdminOrderDetail): Promise<void> {
  await Print.printAsync({ html: buildKitchenTicketHtml(order) });
}

export async function printCustomerReceipt(options: {
  order: AdminOrderDetail;
  invoice?: InvoiceDocumentModel | null;
}): Promise<void> {
  await Print.printAsync({ html: buildCustomerReceiptHtml(options) });
}
