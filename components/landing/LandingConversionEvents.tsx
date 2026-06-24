"use client";

import { useEffect, useRef } from "react";

import {
  getOrderConversionPixelUrl,
  type PurchaseConversionItem,
  trackCollectionLandingConversion,
  trackOrderLandingConversion,
  trackSubscribeConversion,
} from "@/lib/analytics/conversion-events";
import type { EnhancedConversionUserData } from "@/lib/analytics/gtag";

export interface LandingConversionEventsProps {
  type: "order" | "collection" | "subscribe";
  /** Used as the sessionStorage dedup key — prevents re-firing on refresh. */
  orderId: string;
  transactionId?: string;
  value?: number;
  items?: PurchaseConversionItem[];
  enhancedConversionUserData?: EnhancedConversionUserData;
}

export function LandingConversionEvents({
  type,
  orderId,
  transactionId,
  value,
  items,
  enhancedConversionUserData,
}: LandingConversionEventsProps) {
  const completed = useRef(false);

  useEffect(() => {
    if (completed.current) return;

    const storageKey = `ads_purchase_sent_${orderId}`;
    let storedValue: string | null = null;
    try {
      storedValue = sessionStorage.getItem(storageKey);
    } catch {
      // Treat blocked storage as empty and continue best-effort.
    }

    if (storedValue) return;

    const numeric =
      typeof value === "number" && Number.isFinite(value) ? value : undefined;

    const send = (): boolean => {
      if (type === "order") {
        return trackOrderLandingConversion(
          transactionId,
          numeric,
          items,
          enhancedConversionUserData,
        );
      }
      if (type === "subscribe") {
        return trackSubscribeConversion(orderId);
      }
      return trackCollectionLandingConversion(transactionId, numeric);
    };

    let attempts = 0;
    let timer: number | null = null;

    const trySend = () => {
      if (completed.current) return;
      attempts += 1;
      const sent = send();
      if (sent) {
        completed.current = true;
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {
          // best-effort
        }
        if (timer !== null) window.clearInterval(timer);
      } else if (attempts >= 30 && timer !== null) {
        window.clearInterval(timer);
      }
    };

    trySend();
    if (!completed.current) {
      timer = window.setInterval(trySend, 500);
    }

    return () => {
      if (timer !== null) window.clearInterval(timer);
    };
  }, [type, orderId, transactionId, value, items, enhancedConversionUserData]);

  const numeric =
    typeof value === "number" && Number.isFinite(value) ? value : undefined;
  const fallbackUrl =
    type === "order"
      ? getOrderConversionPixelUrl(transactionId, numeric)
      : null;

  if (!fallbackUrl) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        height="1"
        src={fallbackUrl}
        style={{ display: "none" }}
        width="1"
      />
    </noscript>
  );
}
