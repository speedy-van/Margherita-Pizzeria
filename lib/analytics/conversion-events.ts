/**
 * Phase 7 landing-page conversion / engagement events.
 *
 * All functions are client-safe and no-op when:
 *  - `window` is unavailable (SSR);
 *  - `window.gtag` has not loaded;
 *  - env vars / conversion labels are missing.
 */

import {
  conversionLabels,
  googleAdsConversion,
  gtagEvent,
} from "@/lib/analytics/gtag";

export type LandingSource = "order_now" | "collection";

export function trackLandingOrderIntent(source: LandingSource): void {
  gtagEvent("landing_order_intent", { source });
}

export function trackLandingMenuClick(source: LandingSource): void {
  gtagEvent("landing_menu_click", { source });
}

export function trackLandingBookClick(source: LandingSource): void {
  gtagEvent("landing_book_click", { source });
}

export function trackLandingDirectionsClick(source: LandingSource): void {
  gtagEvent("landing_directions_click", { source });
}

export function trackOrderLandingConversion(
  transactionId?: string,
  value?: number,
): void {
  const label = conversionLabels.order;
  if (!label) return;
  googleAdsConversion(label, {
    transactionId,
    value,
    currency: "GBP",
  });
  gtagEvent("landing_conversion", {
    type: "order",
    transaction_id: transactionId ?? null,
    value: typeof value === "number" ? value : null,
  });
}

export function trackCollectionLandingConversion(
  transactionId?: string,
  value?: number,
): void {
  const label = conversionLabels.collection;
  if (!label) return;
  googleAdsConversion(label, {
    transactionId,
    value,
    currency: "GBP",
  });
  gtagEvent("landing_conversion", {
    type: "collection",
    transaction_id: transactionId ?? null,
    value: typeof value === "number" ? value : null,
  });
}
