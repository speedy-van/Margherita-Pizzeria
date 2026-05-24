import type Stripe from "stripe";

import { env } from "@/lib/env";
import { siteConfig } from "@/lib/config/site";
import { getStripe } from "@/lib/stripe/server";

export interface CreateBookingDepositArgs {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  date: string;
  timeSlot: string;
  covers: number;
  depositAmountPence: number;
}

export interface CreateBookingDepositResult {
  sessionId: string;
  url: string;
}

function baseUrl(): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim() || siteConfig.url;
  return raw.replace(/\/+$/, "");
}

export async function createBookingDepositCheckoutSession(
  args: CreateBookingDepositArgs,
): Promise<CreateBookingDepositResult> {
  const stripe = getStripe();
  const site = baseUrl();

  type LineItem = NonNullable<
    Stripe.Checkout.SessionCreateParams["line_items"]
  >[number];

  const lineItem: LineItem = {
    quantity: 1,
    price_data: {
      currency: "gbp",
      unit_amount: args.depositAmountPence,
      product_data: {
        name: "Table booking deposit",
        description: `${args.covers} cover${args.covers === 1 ? "" : "s"} · ${args.date} ${args.timeSlot}`,
      },
    },
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: args.customerEmail,
    line_items: [lineItem],
    success_url: `${site}/book/success?bookingId=${encodeURIComponent(
      args.bookingId,
    )}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/book?cancelled=1`,
    metadata: {
      bookingId: args.bookingId,
      kind: "table_booking_deposit",
      customerName: args.customerName,
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }
  return { sessionId: session.id, url: session.url };
}
