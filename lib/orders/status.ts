import type { OrderStatus } from "@/types/database";

/**
 * Human-friendly labels for order status. Used by success/track pages and
 * email templates.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  received: "Received",
  making: "In the oven",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const PAID_OR_BEYOND: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "received",
  "making",
  "ready",
  "out_for_delivery",
  "delivered",
]);

export function isOrderPaidOrBeyond(status: OrderStatus): boolean {
  return PAID_OR_BEYOND.has(status);
}

export function formatEstimatedTime(
  mode: "delivery" | "collection",
  minutes: number,
  scheduledCollection?: string,
): string {
  if (mode === "collection") {
    if (scheduledCollection && scheduledCollection !== "asap") {
      return `Ready for collection around ${scheduledCollection}`;
    }
    return `Ready in around ${minutes} minutes`;
  }
  return `Delivery in around ${minutes} minutes`;
}
