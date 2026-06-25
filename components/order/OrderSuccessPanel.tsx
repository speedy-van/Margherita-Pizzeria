"use client";

import {
  Box,
  Button,
  HStack,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";

import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { PublicOrderSummary } from "@/lib/orders/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export interface OrderSuccessPanelProps {
  order: PublicOrderSummary;
}

export function OrderSuccessPanel({ order }: OrderSuccessPanelProps) {
  const isDelivery = order.type === "delivery";
  const statusLabel = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status;
  const paymentLabel =
    order.paymentMethod === "stripe_card"
      ? "Card (paid online)"
      : "Cash on delivery/collection";

  return (
    <Stack gap={{ base: 6, md: 8 }}>
      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        bg="bg.subtle"
        padding={{ base: 5, md: 6 }}
      >
        <Stack gap={3}>
          <Heading as="h2" size="md" color="fg.default">
            {statusLabel}
          </Heading>
          {order.estimatedTime ? (
            <Text color="fg.muted">{order.estimatedTime}</Text>
          ) : null}
          <Text fontSize="sm" color="fg.muted">
            {isDelivery ? "Delivery to" : "Collection from"}:{" "}
            <Text as="span" color="fg.default">
              {order.address ?? "652 Alexandra Parade, Glasgow, G31 3BU"}
            </Text>
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Payment: <Text as="span" color="fg.default">{paymentLabel}</Text>
          </Text>
        </Stack>
      </Box>

      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        bg="bg.subtle"
        padding={{ base: 5, md: 6 }}
      >
        <Stack gap={3}>
          <Heading as="h3" size="sm" color="fg.default">
            Items
          </Heading>
          <Stack gap={2}>
            {order.items.map((item) => (
              <HStack key={item.menuItemId} justify="space-between" gap={3}>
                <Text fontSize="sm" color="fg.default">
                  {item.quantity}× {item.name}
                </Text>
                <Text fontSize="sm" color="fg.default">
                  {formatGBPFromPence(item.totalPence)}
                </Text>
              </HStack>
            ))}
          </Stack>
          <Box borderTopWidth="1px" borderColor="border" paddingTop={3}>
            <HStack justify="space-between">
              <Text fontSize="sm" color="fg.muted">Subtotal</Text>
              <Text fontSize="sm" color="fg.default">{formatGBPFromPence(order.subtotalPence)}</Text>
            </HStack>
            {order.deliveryFeePence > 0 ? (
              <HStack justify="space-between">
                <Text fontSize="sm" color="fg.muted">Delivery fee</Text>
                <Text fontSize="sm" color="fg.default">{formatGBPFromPence(order.deliveryFeePence)}</Text>
              </HStack>
            ) : null}
            {order.discountPence > 0 ? (
              <HStack justify="space-between">
                <Text fontSize="sm" color="fg.muted">
                  Discount{order.discountCode ? ` (${order.discountCode})` : ""}
                </Text>
                <Text fontSize="sm" color="fg.default">
                  -{formatGBPFromPence(order.discountPence)}
                </Text>
              </HStack>
            ) : null}
            <HStack justify="space-between" paddingTop={2}>
              <Text fontWeight="700" color="fg.default">Total</Text>
              <Text fontWeight="700" color="fg.default">{formatGBPFromPence(order.totalPence)}</Text>
            </HStack>
          </Box>
        </Stack>
      </Box>

      <HStack gap={3} flexWrap="wrap">
        {isDelivery ? (
          <NextLink href={{ pathname: `/track/${order.id}` }} style={{ textDecoration: "none" }}>
            <Button
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
            >
              Track delivery
            </Button>
          </NextLink>
        ) : null}
        <NextLink href="/menu" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Back to menu
          </Button>
        </NextLink>
      </HStack>
    </Stack>
  );
}
