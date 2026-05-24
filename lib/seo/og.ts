import { ImageResponse } from "next/og";
import React from "react";

import { brandColors, siteConfig } from "@/lib/config/site";

/**
 * Shared constants + helper for OG / Twitter image generation via Next.js
 * `next/og` `ImageResponse`. We intentionally do not load remote fonts or
 * external image assets so these routes work offline and in CI.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

export const ogColors = {
  background: brandColors.nearBlack,
  surface: brandColors.charcoal,
  textPrimary: brandColors.offWhite,
  textMuted: brandColors.warmGrey,
  crimson: brandColors.crimson,
  amber: brandColors.amber,
} as const;

export interface OgTextContent {
  /** Eyebrow line shown above the title (e.g. "Menu", "Book a table"). */
  eyebrow?: string;
  /** Big page-specific title shown in the centre. */
  title: string;
  /** Optional supporting line shown beneath the title. */
  subtitle?: string;
  /** Show the 4.9★ from 74 reviews badge. */
  showRating?: boolean;
}

type CSSProps = React.CSSProperties;

function el(
  style: CSSProps,
  ...children: React.ReactNode[]
): React.ReactElement {
  return React.createElement("div", { style }, ...children);
}

/**
 * Render a branded OG image. Pure system fonts (no font fetching) so this
 * works in any runtime, including offline builds.
 */
export function renderOgImage(content: OgTextContent): ImageResponse {
  const { eyebrow, title, subtitle, showRating } = content;

  const container: CSSProps = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: `linear-gradient(135deg, ${ogColors.background} 0%, ${ogColors.surface} 100%)`,
    color: ogColors.textPrimary,
    padding: "72px 80px",
    fontFamily:
      "Inter, 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif",
  };

  const brand: CSSProps = {
    display: "flex",
    alignItems: "center",
    gap: 18,
    fontSize: 30,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: ogColors.textMuted,
  };

  const accentBar: CSSProps = {
    display: "flex",
    width: 96,
    height: 8,
    borderRadius: 4,
    background: `linear-gradient(90deg, ${ogColors.crimson}, ${ogColors.amber})`,
  };

  const brandName: CSSProps = {
    display: "flex",
    color: ogColors.textPrimary,
    fontWeight: 700,
    letterSpacing: 2,
  };

  const middle: CSSProps = {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  const eyebrowStyle: CSSProps = {
    display: "flex",
    fontSize: 28,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: ogColors.amber,
  };

  const titleStyle: CSSProps = {
    display: "flex",
    fontSize: title.length > 32 ? 76 : 96,
    fontWeight: 700,
    lineHeight: 1.05,
    letterSpacing: -1,
    color: ogColors.textPrimary,
  };

  const subtitleStyle: CSSProps = {
    display: "flex",
    fontSize: 30,
    color: ogColors.textMuted,
    marginTop: 16,
  };

  const footer: CSSProps = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    fontSize: 26,
    color: ogColors.textMuted,
  };

  const addressLine: CSSProps = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const ratingBadge: CSSProps = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 18px",
    borderRadius: 999,
    background: ogColors.crimson,
    color: ogColors.textPrimary,
    fontSize: 24,
    fontWeight: 600,
  };

  const tree = el(
    container,
    el(brand, el(accentBar), el(brandName, siteConfig.name)),
    el(
      middle,
      eyebrow ? el(eyebrowStyle, eyebrow) : null,
      el(titleStyle, title),
      subtitle ? el(subtitleStyle, subtitle) : null,
    ),
    el(
      footer,
      el(
        addressLine,
        el({ display: "flex" }, "652 Alexandra Parade"),
        el(
          { display: "flex", color: ogColors.textMuted, fontSize: 22 },
          "Glasgow · G31 3BU",
        ),
      ),
      showRating
        ? el(
            ratingBadge,
            `${siteConfig.rating} / 5 - ${siteConfig.reviewCount} Google reviews`,
          )
        : el(
            { display: "flex", color: ogColors.amber, fontSize: 24 },
            "margheritapizza.uk",
          ),
    ),
  );

  return new ImageResponse(tree, {
    width: OG_SIZE.width,
    height: OG_SIZE.height,
  });
}
