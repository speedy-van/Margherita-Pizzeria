import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";

import { OrderPageClient } from "@/components/order/OrderPageClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";
import { ShopClosedScreen } from "@/components/ui/ShopClosedScreen";
import { siteConfig } from "@/lib/config/site";
import { db } from "@/lib/db/client";
import { timeSlots } from "@/lib/db/schema";
import { getOrderSettings } from "@/lib/orders/pricing";
import type { CollectionSlotOption } from "@/lib/orders/types";
import { createPageMetadata } from "@/lib/seo/metadata";
import {
  computeShopStatus,
  getOpeningHours,
  type ShopStatus,
} from "@/lib/utils/shop-hours";
import type { OpeningHours } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Checkout | Margherita Pizzeria",
  description:
    "Final step before we start cooking. Choose delivery or collection and pay by card or cash.",
  path: "/order/checkout",
  noIndex: true,
});

interface LoadedData {
  settings: {
    acceptingOnlineOrders: boolean;
    collectionOpen: boolean;
    deliveryOpen: boolean;
    busyMode: "normal" | "busy" | "very_busy";
    customerMessage: string;
    minDeliveryOrderPence: number;
    deliveryFeePence: number;
  };
  slots: CollectionSlotOption[];
  openingHours: OpeningHours;
  initialShopStatus: ShopStatus;
}

async function loadOrderPageData(): Promise<LoadedData> {
  const [settings, slotRows, openingHours] = await Promise.all([
    getOrderSettings(),
    db
      .select({ id: timeSlots.id, time: timeSlots.time })
      .from(timeSlots)
      .where(and(eq(timeSlots.type, "collection"), eq(timeSlots.active, true)))
      .orderBy(asc(timeSlots.time)),
    getOpeningHours(),
  ]);
  return {
    settings: {
      acceptingOnlineOrders: settings.acceptingOnlineOrders,
      collectionOpen: settings.collectionOpen,
      deliveryOpen: settings.deliveryOpen,
      busyMode: settings.busyMode,
      customerMessage: settings.customerMessage,
      minDeliveryOrderPence: settings.minDeliveryOrderPence,
      deliveryFeePence: settings.deliveryFeePence,
    },
    slots: slotRows.map((s) => ({ id: s.id, time: s.time })),
    openingHours,
    initialShopStatus: computeShopStatus(new Date(), openingHours),
  };
}

export default async function OrderCheckoutPage() {
  let data: LoadedData | null = null;
  let fetchError = false;
  try {
    data = await loadOrderPageData();
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/order/checkout] loadOrderPageData failed:", err);
    fetchError = true;
  }

  return (
    <PageShell
      eyebrow={data && !data.initialShopStatus.isOpen ? "Closed" : "Checkout"}
      title={
        data && !data.initialShopStatus.isOpen
          ? "We're closed right now"
          : "Review your order"
      }
      description={
        data && !data.initialShopStatus.isOpen
          ? "Online ordering is paused until our next opening time. Our opening hours are below."
          : `Final step before we start cooking. Choose delivery (within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}) or collection from ${siteConfig.address}, then pay by card or cash.`
      }
      maxW="container.xl"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Order", path: "/order" },
          { name: "Checkout", path: "/order/checkout" },
        ]}
      />
      {fetchError || !data ? (
        <ErrorState
          title="We couldn't load the checkout page"
          description="Please try again in a moment. If it keeps happening, get in touch."
        />
      ) : !data.initialShopStatus.isOpen ? (
        <ShopClosedScreen
          openingHours={data.openingHours}
          initialShopStatus={data.initialShopStatus}
        />
      ) : (
        <OrderPageClient
          initialSettings={data.settings}
          collectionSlots={data.slots}
          openingHours={data.openingHours}
          initialShopStatus={data.initialShopStatus}
        />
      )}
    </PageShell>
  );
}
