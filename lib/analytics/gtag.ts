/**
 * Client-safe Google Tag (gtag.js) helpers used by Phase 7 landing pages.
 *
 * Rules:
 *  - All exports must be safe to import from server components
 *    (they simply no-op on the server).
 *  - All exports must be safe to call when env vars are missing or when
 *    the gtag script has not loaded yet.
 *  - No `any`. No external dependencies. No script injection here.
 */

export type GtagParamValue = string | number | boolean | null;
export type GtagParams = Record<string, GtagParamValue>;

type GtagCommand = "config" | "event" | "set" | "consent" | "js";

type GtagFn = (
  command: GtagCommand,
  targetIdOrEventName: string | Date,
  params?: GtagParams,
) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

export function getGaMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return id && id.trim() !== "" ? id : null;
}

export function getGoogleAdsId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  return id && id.trim() !== "" ? id : null;
}

function getOrderConversionLabel(): string | null {
  const v = process.env.NEXT_PUBLIC_GOOGLE_ADS_ORDER_CONVERSION_LABEL;
  return v && v.trim() !== "" ? v : null;
}

function getCollectionConversionLabel(): string | null {
  const v = process.env.NEXT_PUBLIC_GOOGLE_ADS_COLLECTION_CONVERSION_LABEL;
  return v && v.trim() !== "" ? v : null;
}

export const conversionLabels = {
  get order(): string | null {
    return getOrderConversionLabel();
  },
  get collection(): string | null {
    return getCollectionConversionLabel();
  },
};

function safeGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const fn = window.gtag;
  return typeof fn === "function" ? fn : null;
}

export function gtagEvent(eventName: string, params?: GtagParams): void {
  const gtag = safeGtag();
  if (!gtag) return;
  try {
    gtag("event", eventName, params);
  } catch {
    // Never let analytics break user flows.
  }
}

export interface ConversionParams {
  value?: number;
  currency?: "GBP";
  transactionId?: string;
}

export function googleAdsConversion(
  conversionLabel: string,
  params?: ConversionParams,
): void {
  const adsId = getGoogleAdsId();
  if (!adsId) return;
  const gtag = safeGtag();
  if (!gtag) return;

  const sendTo = `${adsId}/${conversionLabel}`;
  const payload: GtagParams = { send_to: sendTo };

  if (typeof params?.value === "number" && Number.isFinite(params.value)) {
    payload.value = params.value;
    payload.currency = params.currency ?? "GBP";
  }
  if (params?.transactionId) {
    payload.transaction_id = params.transactionId;
  }

  try {
    gtag("event", "conversion", payload);
  } catch {
    // swallow
  }
}
