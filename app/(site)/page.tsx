import type { Metadata } from "next";

import { HomeCtaBand } from "@/components/home/HomeCtaBand";
import { HomeDiscountBanner } from "@/components/home/HomeDiscountBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { LiveStatusCard } from "@/components/home/LiveStatusCard";
import { LocalStoryBand } from "@/components/home/LocalStoryBand";
import { PizzaShowcase } from "@/components/home/PizzaShowcase";
import { ReviewsBand } from "@/components/home/ReviewsBand";
import { ServiceCards } from "@/components/home/ServiceCards";
import { TrustStrip } from "@/components/home/TrustStrip";
import { getActiveBannerDiscount } from "@/lib/discounts/queries";
import { getImagesBySection } from "@/lib/admin/queries";
import { getPublicMenu } from "@/lib/menu/queries";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";
import {
  DEFAULT_OPENING_HOURS,
  getOpeningHours,
} from "@/lib/utils/shop-hours";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Sourdough Pizza, Halal, in Dennistoun | Margherita Pizzeria",
  description:
    "Authentic Italian sourdough pizza on Alexandra Parade, Dennistoun. 24-hour stone-baked dough, halal certified. £3.99 flat delivery across Glasgow's East End (up to 4 miles). Order online or call +44 7746 870341.",
  path: "/",
  keywords: getKeywordsForPath("/"),
});

export default async function HomePage() {
  const [banner, heroImages, menu, openingHours] = await Promise.all([
    getActiveBannerDiscount().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("[home] getActiveBannerDiscount failed:", err);
      return null;
    }),
    getImagesBySection("hero"),
    getPublicMenu().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("[home] getPublicMenu failed:", err);
      return null;
    }),
    getOpeningHours().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("[home] getOpeningHours failed:", err);
      return DEFAULT_OPENING_HOURS;
    }),
  ]);
  const heroImageUrl = heroImages[0]?.url ?? null;
  const menuPreviewCategories =
    menu?.categories
      .filter((category) => category.items.length > 0)
      .map((category) => ({
        id: category.id,
        name: category.name,
        itemCount: category.items.length,
        imageUrl: category.items.find((item) => item.imageUrl)?.imageUrl ?? null,
      }))
      .sort((a, b) => {
        const imagePriority = Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl));
        if (imagePriority !== 0) return imagePriority;
        return b.itemCount - a.itemCount;
      })
      .slice(0, 4) ?? [];

  return (
    <>
      <HomeDiscountBanner discount={banner} />
      <HomeHero
        backgroundImageUrl={heroImageUrl}
        menuPreviewCategories={menuPreviewCategories}
      />
      <TrustStrip />
      <PizzaShowcase />
      <ServiceCards />
      <LocalStoryBand />
      <ReviewsBand />
      <HomeCtaBand />
      <LiveStatusCard openingHours={openingHours} />
    </>
  );
}
