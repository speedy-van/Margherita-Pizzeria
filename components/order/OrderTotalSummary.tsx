"use client";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";

import type { OrderMode } from "@/lib/orders/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export interface OrderTotalSummaryProps {
  orderMode: OrderMode;
  subtotalPence: number;
  deliveryFeePence: number;
  minDeliveryOrderPence: number;
  discountPence?: number;
  discountCode?: string | null;
}

export function OrderTotalSummary({
  orderMode,
  subtotalPence,
  deliveryFeePence,
  minDeliveryOrderPence,
  discountPence = 0,
  discountCode = null,
}: OrderTotalSummaryProps) {
  const isDelivery = orderMode === "delivery";
  const discountClamped = Math.max(
    0,
    Math.min(discountPence, subtotalPence + (isDelivery ? deliveryFeePence : 0)),
  );
  const totalPence =
    subtotalPence + (isDelivery ? deliveryFeePence : 0) - discountClamped;
  const belowMin = isDelivery && subtotalPence < minDeliveryOrderPence;

  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.subtle"
      padding={{ base: 4, md: 5 }}
    >
      <Stack gap={2}>
        <HStack justify="space-between">
          <Text color="fg.muted" fontSize="sm">
            Subtotal
          </Text>
          <Text color="fg.default" fontSize="sm">
            {formatGBPFromPence(subtotalPence)}
          </Text>
        </HStack>
        {isDelivery ? (
          <HStack justify="space-between">
            <Text color="fg.muted" fontSize="sm">
              Delivery fee
            </Text>
            <Text color="fg.default" fontSize="sm">
              {formatGBPFromPence(deliveryFeePence)}
            </Text>
          </HStack>
        ) : null}
        {discountClamped > 0 ? (
          <HStack justify="space-between">
            <Text color="fg.muted" fontSize="sm">
              Discount{discountCode ? ` (${discountCode})` : ""}
            </Text>
            <Text color="fg.default" fontSize="sm">
              -{formatGBPFromPence(discountClamped)}
            </Text>
          </HStack>
        ) : null}
        <HStack
          justify="space-between"
          paddingTop={2}
          borderTopWidth="1px"
          borderColor="border"
        >
          <Text fontWeight="700" color="fg.default">
            Total (preview)
          </Text>
          <Text fontWeight="700" color="fg.default">
            {formatGBPFromPence(totalPence)}
          </Text>
        </HStack>

        {belowMin ? (
          <Box
            role="alert"
            borderRadius="md"
            borderWidth="1px"
            borderColor="brand.muted"
            bg="brand.subtle"
            padding={3}
            marginTop={1}
          >
            <Text fontSize="sm" color="fg.default">
              Minimum delivery order is {formatGBPFromPence(minDeliveryOrderPence)}. Add a little more or switch to collection.
            </Text>
          </Box>
        ) : null}

        <Text fontSize="xs" color="fg.muted" paddingTop={1}>
          Your total is re-verified securely on our server before the order is placed.
        </Text>
      </Stack>
    </Box>
  );
}
