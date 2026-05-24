"use client";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";

import type { CartItem } from "@/lib/menu/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export interface OrderCartSummaryProps {
  items: CartItem[];
  subtotalPence: number;
}

export function OrderCartSummary({ items, subtotalPence }: OrderCartSummaryProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.subtle"
      padding={{ base: 4, md: 5 }}
    >
      <Stack gap={3}>
        <HStack justify="space-between" align="baseline">
          <Text fontFamily="heading" fontSize="lg" color="fg.default">
            Your order
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        </HStack>
        <Stack gap={2}>
          {items.map((item) => (
            <HStack
              key={item.menuItemId}
              justify="space-between"
              align="baseline"
              gap={3}
            >
              <Text fontSize="sm" color="fg.default">
                <strong>{item.quantity}×</strong> {item.name}
              </Text>
              <Text fontSize="sm" color="fg.default" fontWeight="600">
                {formatGBPFromPence(item.totalPence)}
              </Text>
            </HStack>
          ))}
        </Stack>
        <HStack
          justify="space-between"
          align="baseline"
          borderTopWidth="1px"
          borderColor="border"
          paddingTop={3}
        >
          <Text color="fg.muted" fontSize="sm">
            Subtotal (preview)
          </Text>
          <Text color="fg.default" fontWeight="700">
            {formatGBPFromPence(subtotalPence)}
          </Text>
        </HStack>
      </Stack>
    </Box>
  );
}
