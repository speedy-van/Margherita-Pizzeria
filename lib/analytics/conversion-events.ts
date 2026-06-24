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
  type EnhancedConversionUserData,
  gtagEvent,
  googleAdsConversion,
  googleAdsConversionPixelUrl,
  setGoogleAdsUserData,
} from "@/lib/analytics/gtag";

export type LandingSource = "order_now" | "collection";

export interface PurchaseConversionItem {
  [key: string]: string | number;
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

export function trackLandingOrderIntent(source: LandingSource): boolean {
  return gtagEvent("landing_order_intent", { source });
}

export function trackLandingMenuClick(source: LandingSource): boolean {
  return gtagEvent("landing_menu_click", { source });
}

export function trackLandingBookClick(source: LandingSource): boolean {
  return gtagEvent("landing_book_click", { source });
}

export function trackLandingDirectionsClick(source: LandingSource): boolean {
  return gtagEvent("landing_directions_click", { source });
}

export function trackOrderLandingConversion(
  transactionId?: string,
  value?: number,
  items?: PurchaseConversionItem[],
  enhancedConversionUserData?: EnhancedConversionUserData,
): boolean {
  const label = conversionLabels.order;
  let adsSent = false;

  if (label) {
    setGoogleAdsUserData(enhancedConversionUserData);
    adsSent = googleAdsConversion(label, { transactionId, value, currency: "GBP" });
  }

  const ga4Sent = gtagEvent("purchase", {
    transaction_id: transactionId ?? null,
    value: typeof value === "number" ? value : null,
    currency: "GBP",
    items: items ?? [],
  });

  const legacySent = gtagEvent("landing_conversion", {
    type: "order",
    transaction_id: transactionId ?? null,
    value: typeof value === "number" ? value : null,
  });

  return label ? adsSent : ga4Sent || legacySent;
}

export function trackCollectionLandingConversion(
  transactionId?: string,
  value?: number,
): boolean {
  const label = conversionLabels.collection;
  if (!label) return false;
  const adsSent = googleAdsConversion(label, {
    transactionId,
    value,
    currency: "GBP",
  });
  const legacySent = gtagEvent("landing_conversion", {
    type: "collection",
    transaction_id: transactionId ?? null,
    value: typeof value === "number" ? value : null,
  });
  return adsSent || legacySent;
}

export function trackSubscribeConversion(bookingId?: string): boolean {
  const label = conversionLabels.subscribe;
  if (!label) return false;
  const adsSent = googleAdsConversion(label, { value: 1.0, currency: "GBP", transactionId: bookingId });
  const legacySent = gtagEvent("landing_conversion", {
    type: "subscribe",
    transaction_id: bookingId ?? null,
    value: 1.0,
  });
  return adsSent || legacySent;
}

export function getOrderConversionPixelUrl(
  transactionId?: string,
  value?: number,
): string | null {
  const label = conversionLabels.order;
  if (!label) return null;
  return googleAdsConversionPixelUrl(label, {
    transactionId,
    value,
    currency: "GBP",
  });
}
