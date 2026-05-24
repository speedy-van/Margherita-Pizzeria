import { NextResponse } from "next/server";

import {
  attachStripeSessionToOrder,
  getOrderById,
} from "@/lib/orders/queries";
import { createOrderCheckoutSession } from "@/lib/stripe/checkout";
import type { OrderItemSnapshot } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateSessionBody {
  orderId?: unknown;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: CreateSessionBody;
  try {
    body = (await request.json()) as CreateSessionBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      },
      { status: 400 },
    );
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  if (!orderId || !UUID_RE.test(orderId)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ID", message: "Invalid order id." } },
      { status: 400 },
    );
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Order not found." } },
      { status: 404 },
    );
  }
  if (order.paymentMethod !== "stripe_card") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NOT_STRIPE_ORDER",
          message: "This order does not use card payment.",
        },
      },
      { status: 400 },
    );
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ORDER_NOT_PAYABLE",
          message: "This order is no longer awaiting payment.",
        },
      },
      { status: 409 },
    );
  }

  try {
    const items: OrderItemSnapshot[] = Array.isArray(order.items)
      ? order.items
      : [];
    const session = await createOrderCheckoutSession({
      orderId: order.id,
      orderType: order.type,
      customerEmail: order.customerEmail,
      items,
      deliveryFeePence: order.deliveryFeePence,
    });
    await attachStripeSessionToOrder(order.id, session.sessionId);
    return NextResponse.json(
      { ok: true, data: { checkoutUrl: session.url } },
      { status: 200 },
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/stripe/create-session] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "STRIPE_SESSION_FAILED",
          message: "We couldn't start the payment session. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
