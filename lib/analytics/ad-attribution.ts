"use client";

import type { OrderAttributionSnapshot } from "@/types/database";

const STORAGE_KEY = "mp_google_ads_attribution";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

type AttributionDraft = Omit<
  OrderAttributionSnapshot,
  "capturedAt" | "lastSeenAt"
> &
  Partial<Pick<OrderAttributionSnapshot, "capturedAt" | "lastSeenAt">>;

function clean(value: string | null | undefined, max: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const encodedName = `${encodeURIComponent(name)}=`;
  const hit = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(encodedName));
  if (!hit) return undefined;
  return clean(decodeURIComponent(hit.slice(encodedName.length)), 512);
}

function readStored(): OrderAttributionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OrderAttributionSnapshot>;
    if (!parsed.capturedAt || !parsed.lastSeenAt) return null;
    const capturedAt = Date.parse(parsed.capturedAt);
    if (!Number.isFinite(capturedAt)) return null;
    if (Date.now() - capturedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      ...parsed,
      capturedAt: parsed.capturedAt,
      lastSeenAt: parsed.lastSeenAt,
    } as OrderAttributionSnapshot;
  } catch {
    return null;
  }
}

function writeStored(attribution: OrderAttributionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution must never block checkout.
  }
}

function fromCurrentBrowserState(): AttributionDraft | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const params = url.searchParams;
  const draft: AttributionDraft = {
    gclid: clean(params.get("gclid"), 512),
    gbraid: clean(params.get("gbraid"), 512),
    wbraid: clean(params.get("wbraid"), 512),
    gclAw: readCookie("_gcl_aw"),
    gclGb: readCookie("_gcl_gb"),
    gclDc: readCookie("_gcl_dc"),
    utmSource: clean(params.get("utm_source"), 120),
    utmMedium: clean(params.get("utm_medium"), 120),
    utmCampaign: clean(params.get("utm_campaign"), 240),
    utmTerm: clean(params.get("utm_term"), 240),
    utmContent: clean(params.get("utm_content"), 240),
    landingPage: clean(`${url.pathname}${url.search}`, 600),
    referrer: clean(document.referrer, 600),
  };

  const hasAttribution = Boolean(
    draft.gclid ||
      draft.gbraid ||
      draft.wbraid ||
      draft.gclAw ||
      draft.gclGb ||
      draft.gclDc ||
      draft.utmSource ||
      draft.utmMedium ||
      draft.utmCampaign ||
      draft.utmTerm ||
      draft.utmContent,
  );

  return hasAttribution ? draft : null;
}

function hasNewClickId(
  current: AttributionDraft,
  stored: OrderAttributionSnapshot | null,
): boolean {
  return Boolean(
    (current.gclid && current.gclid !== stored?.gclid) ||
      (current.gbraid && current.gbraid !== stored?.gbraid) ||
      (current.wbraid && current.wbraid !== stored?.wbraid),
  );
}

export function captureGoogleAdsAttribution(): OrderAttributionSnapshot | null {
  const stored = readStored();
  const current = fromCurrentBrowserState();
  if (!current) return stored;

  const now = new Date().toISOString();
  const resetSource = !stored || hasNewClickId(current, stored);
  const attribution: OrderAttributionSnapshot = {
    ...(resetSource ? {} : stored),
    ...current,
    capturedAt: resetSource ? now : stored.capturedAt,
    lastSeenAt: now,
  };

  writeStored(attribution);
  return attribution;
}

export function getStoredOrderAttribution(): OrderAttributionSnapshot | undefined {
  return captureGoogleAdsAttribution() ?? undefined;
}
