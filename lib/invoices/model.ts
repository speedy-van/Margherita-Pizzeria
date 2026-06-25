import { contactDetails, restaurantLocation, siteConfig } from "@/lib/config/site";
import {
  buildAbsoluteUrl,
  formatEmailDate,
  formatShortReference,
  getOrderTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/resend/email-copy";
import { formatGBPFromPence } from "@/lib/utils/currency";
import type {
  OrderItemSnapshot,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@/types/database";

export interface InvoiceOrderSource {
  id: string;
  reference: string | null;
  type: OrderType;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string | null;
  items: OrderItemSnapshot[];
  subtotalPence: number;
  deliveryFeePence: number;
  discountPence: number;
  discountCode: string | null;
  totalPence: number;
  paymentMethod: PaymentMethod;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface InvoiceBusinessModel {
  name: string;
  shortName: string;
  email: string;
  phone: string;
  address: string;
  url: string;
  logoUrl: string;
}

export interface InvoiceCustomerModel {
  name: string;
  email: string;
  phone: string;
  address: string | null;
}

export interface InvoiceItemModel {
  lineId: string;
  name: string;
  quantity: number;
  unitPricePence: number;
  rowTotalPence: number;
  unitPrice: string;
  rowTotal: string;
}

export interface InvoiceTotalLineModel {
  key: "subtotal" | "delivery" | "discount" | "total";
  label: string;
  amountPence: number;
  value: string;
}

export type InvoiceStatusTone =
  | "paid"
  | "unpaid"
  | "delivered"
  | "cancelled"
  | "in_progress";

export interface InvoiceStatusModel {
  label: string;
  tone: InvoiceStatusTone;
}

export interface InvoiceDocumentModel {
  id: string;
  invoiceNumber: string;
  fileName: string;
  orderReference: string;
  issueDate: string;
  issuedAt: string;
  fulfilmentType: string;
  paymentMethod: string;
  paymentStatus: InvoiceStatusModel;
  orderStatus: InvoiceStatusModel;
  business: InvoiceBusinessModel;
  customer: InvoiceCustomerModel;
  items: InvoiceItemModel[];
  subtotal: InvoiceTotalLineModel;
  deliveryFee: InvoiceTotalLineModel;
  discount: InvoiceTotalLineModel | null;
  total: InvoiceTotalLineModel;
  footerMessage: string;
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function asIso(value: Date | string): string {
  const date = asDate(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function safeFilename(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-");
}

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending_payment":
      return "Awaiting payment";
    case "received":
      return "Received";
    case "making":
      return "Making";
    case "ready":
      return "Ready";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "rejected":
      return "Rejected";
  }
}

function orderStatus(status: OrderStatus): InvoiceStatusModel {
  if (status === "pending_payment") return { label: "Unpaid", tone: "unpaid" };
  if (status === "delivered") return { label: "Delivered", tone: "delivered" };
  if (status === "cancelled" || status === "rejected") {
    return { label: statusLabel(status), tone: "cancelled" };
  }
  return { label: statusLabel(status), tone: "in_progress" };
}

function paymentStatus(
  paymentMethod: PaymentMethod,
  status: OrderStatus,
): InvoiceStatusModel {
  if (status === "pending_payment") return { label: "Unpaid", tone: "unpaid" };
  if (status === "cancelled" || status === "rejected") {
    return { label: "Cancelled", tone: "cancelled" };
  }
  if (paymentMethod === "stripe_card") return { label: "Paid", tone: "paid" };
  return { label: "Pay on collection/delivery", tone: "in_progress" };
}

export function buildInvoiceDocument(
  order: InvoiceOrderSource,
): InvoiceDocumentModel {
  const reference = formatShortReference(order.id, order.reference);
  const invoiceNumber = `INV-${reference}`;
  const items = Array.isArray(order.items) ? order.items : [];
  const issueDate = formatEmailDate(order.createdAt);

  const subtotal: InvoiceTotalLineModel = {
    key: "subtotal",
    label: "Subtotal",
    amountPence: order.subtotalPence,
    value: formatGBPFromPence(order.subtotalPence),
  };
  const deliveryFee: InvoiceTotalLineModel = {
    key: "delivery",
    label: "Delivery fee",
    amountPence: order.deliveryFeePence,
    value: formatGBPFromPence(order.deliveryFeePence),
  };
  const discount: InvoiceTotalLineModel | null =
    order.discountPence > 0
      ? {
          key: "discount",
          label: order.discountCode
            ? `Discount (${order.discountCode})`
            : "Discount",
          amountPence: order.discountPence,
          value: `-${formatGBPFromPence(order.discountPence)}`,
        }
      : null;
  const total: InvoiceTotalLineModel = {
    key: "total",
    label: "Total",
    amountPence: order.totalPence,
    value: formatGBPFromPence(order.totalPence),
  };

  return {
    id: order.id,
    invoiceNumber,
    fileName: `invoice-${safeFilename(invoiceNumber)}.pdf`,
    orderReference: reference,
    issueDate,
    issuedAt: asIso(order.createdAt),
    fulfilmentType: getOrderTypeLabel(order.type),
    paymentMethod: getPaymentMethodLabel(order.paymentMethod),
    paymentStatus: paymentStatus(order.paymentMethod, order.status),
    orderStatus: orderStatus(order.status),
    business: {
      name: siteConfig.name,
      shortName: siteConfig.shortName,
      email: contactDetails.email,
      phone: contactDetails.primaryPhone,
      address: restaurantLocation.fullAddress,
      url: siteConfig.url,
      logoUrl: buildAbsoluteUrl("/logo.png"),
    },
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.type === "delivery" ? order.address : null,
    },
    items: items.map((item, index) => ({
      lineId: `${item.menuItemId}-${index}`,
      name: item.name,
      quantity: item.quantity,
      unitPricePence: item.unitPricePence,
      rowTotalPence: item.totalPence,
      unitPrice: formatGBPFromPence(item.unitPricePence),
      rowTotal: formatGBPFromPence(item.totalPence),
    })),
    subtotal,
    deliveryFee,
    discount,
    total,
    footerMessage: "Thank you for your order.",
  };
}

export function buildInvoiceEmailSubject(invoice: InvoiceDocumentModel): string {
  return `Invoice ${invoice.invoiceNumber} - Margherita Pizza`;
}
