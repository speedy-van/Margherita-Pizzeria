import type { Metadata } from "next";

import { HomeCtaBand } from "@/components/home/HomeCtaBand";
import { HomeDiscountBanner } from "@/components/home/HomeDiscountBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { LocalStoryBand } from "@/components/home/LocalStoryBand";
import { PizzaShowcase } from "@/components/home/PizzaShowcase";
import { ReviewsBand } from "@/components/home/ReviewsBand";
import { ServiceCards } from "@/components/home/ServiceCards";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getActiveBannerDiscount } from "@/lib/discounts/queries";
import { getImagesBySection } from "@/lib/admin/queries";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Sourdough Pizza, Halal, in Dennistoun | Margherita Pizzeria",
  description:
    "Authentic Italian sourdough pizza on Alexandra Parade, Dennistoun. 24-hour stone-baked dough, halal certified. Free delivery in G31, £3.99 outside (up to 4 miles). Order online or call 0141 378 0909.",
  path: "/",
  keywords: getKeywordsForPath("/"),
});

export default async function HomePage() {
  const [banner, heroImages] = await Promise.all([
    getActiveBannerDiscount().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("[home] getActiveBannerDiscount failed:", err);
      return null;
    }),
    getImagesBySection("hero"),
  ]);
  const heroImageUrl = heroImages[0]?.url ?? null;

  return (
    <>
      <HomeDiscountBanner discount={banner} />
      <HomeHero backgroundImageUrl={heroImageUrl} />
      <TrustStrip />
      <PizzaShowcase />
      <ServiceCards />
      <LocalStoryBand />
      <ReviewsBand />
      <HomeCtaBand />
    </>
  );
}
