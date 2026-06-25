import type {
  AdminOrderDetail,
  AdminOrderListItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@/api/types";

export const ORDER_STATUSES = [
  "pending_payment",
  "received",
  "making",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
] as const satisfies readonly OrderStatus[];

export const ADMIN_MUTABLE_ORDER_STATUSES = [
  "received",
  "making",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  received: "Received",
  making: "Making",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export const ORDER_STATUS_SHORT_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Payment",
  received: "Received",
  making: "Making",
  ready: "Ready",
  out_for_delivery: "Out",
  delivered: "Done",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export type StatusTone = {
  bg: string;
  fg: string;
  label: string;
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, StatusTone> = {
  pending_payment: { bg: "#fef3c7", fg: "#92400e", label: "Awaiting payment" },
  received: { bg: "#dbeafe", fg: "#1e40af", label: "Received" },
  making: { bg: "#ffedd5", fg: "#9a3412", label: "Making" },
  ready: { bg: "#dcfce7", fg: "#166534", label: "Ready" },
  out_for_delivery: { bg: "#ccfbf1", fg: "#0f766e", label: "Out for delivery" },
  delivered: { bg: "#dcfce7", fg: "#166534", label: "Delivered" },
  cancelled: { bg: "#fee2e2", fg: "#991b1b", label: "Cancelled" },
  rejected: { bg: "#fee2e2", fg: "#991b1b", label: "Rejected" },
};

export const ACTIVE_ORDER_STATUSES = [
  "received",
  "making",
  "ready",
  "out_for_delivery",
] as const satisfies readonly OrderStatus[];

export const KITCHEN_ORDER_STATUSES = [
  "received",
  "making",
  "ready",
] as const satisfies readonly OrderStatus[];

export const COMPLETED_ORDER_STATUSES = [
  "delivered",
  "cancelled",
  "rejected",
] as const satisfies readonly OrderStatus[];

type OrderLike = Pick<
  AdminOrderListItem,
  | "id"
  | "reference"
  | "type"
  | "status"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "totalPence"
  | "paymentMethod"
  | "itemCount"
  | "createdAt"
> &
  Partial<Pick<AdminOrderDetail, "address" | "items">>;

export type OrderStatusAction = {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  tone: "default" | "success" | "danger";
  requiresConfirmation: boolean;
};

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: [],
  received: ["making", "ready", "rejected", "cancelled"],
  making: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  return TRANSITIONS[currentStatus].includes(nextStatus);
}

export function getNextOrderActions(order: {
  status: OrderStatus;
  type: OrderType;
}): OrderStatusAction[] {
  return TRANSITIONS[order.status]
    .filter((status) => {
      if (order.type === "collection" && status === "out_for_delivery") return false;
      if (order.type === "delivery" && order.status === "ready" && status === "delivered") {
        return false;
      }
      return (ADMIN_MUTABLE_ORDER_STATUSES as readonly OrderStatus[]).includes(status);
    })
    .map((status) => ({
      status,
      label: actionLabel(status, order.status),
      shortLabel: actionShortLabel(status),
      tone:
        status === "cancelled" || status === "rejected"
          ? "danger"
          : status === "delivered" || status === "ready"
            ? "success"
            : "default",
      requiresConfirmation: status === "cancelled" || status === "rejected",
    }));
}

function actionLabel(status: OrderStatus, currentStatus: OrderStatus): string {
  if (currentStatus === "received" && status === "making") return "Accept and start";
  if (status === "making") return "Start making";
  if (status === "ready") return "Mark ready";
  if (status === "out_for_delivery") return "Send out";
  if (status === "delivered") return "Mark delivered";
  if (status === "cancelled") return "Cancel order";
  if (status === "rejected") return "Reject order";
  return `Mark ${ORDER_STATUS_LABELS[status].toLowerCase()}`;
}

function actionShortLabel(status: OrderStatus): string {
  if (status === "making") return "Start";
  if (status === "ready") return "Ready";
  if (status === "out_for_delivery") return "Out";
  if (status === "delivered") return "Done";
  if (status === "cancelled") return "Cancel";
  if (status === "rejected") return "Reject";
  return ORDER_STATUS_SHORT_LABELS[status];
}

export function isActiveOrder(order: { status: OrderStatus }): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly OrderStatus[]).includes(order.status);
}

export function isKitchenOrder(order: { status: OrderStatus }): boolean {
  return (KITCHEN_ORDER_STATUSES as readonly OrderStatus[]).includes(order.status);
}

export function isCompletedOrder(order: { status: OrderStatus }): boolean {
  return (COMPLETED_ORDER_STATUSES as readonly OrderStatus[]).includes(order.status);
}

export type InferredPaymentStatus = {
  label: string;
  shortLabel: string;
  tone: "paid" | "unpaid" | "cash" | "unknown";
};

export function inferPaymentStatus(order: {
  status: OrderStatus;
  paymentMethod: PaymentMethod;
}): InferredPaymentStatus {
  if (order.status === "pending_payment") {
    return { label: "Awaiting card payment", shortLabel: "Unpaid", tone: "unpaid" };
  }
  if (order.paymentMethod === "stripe_card") {
    return { label: "Paid by card", shortLabel: "Paid", tone: "paid" };
  }
  if (order.paymentMethod === "cash_on_delivery") {
    return { label: "Cash on delivery", shortLabel: "Cash", tone: "cash" };
  }
  return { label: "Payment unknown", shortLabel: "Unknown", tone: "unknown" };
}

export function isTestOrderHeuristic(order: Partial<OrderLike>): boolean {
  const haystack = [
    order.reference,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.address,
    ...(Array.isArray(order.items) ? order.items.map((item) => item.name) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (
    haystack.includes("GOOGLE ADS TEST") ||
    haystack.includes("DO NOT PREPARE") ||
    /\bTEST\b/.test(haystack)
  ) {
    return true;
  }
  return typeof order.totalPence === "number" && order.totalPence > 0 && order.totalPence <= 50;
}

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatCurrencyGBP(value: number | null | undefined): string {
  const pence = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return gbpFormatter.format(Math.trunc(pence) / 100);
}

export function formatOrderAge(date: string | Date | null | undefined): string {
  if (!date) return "Unknown age";
  const created = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(created.getTime())) return "Unknown age";
  const diffMs = Date.now() - created.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (totalMinutes < 1) return "Just now";
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function isLateOrder(
  order: Pick<OrderLike, "createdAt" | "status" | "type">,
  now: Date = new Date(),
): boolean {
  if (!isActiveOrder(order)) return false;
  const created = new Date(order.createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const ageMinutes = (now.getTime() - created.getTime()) / 60_000;
  if (order.status === "received") return ageMinutes >= 10;
  if (order.status === "making") return ageMinutes >= 25;
  if (order.status === "ready") return ageMinutes >= 35;
  if (order.status === "out_for_delivery") return ageMinutes >= 55;
  return ageMinutes >= (order.type === "delivery" ? 60 : 35);
}
