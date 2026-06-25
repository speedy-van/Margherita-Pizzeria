import type {
  InvoiceDocumentModel,
  InvoiceStatusModel,
  InvoiceTotalLineModel,
} from "@/lib/invoices/model";

export interface InvoiceTemplateInfoLine {
  label: string;
  value: string;
}

export interface InvoiceTemplateItemLine {
  id: string;
  name: string;
  quantity: string;
  unitPrice: string;
  rowTotal: string;
}

export interface InvoiceTemplateTotalLine {
  id: InvoiceTotalLineModel["key"];
  label: string;
  value: string;
  amountPence: number;
  emphasis: boolean;
}

export interface InvoiceTemplate {
  title: string;
  preview: string;
  emailGreeting: string;
  emailIntro: string;
  attachmentNote: string;
  businessContactLines: string[];
  customerLines: string[];
  details: InvoiceTemplateInfoLine[];
  statusBadges: InvoiceStatusModel[];
  items: InvoiceTemplateItemLine[];
  totals: InvoiceTemplateTotalLine[];
  footerMessage: string;
}

function present(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function buildInvoiceTemplate(
  invoice: InvoiceDocumentModel,
): InvoiceTemplate {
  const deliveryLine =
    invoice.deliveryFee.amountPence > 0 ? invoice.deliveryFee : null;
  const totalLines = [
    invoice.subtotal,
    deliveryLine,
    invoice.discount,
    invoice.total,
  ].filter((line): line is InvoiceTotalLineModel => Boolean(line));

  return {
    title: `Invoice ${invoice.invoiceNumber}`,
    preview: `Invoice ${invoice.invoiceNumber} for order ${invoice.orderReference}.`,
    emailGreeting: `Hi ${invoice.customer.name},`,
    emailIntro: `Please find your invoice for order ${invoice.orderReference}. The invoice total is ${invoice.total.value}.`,
    attachmentNote: "The PDF invoice is attached to this email for your records.",
    businessContactLines: [
      invoice.business.address,
      invoice.business.phone,
      invoice.business.email,
      invoice.business.url,
    ].filter(present),
    customerLines: [
      invoice.customer.name,
      invoice.customer.email,
      invoice.customer.phone,
      invoice.customer.address,
    ].filter(present),
    details: [
      { label: "Invoice number", value: invoice.invoiceNumber },
      { label: "Order reference", value: invoice.orderReference },
      { label: "Issue date", value: invoice.issueDate },
      { label: "Fulfilment", value: invoice.fulfilmentType },
      { label: "Payment method", value: invoice.paymentMethod },
      { label: "Payment status", value: invoice.paymentStatus.label },
      { label: "Order status", value: invoice.orderStatus.label },
    ],
    statusBadges: [invoice.paymentStatus, invoice.orderStatus],
    items: invoice.items.map((item) => ({
      id: item.lineId,
      name: item.name,
      quantity: String(item.quantity),
      unitPrice: item.unitPrice,
      rowTotal: item.rowTotal,
    })),
    totals: totalLines.map((line) => ({
      id: line.key,
      label: line.label,
      value: line.value,
      amountPence: line.amountPence,
      emphasis: line.key === "total",
    })),
    footerMessage: invoice.footerMessage,
  };
}
