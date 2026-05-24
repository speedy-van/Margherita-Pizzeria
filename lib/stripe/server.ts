import Stripe from "stripe";

import { env, isProduction } from "@/lib/env";

let cachedClient: Stripe | null = null;

/**
 * Returns a configured Stripe instance. Throws clearly in production if the
 * secret key is missing; in development logs a warning and still attempts to
 * construct (Stripe will reject calls with an empty key).
 */
export function getStripe(): Stripe {
  if (cachedClient) return cachedClient;

  const key = env.STRIPE_SECRET_KEY.trim();
  if (!key) {
    if (isProduction) {
      throw new Error("STRIPE_SECRET_KEY is required in production.");
    }
    // eslint-disable-next-line no-console
    console.warn("[stripe] STRIPE_SECRET_KEY missing — Stripe calls will fail.");
  }

  cachedClient = new Stripe(key, {
    // Pin via account default — let Stripe pick the current version.
    typescript: true,
  });
  return cachedClient;
}

export function getStripeWebhookSecret(): string {
  return env.STRIPE_WEBHOOK_SECRET.trim();
}
