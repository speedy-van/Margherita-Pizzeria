import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";
import type { Metadata } from "next";

import { LandingConversionEvents } from "@/components/landing/LandingConversionEvents";
import { OrderSuccessPanel } from "@/components/order/OrderSuccessPanel";
import { PageShell } from "@/components/ui/PageShell";
import { buildEnhancedConversionUserData } from "@/lib/analytics/enhanced-conversions";
import {
  getOrderConversionCustomerData,
  getPublicOrderSummary,
} from "@/lib/orders/queries";
import { isOrderPaidOrBeyond } from "@/lib/orders/status";
import { verifyStripeCheckoutSession } from "@/lib/stripe/checkout";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Order Confirmed | Margherita Pizzeria",
  description:
    "Your order from Margherita Pizzeria has been confirmed. We're getting it ready now.",
  path: "/order/success",
  noIndex: true,
});

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string; session_id?: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function OrderNotFound() {
  return (
    <PageShell
      eyebrow="Not found"
      title="Order not found"
      description="We couldn't find this order. If you've just placed an order, please check your confirmation email."
    >
      <HStack marginTop={4} gap={3} flexWrap="wrap">
        <NextLink href="/order" style={{ textDecoration: "none" }}>
          <Button
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
          >
            Back to order
          </Button>
        </NextLink>
        <NextLink href="/menu" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            View menu
          </Button>
        </NextLink>
      </HStack>
    </PageShell>
  );
}

interface PaymentPendingProps {
  orderId: string;
  sessionId?: string;
}

function PaymentPending({ orderId, sessionId }: PaymentPendingProps) {
  const refreshHref = sessionId
    ? `/order/success?orderId=${orderId}&session_id=${sessionId}`
    : `/order/success?orderId=${orderId}`;

  return (
    <PageShell
      eyebrow="Payment pending"
      title="Payment confirmation pending"
      description="Your payment is still being confirmed. This usually takes a few seconds — please refresh the page or check your confirmation email."
    >
      <HStack marginTop={4} gap={3} flexWrap="wrap">
        <NextLink href={refreshHref} style={{ textDecoration: "none" }}>
          <Button
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
          >
            Refresh status
          </Button>
        </NextLink>
        <NextLink href="/menu" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Return to menu
          </Button>
        </NextLink>
      </HStack>
    </PageShell>
  );
}

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId, session_id } = await searchParams;

  // Guard 1: orderId must be a valid UUID.
  if (typeof orderId !== "string" || !UUID_RE.test(orderId)) {
    return <OrderNotFound />;
  }

  // Guard 2: order must exist in the database.
  let summary = null;
  try {
    summary = await getPublicOrderSummary(orderId);
  } catch (err: unknown) {
    console.error("[/order/success] fetch failed:", err);
  }

  if (!summary) {
    return <OrderNotFound />;
  }

  // Guard 3: payment must be confirmed before showing the success UI or
  // firing any conversion event.
  //
  // Fast path: DB status already reflects payment (webhook has fired).
  let paymentConfirmed = isOrderPaidOrBeyond(summary.status);

  // Slow path: Stripe redirect arrives before the webhook updates the DB.
  // Verify the Stripe session directly using the server-side Stripe key —
  // never trust the session_id to prove payment on its own; we check both
  // payment_status and that metadata.orderId matches.
  if (
    !paymentConfirmed &&
    typeof session_id === "string" &&
    session_id.startsWith("cs_")
  ) {
    try {
      const { paid, orderIdMatches } = await verifyStripeCheckoutSession(
        session_id,
        orderId,
    );
    paymentConfirmed = paid && orderIdMatches;
  } catch (err: unknown) {
    console.error("[/order/success] Stripe session verify failed:", err);
  }
  }

  if (!paymentConfirmed) {
    return <PaymentPending orderId={orderId} sessionId={session_id} />;
  }

  const conversionCustomerData = await getOrderConversionCustomerData(orderId);
  const enhancedConversionUserData = buildEnhancedConversionUserData({
    customerName: conversionCustomerData?.customerName,
    customerEmail: conversionCustomerData?.customerEmail,
    customerPhone: conversionCustomerData?.customerPhone,
    address: conversionCustomerData?.address,
  });

  return (
    <PageShell
      eyebrow="Confirmed"
      title="Thanks — your order is in."
      description="You'll receive an email receipt shortly. Times are estimates and may shift during busy periods."
    >
      {/*
       * LandingConversionEvents fires the Google Ads Purchase event exactly once.
       * It is only rendered here, behind all three payment guards above, so it
       * never fires for unpaid or non-existent orders.
       */}
      <LandingConversionEvents
        type="order"
        orderId={orderId}
        transactionId={summary.reference ?? summary.id}
        value={summary.totalPence / 100}
        items={summary.items.map((item) => ({
          item_id: item.menuItemId,
          item_name: item.name,
          price: item.unitPricePence / 100,
          quantity: item.quantity,
        }))}
        enhancedConversionUserData={enhancedConversionUserData}
      />
      <OrderSuccessPanel order={summary} />
    </PageShell>
  );
}
