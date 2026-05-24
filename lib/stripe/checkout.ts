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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: args.customerEmail,
    line_items: lineItems,
    ...(args.discountPence && args.discountPence > 0
      ? {
          discounts: [
            {
              coupon: (
                await stripe.coupons.create({
                  amount_off: args.discountPence,
                  currency: "gbp",
                  duration: "once",
                  name: args.discountCode
                    ? `Discount ${args.discountCode}`
                    : "Discount",
                  max_redemptions: 1,
                })
              ).id,
            },
          ],
        }
      : {}),
    success_url: `${site}/order/success?orderId=${encodeURIComponent(
      args.orderId,
    )}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/order?cancelled=1`,
    metadata: {
      orderId: args.orderId,
      orderType: args.orderType,
      ...(args.orderReference ? { orderReference: args.orderReference } : {}),
      ...(args.discountCode ? { discountCode: args.discountCode } : {}),
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return { sessionId: session.id, url: session.url };
}
