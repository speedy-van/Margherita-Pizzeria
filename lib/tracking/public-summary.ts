import type { OrderType } from "@/types/database";

import type { TrackingOrderStatus } from "@/lib/tracking/types";

const TERMINAL_STATUSES: ReadonlySet<TrackingOrderStatus> = new Set([
  "delivered",
  "cancelled",
  "rejected",
]);

export function isTerminalTrackingStatus(
  status: TrackingOrderStatus,
): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function canTrackDriverForStatus(
  status: TrackingOrderStatus,
  type: OrderType,
): boolean {
  if (type !== "delivery") return false;
  return status === "out_for_delivery";
}

export function buildTrackingMessage(
  status: TrackingOrderStatus,
  type: OrderType,
  hasDriverLocation: boolean,
): string {
  if (status === "cancelled" || status === "rejected") {
    return "This order is no longer active.";
  }

  if (type === "collection") {
    switch (status) {
      case "pending_payment":
        return "We are waiting for payment confirmation.";
      case "received":
        return "Your collection order has been received.";
      case "making":
      case "ready":
      case "out_for_delivery":
        return "Your collection order is being prepared.";
      case "delivered":
        return "Your order has been collected.";
      default:
        return "Your collection order is being prepared.";
    }
  }

  switch (status) {
    case "pending_payment":
      return "We are waiting for payment confirmation.";
    case "received":
      return "Your order has been received.";
    case "making":
      return "Your pizza is being prepared.";
    case "ready":
      return "Your order is ready.";
    case "out_for_delivery":
      return hasDriverLocation
        ? "Your driver is on the way."
        : "Your driver is on the way. Live location will appear shortly.";
    case "delivered":
      return "Your order has been delivered.";
    default:
      return "Your order is being processed.";
  }
}
