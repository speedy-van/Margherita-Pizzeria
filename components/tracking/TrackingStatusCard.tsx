"use client";

import { Badge, Box, HStack, Heading, Stack, Text } from "@chakra-ui/react";

import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { PublicTrackingSummary } from "@/lib/tracking/types";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export interface TrackingStatusCardProps {
  summary: PublicTrackingSummary;
  lastCheckedAt: Date | null;
  isRefreshing: boolean;
  networkWarning: boolean;
}

export function TrackingStatusCard({
  summary,
  lastCheckedAt,
  isRefreshing,
  networkWarning,
}: TrackingStatusCardProps) {
  const statusLabel =
    ORDER_STATUS_LABELS[summary.status] ?? summary.status;
  const typeLabel = summary.type === "delivery" ? "Delivery" : "Collection";
  const shortRef =
    summary.reference ?? summary.orderId.slice(0, 8).toUpperCase();

  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.subtle"
      padding={{ base: 5, md: 6 }}
    >
      <Stack gap={3}>
        <HStack justify="space-between" gap={3} flexWrap="wrap">
          <Text
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            Order #{shortRef}
          </Text>
          <Badge
            colorPalette={summary.canTrackDriver ? "orange" : "gray"}
            variant="subtle"
          >
            {typeLabel}
          </Badge>
        </HStack>
        <Heading as="h2" size="md" color="fg.default">
          {statusLabel}
        </Heading>
        <Text color="fg.muted">{summary.message}</Text>
        {summary.estimatedTime ? (
          <Text fontSize="sm" color="fg.default">
            {summary.estimatedTime}
          </Text>
        ) : null}

        <Stack gap={1} fontSize="sm" color="fg.muted">
          {summary.driverLocation ? (
            <Text>
              Last driver update:{" "}
              <Text as="span" color="fg.default">
                {formatTime(summary.driverLocation.updatedAt)}
              </Text>
            </Text>
          ) : summary.canTrackDriver ? (
            <Text>Live driver location will appear here shortly.</Text>
          ) : summary.type === "collection" ? (
            <Text>Collection orders are tracked by status, not by map.</Text>
          ) : (
            <Text>Driver tracking will start once your order is out for delivery.</Text>
          )}
          {lastCheckedAt ? (
            <Text>
              {isRefreshing
                ? "Checking for driver updates…"
                : `Updated ${formatTime(lastCheckedAt.toISOString())}`}
            </Text>
          ) : null}
          {networkWarning ? (
            <Text color="brand.fg">
              We&apos;re having trouble refreshing. Showing the last known status.
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
