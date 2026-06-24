import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { orders, type Order } from "@/lib/db/schema";
import { formatEstimatedTime, isOrderPaidOrBeyond } from "@/lib/orders/status";
import type {
  CreateOrderInput,
  OrderConversionCustomerData,
  OrderPricingBreakdown,
  PublicOrderSummary,
  ValidatedOrderItem,
} from "@/lib/orders/types";
import type { OrderItemSnapshot, OrderType } from "@/types/database";
import { generateUniqueReference } from "@/lib/utils/reference";

interface SharedCreateArgs {
  input: CreateOrderInput;
  pricing: OrderPricingBreakdown;
  items: ValidatedOrderItem[];
  estimatedTime: string;
}

async function nextOrderReference(): Promise<string | null> {
  return generateUniqueReference(async (candidate) => {
    const [hit] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.reference, candidate))
      .limit(1);
    return Boolean(hit);
  });
}

function itemsSnapshot(items: ValidatedOrderItem[]): OrderItemSnapshot[] {
  return items.map((i) => ({
    menuItemId: i.menuItemId,
    name: i.name,
    quantity: i.quantity,
    unitPricePence: i.unitPricePence,
    totalPence: i.totalPence,
    allergens: i.allergens,
  }));
}

function addressFor(input: CreateOrderInput): {
  address: string | null;
  lat: string | null;
  lng: string | null;
} {
  if (input.type === "delivery") {
    return {
      address: input.deliveryAddress ?? null,
      lat: typeof input.deliveryLat === "number" ? String(input.deliveryLat) : null,
      lng: typeof input.deliveryLng === "number" ? String(input.deliveryLng) : null,
    };
  }
  return { address: null, lat: null, lng: null };
}

export async function createCashOrder(
  args: SharedCreateArgs,
): Promise<Order> {
  const { input, pricing, items, estimatedTime } = args;
  const addr = addressFor(input);
  const reference = await nextOrderReference();

  const [row] = await db
    .insert(orders)
    .values({
      reference,
      type: input.type as OrderType,
      status: "received",
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      address: addr.address,
      lat: addr.lat,
      lng: addr.lng,
      items: itemsSnapshot(items),
      subtotalPence: pricing.subtotalPence,
      deliveryFeePence: pricing.deliveryFeePence,
      discountCode: pricing.discountCode,
      discountPence: pricing.discountPence,
      totalPence: pricing.totalPence,
      paymentMethod: "cash_on_delivery",
      idempotencyKey: input.idempotencyKey ?? null,
      attribution: input.attribution ?? null,
      estimatedTime,
    })
    .returning();
  if (!row) {
    throw new Error("Failed to create cash order");
  }
  return row;
}

export async function createPendingStripeOrder(
  args: SharedCreateArgs,
): Promise<Order> {
  const { input, pricing, items, estimatedTime } = args;
  const addr = addressFor(input);
  const reference = await nextOrderReference();

  const [row] = await db
    .insert(orders)
    .values({
      reference,
      type: input.type as OrderType,
      status: "pending_payment",
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      address: addr.address,
      lat: addr.lat,
      lng: addr.lng,
      items: itemsSnapshot(items),
      subtotalPence: pricing.subtotalPence,
      deliveryFeePence: pricing.deliveryFeePence,
      discountCode: pricing.discountCode,
      discountPence: pricing.discountPence,
      totalPence: pricing.totalPence,
      paymentMethod: "stripe_card",
      idempotencyKey: input.idempotencyKey ?? null,
      attribution: input.attribution ?? null,
      estimatedTime,
    })
    .returning();
  if (!row) {
    throw new Error("Failed to create pending Stripe order");
  }
  return row;
}

export async function attachStripeSessionToOrder(
  orderId: string,
  stripeSessionId: string,
): Promise<void> {
  await db
    .update(orders)
    .set({ stripeSessionId, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!id) return null;
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return row ?? null;
}

export async function getOrderByIdempotencyKey(
  idempotencyKey: string,
): Promise<Order | null> {
  if (!idempotencyKey) return null;
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, idempotencyKey))
    .limit(1);
  return row ?? null;
}

export async function getOrderByStripeSessionId(
  stripeSessionId: string,
): Promise<Order | null> {
  if (!stripeSessionId) return null;
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, stripeSessionId))
    .limit(1);
  return row ?? null;
}

export async function getPublicOrderSummary(
  id: string,
): Promise<PublicOrderSummary | null> {
  const row = await getOrderById(id);
  if (!row) return null;
  return {
    id: row.id,
    reference: row.reference ?? null,
    type: row.type,
    status: row.status,
    customerName: row.customerName,
    items: Array.isArray(row.items) ? row.items : [],
    subtotalPence: row.subtotalPence,
    deliveryFeePence: row.deliveryFeePence,
    discountPence: row.discountPence,
    discountCode: row.discountCode ?? null,
    totalPence: row.totalPence,
    paymentMethod: row.paymentMethod,
    estimatedTime: row.estimatedTime ?? null,
    address: row.address ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getOrderConversionCustomerData(
  id: string,
): Promise<OrderConversionCustomerData | null> {
  const row = await getOrderById(id);
  if (!row) return null;

  return {
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    address: row.address ?? null,
  };
}

/**
 * Idempotently flip a pending order to received once Stripe payment is
 * confirmed. Returns:
 *  - { transitioned: true, order } on the first successful transition
 *  - { transitioned: false, order } if the order was already at/beyond received
 *  - null if no matching order exists
 */
export async function markOrderPaidFromStripeSession(
  stripeSessionId: string,
  orderIdFromMetadata?: string | null,
): Promise<
  | { transitioned: boolean; order: Order }
  | null
> {
  let row: Order | null = null;
  if (orderIdFromMetadata) {
    row = await getOrderById(orderIdFromMetadata);
  }
  if (!row) {
    row = await getOrderByStripeSessionId(stripeSessionId);
  }
  if (!row) return null;

  if (isOrderPaidOrBeyond(row.status)) {
    // Ensure session id is recorded for traceability even on replay.
    if (row.stripeSessionId !== stripeSessionId) {
      await db
        .update(orders)
        .set({ stripeSessionId, updatedAt: new Date() })
        .where(eq(orders.id, row.id));
    }
    return { transitioned: false, order: row };
  }

  const [updated] = await db
    .update(orders)
    .set({
      status: "received",
      stripeSessionId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(orders.id, row.id), eq(orders.status, "pending_payment")),
    )
    .returning();

  if (!updated) {
    // Race: another worker already flipped it.
    const refetched = await getOrderById(row.id);
    if (!refetched) return null;
    return { transitioned: false, order: refetched };
  }
  return { transitioned: true, order: updated };
}

export { formatEstimatedTime };
