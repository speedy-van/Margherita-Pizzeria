"use client";

import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { CollectionSlotStep } from "@/components/order/CollectionSlotStep";
import {
  CustomerDetailsStep,
  type CustomerDetails,
} from "@/components/order/CustomerDetailsStep";
import {
  DeliveryAddressStep,
  type ValidatedAddress,
} from "@/components/order/DeliveryAddressStep";
import { OrderCartSummary } from "@/components/order/OrderCartSummary";
import {
  OrderDiscountInput,
  type AppliedDiscount,
} from "@/components/order/OrderDiscountInput";
import { OrderModeToggle } from "@/components/order/OrderModeToggle";
import { OrderSubmitBar } from "@/components/order/OrderSubmitBar";
import { OrderTotalSummary } from "@/components/order/OrderTotalSummary";
import { PaymentMethodStep } from "@/components/order/PaymentMethodStep";
import { homeContent } from "@/lib/content/home";
import { useMenuCart } from "@/hooks/useMenuCart";
import type {
  CollectionSlotOption,
  CreateOrderInput,
  CreateOrderResponse,
  OrderMode,
  PaymentMethod,
} from "@/lib/orders/types";

export interface OrderPageClientProps {
  initialSettings: {
    minDeliveryOrderPence: number;
    deliveryFeePence: number;
  };
  collectionSlots: CollectionSlotOption[];
}

interface SubmissionState {
  loading: boolean;
  serverError: string | null;
  serverFieldErrors: Record<string, string> | null;
}

const INITIAL_SUBMIT_STATE: SubmissionState = {
  loading: false,
  serverError: null,
  serverFieldErrors: null,
};

export function OrderPageClient({
  initialSettings,
  collectionSlots,
}: OrderPageClientProps) {
  const router = useRouter();
  const search = useSearchParams();
  const cancelled = search.get("cancelled") === "1";
  const initialMode: OrderMode =
    search.get("mode") === "collection" ? "collection" : "delivery";

  const cart = useMenuCart();
  const [mode, setMode] = useState<OrderMode>(initialMode);
  const [addressText, setAddressText] = useState("");
  const [validated, setValidated] = useState<ValidatedAddress | null>(null);
  const [collectionTime, setCollectionTime] = useState<string>("asap");
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    email: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe_card");
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [submitState, setSubmitState] = useState<SubmissionState>(INITIAL_SUBMIT_STATE);

  const customerErrors = submitState.serverFieldErrors
    ? {
        name: submitState.serverFieldErrors.customerName,
        email: submitState.serverFieldErrors.customerEmail,
        phone: submitState.serverFieldErrors.customerPhone,
      }
    : undefined;

  const totalPreviewPence = useMemo(() => {
    const gross =
      cart.subtotalPence +
      (mode === "delivery" ? initialSettings.deliveryFeePence : 0);
    const discountPence = Math.max(
      0,
      Math.min(discount?.discountPence ?? 0, gross),
    );
    return gross - discountPence;
  }, [
    cart.subtotalPence,
    mode,
    initialSettings.deliveryFeePence,
    discount,
  ]);

  const deliveryBelowMin =
    mode === "delivery" &&
    cart.subtotalPence < initialSettings.minDeliveryOrderPence;

  const validationReady = useMemo(() => {
    if (cart.items.length === 0) return false;
    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim()) {
      return false;
    }
    if (mode === "delivery") {
      if (!validated || !validated.withinRadius) return false;
      if (deliveryBelowMin) return false;
    } else {
      if (!collectionTime) return false;
    }
    return true;
  }, [
    cart.items.length,
    customer.email,
    customer.name,
    customer.phone,
    mode,
    validated,
    deliveryBelowMin,
    collectionTime,
  ]);

  const disabledReason = useMemo(() => {
    if (cart.items.length === 0) return "Your cart is empty.";
    if (!customer.name.trim()) return "Add your name to continue.";
    if (!customer.email.trim()) return "Add your email to continue.";
    if (!customer.phone.trim()) return "Add your phone number to continue.";
    if (mode === "delivery") {
      if (!validated) return "Check your delivery address first.";
      if (!validated.withinRadius) return "Address is outside the delivery zone.";
      if (deliveryBelowMin) return "Cart subtotal is below the minimum delivery order.";
    } else if (!collectionTime) {
      return "Choose a collection time.";
    }
    return undefined;
  }, [
    cart.items.length,
    customer.email,
    customer.name,
    customer.phone,
    mode,
    validated,
    deliveryBelowMin,
    collectionTime,
  ]);

  const handleSubmit = useCallback(async () => {
    if (submitState.loading) return;
    setSubmitState({ loading: true, serverError: null, serverFieldErrors: null });

    const payload: CreateOrderInput = {
      type: mode,
      customerName: customer.name.trim(),
      customerEmail: customer.email.trim(),
      customerPhone: customer.phone.trim(),
      paymentMethod,
      cartItems: cart.items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
      })),
      ...(mode === "delivery" && validated
        ? {
            deliveryAddress: validated.address,
            deliveryLat: validated.lat,
            deliveryLng: validated.lng,
          }
        : {}),
      ...(mode === "collection"
        ? { collectionTime: collectionTime || "asap" }
        : {}),
      ...(discount ? { discountCode: discount.code } : {}),
    };

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as CreateOrderResponse;
      if (!json.ok) {
        setSubmitState({
          loading: false,
          serverError: json.error.message,
          serverFieldErrors: json.error.fields ?? null,
        });
        return;
      }

      if (json.data.paymentRequired) {
        // Hand off to Stripe — do NOT clear cart yet; webhook will mark order paid.
        window.location.href = json.data.checkoutUrl;
        return;
      }

      cart.clear();
      router.push(json.data.redirectUrl as `/order/success?orderId=${string}`);
    } catch {
      setSubmitState({
        loading: false,
        serverError: "Network problem — please try again.",
        serverFieldErrors: null,
      });
    }
  }, [
    cart,
    collectionTime,
    customer.email,
    customer.name,
    customer.phone,
    mode,
    paymentMethod,
    router,
    submitState.loading,
    validated,
    discount,
  ]);

  if (!cart.isHydrated) {
    return (
      <Box paddingBlock={6}>
        <Text color="fg.muted">Loading your cart…</Text>
      </Box>
    );
  }

  if (cart.items.length === 0) {
    return <EmptyCartPanel />;
  }

  const submitLabel =
    paymentMethod === "stripe_card" ? "Pay with card" : "Place order";

  return (
    <SimpleGrid columns={{ base: 1, lg: 12 }} gap={{ base: 6, lg: 8 }}>
      <Stack gap={6} gridColumn={{ base: "auto", lg: "span 7" }}>
        {cancelled ? (
          <Box
            role="status"
            borderWidth="1px"
            borderColor="brand.muted"
            bg="brand.subtle"
            borderRadius="md"
            padding={3}
          >
            <Text fontSize="sm" color="fg.default">
              Payment was cancelled. Nothing has been charged — adjust your order and try again when ready.
            </Text>
          </Box>
        ) : null}

        <Section title="1. Delivery or collection">
          <OrderModeToggle mode={mode} onChange={setMode} disabled={submitState.loading} />
        </Section>

        {mode === "delivery" ? (
          <Section title="2. Delivery address">
            <DeliveryAddressStep
              address={addressText}
              onAddressChange={setAddressText}
              validated={validated}
              onValidated={setValidated}
              externalError={submitState.serverFieldErrors?.deliveryAddress}
              onSwitchToCollection={() => setMode("collection")}
            />
          </Section>
        ) : (
          <Section title="2. Collection time">
            <CollectionSlotStep
              slots={collectionSlots}
              value={collectionTime}
              onChange={setCollectionTime}
            />
          </Section>
        )}

        <Section title="3. Your details">
          <CustomerDetailsStep
            value={customer}
            onChange={setCustomer}
            errors={customerErrors}
          />
        </Section>

        <Section title="4. Payment">
          <PaymentMethodStep
            value={paymentMethod}
            onChange={setPaymentMethod}
            orderMode={mode}
          />
        </Section>
      </Stack>

      <Stack gap={4} gridColumn={{ base: "auto", lg: "span 5" }}>
        <OrderCartSummary items={cart.items} subtotalPence={cart.subtotalPence} />
        <OrderDiscountInput
          orderMode={mode}
          subtotalPence={cart.subtotalPence}
          applied={discount}
          onApplied={setDiscount}
          disabled={submitState.loading}
        />
        <OrderTotalSummary
          orderMode={mode}
          subtotalPence={cart.subtotalPence}
          deliveryFeePence={initialSettings.deliveryFeePence}
          minDeliveryOrderPence={initialSettings.minDeliveryOrderPence}
          discountPence={discount?.discountPence ?? 0}
          discountCode={discount?.code ?? null}
        />
        {submitState.serverError ? (
          <Box
            role="alert"
            borderWidth="1px"
            borderColor="brand.muted"
            bg="brand.subtle"
            borderRadius="md"
            padding={3}
          >
            <Text fontSize="sm" color="fg.default">
              {submitState.serverError}
            </Text>
          </Box>
        ) : null}
        <OrderSubmitBar
          totalPence={totalPreviewPence}
          disabled={!validationReady}
          disabledReason={disabledReason}
          loading={submitState.loading}
          submitLabel={submitLabel}
          onSubmit={handleSubmit}
        />
      </Stack>
    </SimpleGrid>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap={3}>
      <Heading as="h2" size="sm" color="fg.default">
        {title}
      </Heading>
      {children}
    </Stack>
  );
}

// IDs from `homeContent.pizzas` to feature as inspiration when the cart is empty.
const FEATURED_PIZZA_IDS = ["margherita", "pepperoni", "vegetariana"] as const;

function EmptyCartPanel() {
  const featured = homeContent.pizzas.filter((p) =>
    (FEATURED_PIZZA_IDS as readonly string[]).includes(p.id),
  );

  return (
    <Stack gap={{ base: 8, md: 10 }}>
      <Box
        role="status"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        bg="bg.subtle"
        paddingBlock={{ base: 8, md: 12 }}
        paddingInline={{ base: 5, md: 8 }}
      >
        <Stack gap={5} align="center" textAlign="center" maxW="48ch" marginInline="auto">
          <Heading as="h2" size="lg" color="fg.default" fontFamily="heading">
            Your basket is empty
          </Heading>
          <Text color="fg.muted">
            Choose your pizzas from the menu first, then come back here to
            choose delivery, collection, and payment.
          </Text>
          <Stack
            direction={{ base: "column", sm: "row" }}
            gap={3}
            align="center"
            justify="center"
          >
            <NextLink href="/menu" style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.emphasized" }}
                minH="48px"
              >
                Start your order
              </Button>
            </NextLink>
            <NextLink href="/book" style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                variant="outline"
                borderColor="border"
                color="fg.default"
                _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
                minH="48px"
              >
                Book a table
              </Button>
            </NextLink>
          </Stack>
        </Stack>
      </Box>

      {featured.length > 0 ? (
        <Stack gap={4}>
          <Stack gap={1}>
            <Text
              textTransform="uppercase"
              letterSpacing="0.2em"
              fontSize="xs"
              color="brand.fg"
              fontWeight="700"
            >
              Customer favourites
            </Text>
            <Heading as="h3" size="md" color="fg.default" fontFamily="heading">
              Need inspiration?
            </Heading>
          </Stack>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 4, md: 5 }}>
            {featured.map((pizza) => (
              <Stack
                key={pizza.id}
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                padding={{ base: 5, md: 6 }}
                gap={3}
                justify="space-between"
              >
                <Stack gap={2}>
                  <Heading as="h4" size="sm" color="fg.default">
                    {pizza.name}
                  </Heading>
                  <Text color="brand.fg" fontSize="sm" fontWeight="600">
                    {pizza.tagline}
                  </Text>
                  <Text color="fg.muted" fontSize="sm">
                    {pizza.description}
                  </Text>
                </Stack>
                <Box>
                  <NextLink href="/menu" style={{ textDecoration: "none" }}>
                    <Button
                      variant="outline"
                      borderColor="border"
                      color="fg.default"
                      _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
                      size="sm"
                    >
                      View menu
                    </Button>
                  </NextLink>
                </Box>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}
    </Stack>
  );
}
