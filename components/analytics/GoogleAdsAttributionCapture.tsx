"use client";

import { useEffect } from "react";

import { captureGoogleAdsAttribution } from "@/lib/analytics/ad-attribution";

export function GoogleAdsAttributionCapture() {
  useEffect(() => {
    captureGoogleAdsAttribution();

    const lateCookieTimer = window.setTimeout(() => {
      captureGoogleAdsAttribution();
    }, 1500);

    const onPageShow = () => {
      captureGoogleAdsAttribution();
    };

    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearTimeout(lateCookieTimer);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
