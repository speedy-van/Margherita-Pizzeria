import type Stripe from "stripe";

import {
  getStripe,
  getStripeWebhookSecret,
} from "@/lib/stripe/server";
import {
  markOrderPaidFromStripeSession,
} from "@/lib/orders/queries";
import { markBookingDepositPaidFromStripeSession } from "@/lib/bookings/queries";
import { sendOrderConfirmationEmail } from "@/lib/resend/send-order-confirmation";
import { sendBookingConfirmationEmail } from "@/lib/resend/send-booking-confirmation";
import { sendAdminNewOrderEmail } from "@/lib/resend/send-admin-new-order";

export type WebhookHandleResult =
  | { ok: true; handled: boolean; eventType: string }
  | { ok: false; status: number; code: string; message: string };

export async function constructStripeEvent(
  rawBody: string,
  signature: string | null,
): Promise<{ ok: true; event: Stripe.Event } | { ok: false; status: number; code: string; message: string }> {
  if (!signature) {
    return {
      ok: false,
      status: 400,
      code: "MISSING_SIGNATURE",
      message: "Missing Stripe signature header.",
    };
  }
  const secret = getStripeWebhookSecret();
  if (!secret) {
    return {
      ok: false,
      status: 500,
      code: "WEBHOOK_NOT_CONFIGURED",
      message: "Stripe webhook is not configured.",
    };
  }
  const stripe = getStripe();
  try {
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      secret,
    );
    return { ok: true, event };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return {
      ok: false,
      status: 400,
      code: "INVALID_SIGNATURE",
      message: `Webhook signature verification failed: ${message}`,
    };
  }
}

export async function handleStripeEvent(
  event: Stripe.Event,
): Promise<WebhookHandleResult> {
  try {
    if (event.type !== "checkout.session.completed") {
      return { ok: true, handled: false, eventType: event.type };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      return { ok: true, handled: false, eventType: event.type };
    }

    const kind =
      typeof session.metadata?.kind === "string" ? session.metadata.kind : null;

    if (kind === "table_booking_deposit") {
      const bookingIdMeta =
        typeof session.metadata?.bookingId === "string"
          ? session.metadata.bookingId
          : null;
      const result = await markBookingDepositPaidFromStripeSession(
        session.id,
        bookingIdMeta,
      );
      if (!result) {
        // eslint-disable-next-line no-console
        console.warn(
          "[stripe webhook] No booking matched session/bookingId",
          session.id,
          bookingIdMeta,
        );
        return { ok: true, handled: false, eventType: event.type };
      }
      if (result.transitioned) {
        try {
          await sendBookingConfirmationEmail(result.booking);
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error(
            "[stripe webhook] booking confirmation email failed:",
            err,
          );
        }
      }
      return { ok: true, handled: true, eventType: event.type };
    }

    const orderIdMeta =
      typeof session.metadata?.orderId === "string"
        ? session.metadata.orderId
        : null;

    const result = await markOrderPaidFromStripeSession(
      session.id,
      orderIdMeta,
    );
    if (!result) {
      // Order not found — nothing to do, but acknowledge so Stripe stops retrying.
      // eslint-disable-next-line no-console
      console.warn(
        "[stripe webhook] No order matched session/orderId",
        session.id,
        orderIdMeta,
      );
      return { ok: true, handled: false, eventType: event.type };
    }

    if (result.transitioned) {
      // TODO(server-side-conversion): When a Stripe-paid order transitions here,
      // orders.attribution already contains the gclid / UTM data saved at checkout.
      // A Google Ads Offline Conversion Import (OCI) or Conversion Adjustment Upload
      // via the Google Ads API (google-ads-api or REST) would let us credit the
      // conversion server-side, covering customers who close the browser before
      // reaching /order/success. No Google Ads API credentials or DEVELOPER_TOKEN
      // exist in this codebase yet — add GOOGLE_ADS_DEVELOPER_TOKEN,
      // GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_REFRESH_TOKEN, and a server-side upload
      // helper before wiring this up. Until then, conversions are browser-only
      // (LandingConversionEvents on /order/success) and will be missed for customers
      // who complete Stripe payment but never open the success page.

      // Fire emails but don't fail the webhook if email fails.
      try {
        await sendOrderConfirmationEmail(result.order);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          "[stripe webhook] Email send failed: sendOrderConfirmationEmail",
          err instanceof Error ? err.message : err,
        );
      }
      try {
        await sendAdminNewOrderEmail(result.order);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          "[stripe webhook] Email send failed: sendAdminNewOrderEmail",
          err instanceof Error ? err.message : err,
        );
      }
    }

    return { ok: true, handled: true, eventType: event.type };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] handler error:", err);
    return {
      ok: false,
      status: 500,
      code: "WEBHOOK_HANDLER_FAILED",
      message: "Webhook processing failed.",
    };
  }
}
