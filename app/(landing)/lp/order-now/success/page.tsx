import type { Metadata } from "next";

import { LandingConversionEvents } from "@/components/landing/LandingConversionEvents";
import { LandingShell } from "@/components/landing/LandingShell";
import { LandingSuccessPanel } from "@/components/landing/LandingSuccessPanel";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Thanks | Margherita Pizzeria",
  description: "Thanks for your interest — finish your order on the next step.",
  path: "/lp/order-now/success",
  noIndex: true,
});

interface PageProps {
  searchParams: Promise<{
    converted?: string;
    transactionId?: string;
    value?: string;
    orderId?: string;
  }>;
}

function parseValue(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export default async function OrderNowSuccessLandingPage({
  searchParams,
}: PageProps) {
  const { converted, transactionId, value, orderId } = await searchParams;
  const isConverted = converted === "1";
  const numericValue = parseValue(value);

  return (
    <LandingShell>
      {isConverted ? (
        <LandingConversionEvents
          type="order"
          transactionId={transactionId}
          value={numericValue}
        />
      ) : null}
      <LandingSuccessPanel orderId={orderId} converted={isConverted} />
    </LandingShell>
  );
}
