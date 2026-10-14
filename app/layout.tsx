import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";

import { GoogleAdsAttributionCapture } from "@/components/analytics/GoogleAdsAttributionCapture";
import { AppShell } from "@/components/layout/AppShell";
import { RestaurantJsonLd } from "@/components/seo/RestaurantJsonLd";
import { WebSiteJsonLd } from "@/components/seo/WebSiteJsonLd";
import { Provider } from "@/components/ui/Provider";
import { getGaMeasurementId, getGoogleAdsId } from "@/lib/analytics/gtag";
import { siteConfig } from "@/lib/config/site";
import { primaryKeywords } from "@/lib/seo/keywords";
import { baseOpenGraph, canonicalUrl } from "@/lib/seo/metadata";
import {
  DEFAULT_OPENING_HOURS,
  getOpeningHours,
} from "@/lib/utils/shop-hours";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FCFBF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url || "https://www.margheritapizza.uk"),
  title: {
    default: `${siteConfig.name} — Sourdough Pizza, Halal, Dennistoun`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...primaryKeywords],
  alternates: { canonical: canonicalUrl("/") },
  openGraph: {
    ...baseOpenGraph,
    title: `${siteConfig.name} — Sourdough Pizza, Halal, Dennistoun`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Sourdough Pizza, Halal, Dennistoun`,
    description: siteConfig.description,
  },
  robots: {
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
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = getGaMeasurementId();
  const adsId = getGoogleAdsId();
  const primaryGtagId = gaId ?? adsId;
  const openingHours = await getOpeningHours().catch(() => DEFAULT_OPENING_HOURS);

  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>
        <Provider>
          <GoogleAdsAttributionCapture />
          <AppShell openingHours={openingHours}>{children}</AppShell>
        </Provider>
        <RestaurantJsonLd />
        <WebSiteJsonLd />
        {primaryGtagId ? (
          <>
            {/*
             * Plain <script> with dangerouslySetInnerHTML renders as a real
             * synchronous <script> tag in the server HTML — the only reliable
             * way to guarantee window.gtag is defined before React hydrates
             * and any useEffect fires. The Next.js <Script> component with
             * strategy="beforeInteractive" serialises inline content into
             * self.__next_s (a streaming queue) rather than a real <script>
             * tag, so window.gtag is never defined synchronously.
             *
             * The heavy gtag.js loader stays deferred (afterInteractive).
             */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){window.dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  ${gaId ? `gtag('config', '${gaId}');` : ""}
                  ${adsId ? `gtag('config', '${adsId}');` : ""}
                `,
              }}
            />
            <Script
              id="gtag-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${primaryGtagId}`}
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
