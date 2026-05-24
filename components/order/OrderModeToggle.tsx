"use client";

import { Button, HStack, Text } from "@chakra-ui/react";

import type { OrderMode } from "@/lib/orders/types";

export interface OrderModeToggleProps {
  mode: OrderMode;
  onChange: (mode: OrderMode) => void;
  disabled?: boolean;
}

interface Option {
  value: OrderMode;
  label: string;
  hint: string;
}

const OPTIONS: ReadonlyArray<Option> = [
  { value: "delivery", label: "Delivery", hint: "Within 5 miles of G31" },
  { value: "collection", label: "Collection", hint: "From Alexandra Parade" },
];

export function OrderModeToggle({
  mode,
  onChange,
  disabled,
}: OrderModeToggleProps) {
  return (
    <HStack
      role="radiogroup"
      aria-label="Order type"
      gap={2}
      padding={1}
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.subtle"
      width="full"
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            flex="1"
            bg={active ? "brand.solid" : "transparent"}
            color={active ? "brand.contrast" : "fg.default"}
            _hover={{ bg: active ? "brand.emphasized" : "bg.muted" }}
            borderRadius="md"
            height="auto"
            paddingBlock={3}
            display="flex"
            flexDirection="column"
            gap={0}
          >
            <Text fontWeight="700" fontSize="sm">
              {opt.label}
            </Text>
            <Text
              fontSize="xs"
              color={active ? "brand.contrast" : "fg.muted"}
              opacity={active ? 0.9 : 1}
            >
              {opt.hint}
            </Text>
          </Button>
        );
      })}
    </HStack>
  );
}
