import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";

import { OrderPageClient } from "@/components/order/OrderPageClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";
import { siteConfig } from "@/lib/config/site";
import { db } from "@/lib/db/client";
import { timeSlots } from "@/lib/db/schema";
import { getOrderSettings } from "@/lib/orders/pricing";
import type { CollectionSlotOption } from "@/lib/orders/types";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Order Pizza Online Glasgow | Delivery or Collection",
  description:
    "Order pizza online from Margherita Pizzeria for delivery within 5 miles of G31 or collection from Alexandra Parade.",
  path: "/order",
  keywords: getKeywordsForPath("/order"),
});

interface LoadedData {
  settings: { minDeliveryOrderPence: number; deliveryFeePence: number };
  slots: CollectionSlotOption[];
}

async function loadOrderPageData(): Promise<LoadedData> {
  const [settings, slotRows] = await Promise.all([
    getOrderSettings(),
    db
      .select({ id: timeSlots.id, time: timeSlots.time })
      .from(timeSlots)
      .where(and(eq(timeSlots.type, "collection"), eq(timeSlots.active, true)))
      .orderBy(asc(timeSlots.time)),
  ]);
  return {
    settings: {
      minDeliveryOrderPence: settings.minDeliveryOrderPence,
      deliveryFeePence: settings.deliveryFeePence,
    },
    slots: slotRows.map((s) => ({ id: s.id, time: s.time })),
  };
}

export default async function OrderPage() {
  let data: LoadedData | null = null;
  let fetchError = false;
  try {
    data = await loadOrderPageData();
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/order] loadOrderPageData failed:", err);
    fetchError = true;
  }

  return (
    <PageShell
      eyebrow="Checkout"
      title="Review your order"
      description={`Final step before we start cooking. Choose delivery (within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}) or collection from ${siteConfig.address}, then pay by card or cash.`}
      maxW="container.xl"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Order", path: "/order" },
        ]}
      />
      {fetchError || !data ? (
        <ErrorState
          title="We couldn't load the order page"
          description="Please try again in a moment. If it keeps happening, get in touch."
        />
      ) : (
        <OrderPageClient
          initialSettings={data.settings}
          collectionSlots={data.slots}
        />
      )}
    </PageShell>
  );
}
