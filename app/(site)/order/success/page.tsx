import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";
import type { Metadata } from "next";

import { OrderSuccessPanel } from "@/components/order/OrderSuccessPanel";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";
import { getPublicOrderSummary } from "@/lib/orders/queries";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Order confirmed",
  description: "Thanks for your order — we'll get to work straight away.",
  path: "/order/success",
  noIndex: true,
});

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId } = await searchParams;
  const valid = typeof orderId === "string" && UUID_RE.test(orderId);
  let summary = null;
  let fetchError = false;
  if (valid && orderId) {
    try {
      summary = await getPublicOrderSummary(orderId);
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("[/order/success] fetch failed:", err);
      fetchError = true;
    }
  }

  if (!valid || fetchError || !summary) {
    return (
      <PageShell
        eyebrow="Order"
        title="We couldn't find that order"
        description="The order reference is missing or invalid. If you've just paid, check your email for the confirmation link."
      >
        <ErrorState
          title="Order not found"
          description="Try opening the link from your confirmation email, or head back to the menu."
        />
        <HStack marginTop={4} gap={3} flexWrap="wrap">
          <NextLink href="/menu" style={{ textDecoration: "none" }}>
            <Button
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
            >
              Browse the menu
            </Button>
          </NextLink>
          <NextLink href="/" style={{ textDecoration: "none" }}>
            <Button variant="outline" borderColor="border" color="fg.default">
              Back to home
            </Button>
          </NextLink>
        </HStack>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Confirmed"
      title="Thanks — your order is in."
      description="You'll receive an email receipt shortly. Times are estimates and may shift during busy periods."
    >
      <OrderSuccessPanel order={summary} />
    </PageShell>
  );
}
