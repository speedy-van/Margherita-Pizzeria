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

export type GtagParamValue =
  | string
  | number
  | boolean
  | null
  | GtagParamValue[]
  | { [key: string]: GtagParamValue };
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
  const trimmed = id?.trim();
  return trimmed ? trimmed : null;
}

export function getGoogleAdsId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const trimmed = id?.trim();
  return trimmed ? trimmed : null;
}

function getOrderConversionLabel(): string | null {
  const v = process.env.NEXT_PUBLIC_GOOGLE_ADS_ORDER_CONVERSION_LABEL;
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
}

function getCollectionConversionLabel(): string | null {
  const v = process.env.NEXT_PUBLIC_GOOGLE_ADS_COLLECTION_CONVERSION_LABEL;
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
}

function getSubscribeConversionLabel(): string | null {
  const v = process.env.NEXT_PUBLIC_GOOGLE_ADS_SUBSCRIBE_CONVERSION_LABEL;
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
}

export const conversionLabels = {
  get order(): string | null {
    return getOrderConversionLabel();
  },
  get collection(): string | null {
    return getCollectionConversionLabel();
  },
  get subscribe(): string | null {
    return getSubscribeConversionLabel();
  },
};

function safeGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const fn = window.gtag;
  return typeof fn === "function" ? fn : null;
}

export function isGtagAvailable(): boolean {
  return safeGtag() !== null;
}

export function gtagEvent(eventName: string, params?: GtagParams): boolean {
  const gtag = safeGtag();
  if (!gtag) return false;
  try {
    gtag("event", eventName, params);
    return true;
  } catch {
    // Never let analytics break user flows.
    return false;
  }
}

export interface ConversionParams {
  value?: number;
  currency?: "GBP";
  transactionId?: string;
}

export interface EnhancedConversionUserData {
  email?: string;
  phone_number?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
}

function hasEnhancedConversionUserData(
  userData: EnhancedConversionUserData | undefined,
): userData is EnhancedConversionUserData {
  if (!userData) return false;
  return Boolean(
    userData.email ||
      userData.phone_number ||
      userData.address?.first_name ||
      userData.address?.last_name ||
      userData.address?.street ||
      userData.address?.city ||
      userData.address?.region ||
      userData.address?.postal_code ||
      userData.address?.country,
  );
}

export function setGoogleAdsUserData(
  userData?: EnhancedConversionUserData,
): boolean {
  if (!hasEnhancedConversionUserData(userData)) return false;

  const gtag = safeGtag();
  if (!gtag) return false;

  try {
    gtag("set", "user_data", userData as GtagParams);
    return true;
  } catch {
    // Never let enhanced conversion data break the order confirmation flow.
    return false;
  }
}

export function googleAdsConversion(
  conversionLabel: string,
  params?: ConversionParams,
): boolean {
  const adsId = getGoogleAdsId();
  if (!adsId) return false;

  const gtag = safeGtag();
  if (!gtag) return false;

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
    return true;
  } catch {
    // Never let analytics break user flows.
    return false;
  }
}

export function googleAdsConversionPixelUrl(
  conversionLabel: string,
  params?: ConversionParams,
): string | null {
  const adsId = getGoogleAdsId();
  if (!adsId) return null;

  const id = adsId.replace(/^AW-/, "").trim();
  if (!id || !conversionLabel.trim()) return null;

  const url = new URL(`https://www.googleadservices.com/pagead/conversion/${id}/`);
  url.searchParams.set("label", conversionLabel);
  url.searchParams.set("guid", "ON");
  url.searchParams.set("script", "0");
  if (typeof params?.value === "number" && Number.isFinite(params.value)) {
    url.searchParams.set("value", params.value.toFixed(2));
    url.searchParams.set("currency_code", params.currency ?? "GBP");
  }
  if (params?.transactionId) {
    url.searchParams.set("transaction_id", params.transactionId);
  }
  return url.toString();
}
