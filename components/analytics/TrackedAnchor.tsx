"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import {
  trackLandingCallClick,
  trackLandingDirectionsClick,
  trackLandingWhatsAppClick,
  type EngagementSource,
} from "@/lib/analytics/conversion-events";

type TrackingEvent = "call" | "directions" | "whatsapp";

interface TrackedAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  trackingEvent: TrackingEvent;
  trackingSource: EngagementSource;
}

export function TrackedAnchor({
  children,
  onClick,
  trackingEvent,
  trackingSource,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        if (trackingEvent === "call") {
          trackLandingCallClick(trackingSource);
        } else if (trackingEvent === "directions") {
          trackLandingDirectionsClick(trackingSource);
        } else {
          trackLandingWhatsAppClick(trackingSource);
        }
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
