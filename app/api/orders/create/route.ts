import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db/client";
import { timeSlots } from "@/lib/db/schema";
import { verifyCoordinatesWithinRadius } from "@/lib/mapbox/geocode";
import {
  attachStripeSessionToOrder,
  createCashOrder,
  createPendingStripeOrder,
} from "@/lib/orders/queries";
import {
  calculateOrderPricing,
  getOrderSettings,
  validateAndPriceCart,
} from "@/lib/orders/pricing";
import { formatEstimatedTime } from "@/lib/orders/status";
import { createOrderCheckoutSession } from "@/lib/stripe/checkout";
import { validateCreateOrderInput } from "@/lib/validations/order";
import { sendOrderConfirmationEmail } from "@/lib/resend/send-order-confirmation";
import { sendAdminNewOrderEmail } from "@/lib/resend/send-admin-new-order";
import { applyDiscountByCode } from "@/lib/discounts/queries";
import { notifyAdminDevices } from "@/lib/notifications/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      },
      { status: 400 },
    );
  }

  const validation = validateCreateOrderInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }
  const input = validation.data;

  // Validate cart against DB and recalculate prices server-side.
  const cartResult = await validateAndPriceCart(input.cartItems);
  if (!cartResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: cartResult.code,
          message: cartResult.message,
          ...(cartResult.fields ? { fields: cartResult.fields } : {}),
        },
      },
      { status: 400 },
    );
  }

  const settings = await getOrderSettings();
  const subtotalForDiscount = cartResult.items.reduce(
    (sum, i) => sum + i.unitPricePence * i.quantity,
    0,
  );

  let appliedDiscount: { code: string; discountPence: number } | null = null;
  if (input.discountCode) {
    const result = await applyDiscountByCode({
      code: input.discountCode,
      subtotalPence: subtotalForDiscount,
      orderType: input.type,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: result.code, message: result.message },
        },
        { status: 400 },
      );
    }
    appliedDiscount = {
      code: result.discount.code,
      discountPence: result.discountPence,
    };
  }

  const pricing = calculateOrderPricing({
    items: cartResult.items,
    orderType: input.type,
    settings,
    discount: appliedDiscount,
  });

  if (input.type === "delivery") {
    if (
      typeof input.deliveryLat !== "number" ||
      typeof input.deliveryLng !== "number"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DELIVERY_COORDS_MISSING",
            message: "Delivery coordinates are required.",
          },
        },
        { status: 400 },
      );
    }
    const radiusCheck = await verifyCoordinatesWithinRadius({
      lat: input.deliveryLat,
      lng: input.deliveryLng,
    });
    if (!radiusCheck.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: radiusCheck.code, message: radiusCheck.message },
        },
        { status: 400 },
      );
    }
    if (!pricing.meetsMinimumDelivery) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BELOW_MIN_DELIVERY_ORDER",
            message: `Minimum delivery order is required.`,
            fields: {
              minDeliveryOrderPence: String(pricing.minDeliveryOrderPence),
              subtotalPence: String(pricing.subtotalPence),
            },
          },
        },
        { status: 400 },
      );
    }
  }

  // Collection slot validation if not asap.
  if (input.type === "collection" && input.collectionTime && input.collectionTime !== "asap") {
    const [slot] = await db
      .select({ id: timeSlots.id })
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.type, "collection"),
          eq(timeSlots.time, input.collectionTime),
          eq(timeSlots.active, true),
        ),
      )
      .limit(1);
    if (!slot) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_COLLECTION_SLOT",
            message: "Pick a valid collection time.",
          },
        },
        { status: 400 },
      );
    }
  }

  const estimatedMinutes =
    input.type === "delivery"
      ? settings.deliveryTimeMinutes
      : settings.prepTimeMinutes;
  const estimatedTime = formatEstimatedTime(
    input.type,
    estimatedMinutes,
    input.type === "collection" ? input.collectionTime : undefined,
  );

  if (input.paymentMethod === "cash_on_delivery") {
    try {
      const order = await createCashOrder({
        input,
        pricing,
        items: cartResult.items,
        estimatedTime,
      });
      // Fire-and-forget emails; do not fail the order if they fail.
      try {
        await sendOrderConfirmationEmail(order);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          "[orders/create] Email send failed: sendOrderConfirmationEmail",
          err instanceof Error ? err.message : err,
        );
      }
      try {
        await sendAdminNewOrderEmail(order);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          "[orders/create] Email send failed: sendAdminNewOrderEmail",
          err instanceof Error ? err.message : err,
        );
      }
      try {
        await notifyAdminDevices({
          title: "New order received",
          body: `${order.reference ?? order.id.slice(0, 8)} · £${(order.totalPence / 100).toFixed(2)} · ${order.type}`,
          data: {
            type: "new_order",
            orderId: order.id,
            reference: order.reference ?? "",
          },
        });
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          "[orders/create] FCM admin notify failed",
          err instanceof Error ? err.message : err,
        );
      }
      return NextResponse.json(
        {
          ok: true,
          data: {
            orderId: order.id,
            reference: order.reference,
            paymentRequired: false,
            redirectUrl: `/order/success?orderId=${order.id}`,
          },
        },
        { status: 201 },
      );
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("[orders/create] cash order failed:", err);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "ORDER_CREATE_FAILED",
            message: "We couldn't create your order. Please try again.",
          },
        },
        { status: 500 },
      );
    }
  }

  // Stripe card flow.
  let order;
  try {
    order = await createPendingStripeOrder({
      input,
      pricing,
      items: cartResult.items,
      estimatedTime,
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[orders/create] pending stripe order failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ORDER_CREATE_FAILED",
          message: "We couldn't start your order. Please try again.",
        },
      },
      { status: 500 },
    );
  }

  try {
    const session = await createOrderCheckoutSession({
      orderId: order.id,
      orderReference: order.reference,
      orderType: input.type,
      customerEmail: input.customerEmail,
      items: cartResult.items,
      deliveryFeePence: pricing.deliveryFeePence,
      discountPence: pricing.discountPence,
      discountCode: pricing.discountCode,
    });
    await attachStripeSessionToOrder(order.id, session.sessionId);
    return NextResponse.json(
      {
        ok: true,
        data: {
          orderId: order.id,
          reference: order.reference,
          paymentRequired: true,
          checkoutUrl: session.url,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[orders/create] stripe checkout failed:", err);
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
