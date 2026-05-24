"use client";

import { Badge } from "@chakra-ui/react";

import type { BookingStatus, OrderStatus } from "@/types/database";

type AnyStatus = OrderStatus | BookingStatus;

const STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  // orders
  pending_payment: { bg: "yellow.100", color: "yellow.900", label: "Pending payment" },
  received: { bg: "blue.100", color: "blue.900", label: "Received" },
  making: { bg: "orange.100", color: "orange.900", label: "Making" },
  ready: { bg: "purple.100", color: "purple.900", label: "Ready" },
  out_for_delivery: { bg: "teal.100", color: "teal.900", label: "Out for delivery" },
  delivered: { bg: "green.100", color: "green.900", label: "Delivered" },
  cancelled: { bg: "gray.200", color: "gray.800", label: "Cancelled" },
  rejected: { bg: "red.100", color: "red.900", label: "Rejected" },
  // bookings
  pending: { bg: "yellow.100", color: "yellow.900", label: "Pending" },
  confirmed: { bg: "green.100", color: "green.900", label: "Confirmed" },
  completed: { bg: "gray.200", color: "gray.800", label: "Completed" },
};

export interface AdminStatusBadgeProps {
  status: AnyStatus | string;
}

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  const style = STYLES[status] ?? {
    bg: "gray.100",
    color: "gray.900",
    label: status,
  };
  return (
    <Badge
      bg={style.bg}
      color={style.color}
      paddingInline={2.5}
      paddingBlock={1}
      borderRadius="md"
      textTransform="none"
      fontWeight="600"
      fontSize="xs"
    >
      {style.label}
    </Badge>
  );
}
