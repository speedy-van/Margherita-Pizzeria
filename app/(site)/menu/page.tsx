import type { Metadata } from "next";

import { MenuPageClient } from "@/components/menu/MenuPageClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { MenuJsonLd } from "@/components/seo/MenuJsonLd";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";
import { getPublicMenu } from "@/lib/menu/queries";
import type { PublicMenuResponse } from "@/lib/menu/types";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";
import {
  computeShopStatus,
  DEFAULT_OPENING_HOURS,
  getOpeningHours,
} from "@/lib/utils/shop-hours";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Pizza Menu Glasgow | Delivery, Collection & Dine-in",
  description:
    "Explore Margherita Pizzeria's pizza menu for delivery within 4 miles of G31, collection from Alexandra Parade, or dine-in.",
  path: "/menu",
  keywords: getKeywordsForPath("/menu"),
});

export default async function MenuPage() {
  // Load hours first and independently — never let it block the menu render.
  const openingHours = await getOpeningHours().catch(() => DEFAULT_OPENING_HOURS);
  const shopStatus = computeShopStatus(new Date(), openingHours);

  let menu: PublicMenuResponse | null = null;
  let fetchError = false;
  try {
    menu = await getPublicMenu();
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/menu] getPublicMenu failed:", err);
    fetchError = true;
  }

  return (
    <PageShell
      eyebrow="Menu"
      title="Sourdough pizzas, kebabs, burgers and more"
      description={
        shopStatus.isOpen
          ? "24-hour sourdough, hand-stretched, stone-baked. Halal certified. Full kitchen — pizzas, grills, shawarma, smashburgers, pasta and sides. £3.99 flat delivery across Glasgow's East End (up to 4 miles)."
          : "Browse the full menu now. Online ordering is paused until the next opening time, then delivery and collection will reopen."
      }
      heroBackgroundImage="/legacy/pizza-making-poster.jpg"
      heroBackgroundPosition="center"
      maxW="container.xl"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
        ]}
      />
      {fetchError || !menu ? (
        <ErrorState
          title="We couldn't load the menu"
          description="There was a problem reaching our kitchen system. Please try again in a moment."
        />
      ) : (
        <>
          <MenuJsonLd menu={menu} />
          <MenuPageClient
            initialMenu={menu}
            openingHours={openingHours}
            initialShopStatus={shopStatus}
          />
        </>
      )}
    </PageShell>
  );
}
