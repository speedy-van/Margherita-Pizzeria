import type { Metadata } from "next";

import { siteConfig } from "@/lib/config/site";
import { getCanonicalUrl } from "@/lib/seo/routes";
import type { SeoPageConfig } from "@/types/site";

/**
 * Build an absolute URL for the given site-relative path.
 *
 * Kept as a thin re-export so legacy imports of `canonicalUrl` continue to
 * work — the canonical implementation lives in `lib/seo/routes.ts`.
 */
export function canonicalUrl(path: string): string {
  return getCanonicalUrl(path);
}

/**
 * Per-route Open Graph image is served by the page's `opengraph-image.tsx`
 * route handler. The root `/opengraph-image` covers the home page and acts
 * as a fallback for any page that doesn't supply its own.
 */
const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

export const baseOpenGraph = {
  type: "website" as const,
  siteName: siteConfig.name,
  locale: "en_GB",
  url: canonicalUrl("/"),
  images: [
    {
      url: canonicalUrl(DEFAULT_OG_IMAGE_PATH),
      width: 1200,
      height: 630,
      alt: `${siteConfig.name} — sourdough pizza, halal, Dennistoun`,
    },
  ],
};

export function createPageMetadata(config: SeoPageConfig): Metadata {
  const url = canonicalUrl(config.path);
  const ogImage = config.ogImage ?? canonicalUrl(DEFAULT_OG_IMAGE_PATH);
  const keywords =
    config.keywords && config.keywords.length > 0
      ? [...config.keywords]
      : undefined;

  return {
    title: config.title,
    description: config.description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    robots: config.noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: config.title,
      description: config.description,
      url,
      siteName: siteConfig.name,
      locale: "en_GB",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [ogImage],
    },
  };
}
