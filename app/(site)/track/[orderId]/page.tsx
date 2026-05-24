import type { Metadata } from "next";

import { TrackingPageClient } from "@/components/tracking/TrackingPageClient";
import { TrackingUnavailable } from "@/components/tracking/TrackingUnavailable";
import { PageShell } from "@/components/ui/PageShell";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getPublicTrackingSummary } from "@/lib/tracking/queries";
import { validateOrderId } from "@/lib/tracking/validation";

export const dynamic = "force-dynamic";

interface TrackPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Track Your Order | Margherita Pizzeria",
    description: "Follow your delivery order from Margherita Pizzeria in Glasgow.",
    path: "/track",
    noIndex: true,
  });
}

export default async function TrackOrderPage({ params }: TrackPageProps) {
  const { orderId } = await params;
  const idResult = validateOrderId(orderId);

  if (!idResult.ok) {
    return (
      <PageShell
        eyebrow="Tracking"
        title="Track your order"
        description="Live updates from our kitchen and driver."
      >
        <TrackingUnavailable
          title="That tracking link doesn't look right"
          description="The order reference in the link is invalid. Check your confirmation email for the correct link."
        />
      </PageShell>
    );
  }

  const summary = await getPublicTrackingSummary(idResult.value);

  if (!summary) {
    return (
      <PageShell
        eyebrow="Tracking"
        title="Track your order"
        description="Live updates from our kitchen and driver."
      >
        <TrackingUnavailable
          title="We couldn't find that order"
          description="The link may have expired, or the order doesn't exist. Check your confirmation email for the latest link."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Tracking"
      title="Track your order"
      description={
        summary.type === "delivery"
          ? "Follow your delivery in real time. Updates refresh automatically."
          : "Follow your collection order status. We'll let you know when it's ready."
      }
    >
      <TrackingPageClient initialSummary={summary} />
    </PageShell>
  );
}

