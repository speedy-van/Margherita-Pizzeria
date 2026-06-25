import { siteConfig } from "@/lib/config/site";
import { env } from "@/lib/env";
import type {
  BookingStatus,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@/types/database";

/* ─────────────────────────── Site URL helpers ─────────────────────────── */

export function getSiteUrl(): string {
  const fromEnv = env.NEXT_PUBLIC_SITE_URL.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return siteConfig.url.replace(/\/+$/, "");
}

export function buildAbsoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path) return base;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

/* ─────────────────────────── Labels & copy ─────────────────────────── */

export function getOrderTypeLabel(type: OrderType): string {
  return type === "delivery" ? "Delivery" : "Collection";
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod): string {
  return paymentMethod === "stripe_card"
    ? "Card (paid online)"
    : "Cash on delivery or collection";
}

const ORDER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending_payment: "We're waiting for your card payment to clear.",
  received: "We've received your order and it's in the queue.",
  making: "Your order is in the oven.",
  ready: "Your order is ready.",
  out_for_delivery: "Your order is on its way.",
  delivered: "Your order has been delivered. Enjoy.",
  cancelled: "This order has been cancelled.",
  rejected: "This order could not be accepted.",
};

export function getOrderStatusMessage(status: OrderStatus): string {
  return ORDER_STATUS_MESSAGES[status];
}

export function getBookingStatusMessage(
  status: BookingStatus,
  depositPaid: boolean,
): string {
  const depositNote = depositPaid ? " Your deposit has been recorded." : "";
  switch (status) {
    case "pending":
      return "We've received your booking request." + depositNote;
    case "confirmed":
      return "Your table is confirmed." + depositNote;
    case "rejected":
      return "Unfortunately this booking could not be accepted." + depositNote;
    case "cancelled":
      return "This booking has been cancelled." + depositNote;
    case "completed":
      return "Thanks for visiting." + depositNote;
  }
}

/* ─────────────────────────── Date / time / id ─────────────────────────── */

export function formatEmailDate(dateLike: Date | string): string {
  const d = typeof dateLike === "string" ? parseDateLike(dateLike) : dateLike;
  if (!d || Number.isNaN(d.getTime())) {
    return typeof dateLike === "string" ? dateLike : "";
  }
  return d.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Accepts "HH:mm" or a Date-like value and returns "HH:mm". */
export function formatEmailTime(time: Date | string): string {
  if (typeof time === "string") {
    const trimmed = time.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [hStr, mStr] = trimmed.split(":");
      const h = Number(hStr);
      const m = Number(mStr);
      if (Number.isFinite(h) && Number.isFinite(m)) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }
    return trimmed;
  }
  if (Number.isNaN(time.getTime())) return "";
  return time.toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Customer-facing reference. Prefer the persisted `MP######` reference;
 * fall back to the first 8 chars of the row id (rendered uppercase) for
 * legacy rows that pre-date the reference column.
 */
export function formatShortReference(
  id: string,
  reference?: string | null,
): string {
  if (reference && reference.length > 0) return reference;
  if (!id) return "";
  return id.slice(0, 8).toUpperCase();
}

function parseDateLike(value: string): Date | null {
  // YYYY-MM-DD (booking date) — interpret as local Europe/London date.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00Z`);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
