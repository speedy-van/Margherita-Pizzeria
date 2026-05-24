"use client";

import { Box, HStack, Heading, Stack, Text } from "@chakra-ui/react";

import type {
  PublicTrackingSummary,
  TrackingOrderStatus,
} from "@/lib/tracking/types";

interface Step {
  key: TrackingOrderStatus;
  deliveryLabel: string;
  collectionLabel: string;
}

const STEPS: ReadonlyArray<Step> = [
  { key: "received", deliveryLabel: "Received", collectionLabel: "Received" },
  { key: "making", deliveryLabel: "In the oven", collectionLabel: "In the oven" },
  { key: "ready", deliveryLabel: "Ready", collectionLabel: "Ready to collect" },
  {
    key: "out_for_delivery",
    deliveryLabel: "Out for delivery",
    collectionLabel: "Ready to collect",
  },
  {
    key: "delivered",
    deliveryLabel: "Delivered",
    collectionLabel: "Collected",
  },
];

const STATUS_ORDER: Record<TrackingOrderStatus, number> = {
  pending_payment: -1,
  received: 0,
  making: 1,
  ready: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -2,
  rejected: -2,
};

export interface TrackingTimelineProps {
  summary: PublicTrackingSummary;
}

export function TrackingTimeline({ summary }: TrackingTimelineProps) {
  const { status, type } = summary;
  const isTerminalBad = status === "cancelled" || status === "rejected";
  const currentIndex = STATUS_ORDER[status] ?? -1;

  // For collection, hide the duplicate "out_for_delivery" row.
  const visibleSteps =
    type === "collection"
      ? STEPS.filter((s) => s.key !== "out_for_delivery")
      : STEPS;

  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.subtle"
      padding={{ base: 5, md: 6 }}
    >
      <Stack gap={4}>
        <Heading as="h3" size="sm" color="fg.default">
          Progress
        </Heading>

        {isTerminalBad ? (
          <Box
            role="status"
            borderWidth="1px"
            borderColor="brand.muted"
            borderRadius="lg"
            bg="brand.subtle"
            padding={4}
          >
            <Text color="fg.default" fontWeight="600">
              {status === "cancelled" ? "Order cancelled" : "Order rejected"}
            </Text>
            <Text color="fg.muted" fontSize="sm">
              This order is no longer being prepared. If you think this is wrong,
              please get in touch.
            </Text>
          </Box>
        ) : (
          <Stack as="ol" gap={3} listStyleType="none" padding={0} margin={0}>
            {visibleSteps.map((step, idx) => {
              const stepIndex = STATUS_ORDER[step.key];
              const done = currentIndex >= stepIndex && currentIndex >= 0;
              const isCurrent = step.key === status;
              const label =
                type === "collection" ? step.collectionLabel : step.deliveryLabel;
              const stateLabel = isCurrent
                ? "Current step"
                : done
                  ? "Completed"
                  : "Upcoming";

              return (
                <HStack
                  as="li"
                  key={`${step.key}-${idx}`}
                  gap={3}
                  align="flex-start"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <Box
                    aria-hidden
                    width="20px"
                    height="20px"
                    borderRadius="full"
                    borderWidth="2px"
                    borderColor={done ? "brand.solid" : "border"}
                    bg={done ? "brand.solid" : "transparent"}
                    flexShrink={0}
                    marginTop="2px"
                  />
                  <Stack gap={0}>
                    <Text
                      color="fg.default"
                      fontWeight={isCurrent ? "700" : "500"}
                    >
                      {label}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {stateLabel}
                    </Text>
                  </Stack>
                </HStack>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
