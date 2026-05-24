"use client";

import { useEffect, useRef } from "react";

import {
  trackCollectionLandingConversion,
  trackOrderLandingConversion,
} from "@/lib/analytics/conversion-events";

export interface LandingConversionEventsProps {
  type: "order" | "collection";
  transactionId?: string;
  value?: number;
}

/**
 * Fires the appropriate Google Ads / GA4 conversion exactly once on mount.
 * Safe to render even when analytics envs are not configured — the underlying
 * helpers will no-op. Strict-mode double-invocation is guarded by a ref.
 */
export function LandingConversionEvents({
  type,
  transactionId,
  value,
}: LandingConversionEventsProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const numeric =
      typeof value === "number" && Number.isFinite(value) ? value : undefined;

    if (type === "order") {
      trackOrderLandingConversion(transactionId, numeric);
    } else {
      trackCollectionLandingConversion(transactionId, numeric);
    }
  }, [type, transactionId, value]);

  return null;
}
