import type Stripe from "stripe";

import { env } from "@/lib/env";
import { siteConfig } from "@/lib/config/site";
import { getStripe } from "@/lib/stripe/server";
import type {
  OrderMode,
  ValidatedOrderItem,
} from "@/lib/orders/types";

export interface CreateCheckoutSessionArgs {
  orderId: string;
  orderReference?: string | null;
  orderType: OrderMode;
  customerEmail: string;
  items: ValidatedOrderItem[];
  deliveryFeePence: number;
  /** Discount amount in pence — Stripe receives a one-shot inline coupon. */
  discountPence?: number;
  discountCode?: string | null;
  idempotencyKey?: string | null;
}

export interface CreateCheckoutSessionResult {
  sessionId: string;
  url: string;
}

function baseUrl(): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim() || siteConfig.url;
  return raw.replace(/\/+$/, "");
}

export async function createOrderCheckoutSession(
  args: CreateCheckoutSessionArgs,
): Promise<CreateCheckoutSessionResult> {
  const stripe = getStripe();
  const site = baseUrl();

  type LineItem = NonNullable<
    Stripe.Checkout.SessionCreateParams["line_items"]
  >[number];

  const lineItems: LineItem[] = args.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: item.unitPricePence,
        product_data: {
          name: item.name,
        },
      },
    }));

  if (args.deliveryFeePence > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: args.deliveryFeePence,
        product_data: {
          name: "Delivery fee",
        },
      },
    });
  }

  const discountCouponId =
    args.discountPence && args.discountPence > 0
      ? (
          await stripe.coupons.create(
            {
              amount_off: args.discountPence,
              currency: "gbp",
              duration: "once",
              name: args.discountCode
                ? `Discount ${args.discountCode}`
                : "Discount",
              max_redemptions: 1,
            },
            args.idempotencyKey
              ? {
                  idempotencyKey: `order-discount:${args.orderId}:${args.idempotencyKey}`,
                }
              : undefined,
          )
        ).id
      : null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: args.customerEmail,
    line_items: lineItems,
    ...(discountCouponId
      ? {
          discounts: [
            {
              coupon: discountCouponId,
            },
          ],
        }
      : {}),
    success_url: `${site}/order/success?orderId=${encodeURIComponent(
      args.orderId,
    )}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/order/checkout?cancelled=1`,
    metadata: {
      orderId: args.orderId,
      orderType: args.orderType,
      ...(args.orderReference ? { orderReference: args.orderReference } : {}),
      ...(args.discountCode ? { discountCode: args.discountCode } : {}),
    },
  }, args.idempotencyKey
    ? { idempotencyKey: `order-checkout:${args.orderId}:${args.idempotencyKey}` }
    : undefined);

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return { sessionId: session.id, url: session.url };
}

export async function retrieveCheckoutSessionUrl(
  sessionId: string,
): Promise<string | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.url ?? null;
}

export interface StripeSessionVerification {
  paid: boolean;
  orderIdMatches: boolean;
}

/**
 * Server-side guard: retrieves a Stripe Checkout Session and confirms it is
 * paid and belongs to the given orderId. Throws on network / API errors —
 * callers should catch and treat as unverified.
 */
export async function verifyStripeCheckoutSession(
  sessionId: string,
  orderId: string,
): Promise<StripeSessionVerification> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === "paid";
  const orderIdMatches = session.metadata?.orderId === orderId;
  return { paid, orderIdMatches };
}
