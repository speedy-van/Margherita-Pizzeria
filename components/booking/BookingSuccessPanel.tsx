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

import { bookingStatusLabel } from "@/lib/bookings/status";
import type { PublicBookingSummary } from "@/lib/bookings/types";

export interface BookingSuccessPanelProps {
  booking: PublicBookingSummary;
}

export function BookingSuccessPanel({ booking }: BookingSuccessPanelProps) {
  const statusLabel = bookingStatusLabel(booking.status);

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
          <Text
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            Booking #{booking.reference ?? booking.id.slice(0, 8)}
          </Text>
          <Heading as="h2" size="md" color="fg.default">
            {statusLabel}
          </Heading>
          <Text color="fg.muted">{booking.estimatedMessage}</Text>
          <Row label="Date" value={booking.date} />
          <Row label="Time" value={booking.timeSlot} />
          <Row label="Covers" value={String(booking.covers)} />
          <Row
            label="Deposit"
            value={booking.depositPaid ? "Paid" : "Not paid"}
          />
        </Stack>
      </Box>

      <HStack gap={3} flexWrap="wrap">
        <NextLink href="/menu" style={{ textDecoration: "none" }}>
          <Button
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
          >
            See the menu
          </Button>
        </NextLink>
        <NextLink href="/directions" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Get directions
          </Button>
        </NextLink>
      </HStack>
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <HStack justify="space-between" align="baseline" gap={3}>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default" fontWeight="600">
        {value}
      </Text>
    </HStack>
  );
}
