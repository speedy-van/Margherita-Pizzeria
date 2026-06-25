"use client";

import { Box, Grid, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { OrderStatusControls } from "@/components/admin/OrderStatusControls";
import type { AdminOrderDetail } from "@/lib/admin/types";

function formatPence(p: number): string {
  return `£${(p / 100).toFixed(2)}`;
}
function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.subtle"
      padding={5}
    >
      <Stack gap={3}>
        <Heading as="h2" size="sm" color="fg.default">
          {title}
        </Heading>
        {children}
      </Stack>
    </Box>
  );
}

export interface OrderDetailAdminClientProps {
  order: AdminOrderDetail;
}

export function OrderDetailAdminClient({ order }: OrderDetailAdminClientProps) {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
          Order {order.reference ?? order.id.slice(0, 8)}
        </Heading>
        <HStack gap={3} flexWrap="wrap">
          <AdminStatusBadge status={order.status} />
          <NextLink
            href={`/admin/invoices/${order.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 32,
              paddingInline: 12,
              borderRadius: 6,
              border: "1px solid var(--chakra-colors-border)",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            View invoice
          </NextLink>
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          Placed {formatDateTime(order.createdAt)} · Updated{" "}
          {formatDateTime(order.updatedAt)}
        </Text>
      </Stack>

      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={4}>
        <Card title="Items">
          <Stack gap={3}>
            {order.items.map((item, i) => (
              <Box
                key={`${item.menuItemId}-${i}`}
                borderTopWidth={i === 0 ? "0" : "1px"}
                borderColor="border"
                paddingTop={i === 0 ? 0 : 3}
              >
                <Text fontWeight="600">
                  {item.quantity} × {item.name}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {formatPence(item.unitPricePence)} each ·{" "}
                  {formatPence(item.totalPence)}
                </Text>
                {item.allergens.length > 0 ? (
                  <Text fontSize="xs" color="fg.muted">
                    Allergens: {item.allergens.join(", ")}
                  </Text>
                ) : null}
              </Box>
            ))}
          </Stack>
        </Card>

        <Card title="Totals">
          <Stack gap={2} fontSize="sm">
            <Box display="flex" justifyContent="space-between">
              <Text color="fg.muted">Subtotal</Text>
              <Text>{formatPence(order.subtotalPence)}</Text>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Text color="fg.muted">Delivery fee</Text>
              <Text>{formatPence(order.deliveryFeePence)}</Text>
            </Box>
            <Box display="flex" justifyContent="space-between" fontWeight="700">
              <Text>Total</Text>
              <Text>{formatPence(order.totalPence)}</Text>
            </Box>
            <Box display="flex" justifyContent="space-between" color="fg.muted">
              <Text>Payment</Text>
              <Text>{order.paymentMethod}</Text>
            </Box>
            <Box display="flex" justifyContent="space-between" color="fg.muted">
              <Text>Type</Text>
              <Text>{order.type}</Text>
            </Box>
            {order.estimatedTime ? (
              <Box display="flex" justifyContent="space-between" color="fg.muted">
                <Text>Estimated</Text>
                <Text>{order.estimatedTime}</Text>
              </Box>
            ) : null}
          </Stack>
        </Card>

        <Card title="Customer">
          <Stack gap={1} fontSize="sm">
            <Text fontWeight="600">{order.customerName}</Text>
            <Text color="fg.muted">{order.customerEmail}</Text>
            <Text color="fg.muted">{order.customerPhone}</Text>
            {order.address ? (
              <Text color="fg.muted">{order.address}</Text>
            ) : null}
          </Stack>
        </Card>

        <Card title="Status">
          <OrderStatusControls
            orderId={order.id}
            currentStatus={order.status}
            orderType={order.type}
          />
        </Card>
      </Grid>
    </Stack>
  );
}
