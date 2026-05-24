"use client";

import { Box, Button, Stack, Text } from "@chakra-ui/react";

import type { OrderMode, PaymentMethod } from "@/lib/orders/types";

export interface PaymentMethodStepProps {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  orderMode: OrderMode;
}

export function PaymentMethodStep({
  value,
  onChange,
  orderMode,
}: PaymentMethodStepProps) {
  const cashHint =
    orderMode === "delivery"
      ? "Pay the driver in cash when your order arrives."
      : "Pay in cash at the counter when you collect.";

  return (
    <Stack gap={3} role="radiogroup" aria-label="Payment method">
      <Option
        active={value === "stripe_card"}
        title="Card payment"
        hint="Secure payment via Stripe. You'll be redirected to checkout."
        onClick={() => onChange("stripe_card")}
      />
      <Option
        active={value === "cash_on_delivery"}
        title="Cash"
        hint={cashHint}
        onClick={() => onChange("cash_on_delivery")}
      />
    </Stack>
  );
}

function Option({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      variant="plain"
      height="auto"
      width="full"
      justifyContent="flex-start"
      textAlign="left"
      paddingBlock={3}
      paddingInline={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={active ? "brand.solid" : "border"}
      bg={active ? "brand.subtle" : "bg.subtle"}
      color="fg.default"
      _hover={{ borderColor: "brand.solid" }}
    >
      <Box>
        <Text fontWeight="700">{title}</Text>
        <Text fontSize="xs" color="fg.muted">
          {hint}
        </Text>
      </Box>
    </Button>
  );
}
