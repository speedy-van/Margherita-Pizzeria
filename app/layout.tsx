import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";

import { AppShell } from "@/components/layout/AppShell";
import { RestaurantJsonLd } from "@/components/seo/RestaurantJsonLd";
import { WebSiteJsonLd } from "@/components/seo/WebSiteJsonLd";
import { Provider } from "@/components/ui/Provider";
import { getGaMeasurementId, getGoogleAdsId } from "@/lib/analytics/gtag";
import { siteConfig } from "@/lib/config/site";
import { primaryKeywords } from "@/lib/seo/keywords";
import { baseOpenGraph, canonicalUrl } from "@/lib/seo/metadata";

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
  themeColor: "#0D0D0D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url || "http://localhost:3000"),
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
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = getGaMeasurementId();
  const adsId = getGoogleAdsId();
  const primaryGtagId = gaId ?? adsId;

  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>
        <Provider>
          <AppShell>{children}</AppShell>
        </Provider>
        <RestaurantJsonLd />
        <WebSiteJsonLd />
        {primaryGtagId ? (
          <>
            <Script
              id="gtag-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${primaryGtagId}`}
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} 
                window.gtag = gtag;
                gtag('js', new Date());
                ${gaId ? `gtag('config', '${gaId}');` : ""}
                ${adsId ? `gtag('config', '${adsId}');` : ""}
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
