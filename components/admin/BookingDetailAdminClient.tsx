"use client";

import { Box, Grid, Heading, Stack, Text } from "@chakra-ui/react";

import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { BookingStatusControls } from "@/components/admin/BookingStatusControls";
import type { AdminBookingDetail } from "@/lib/admin/types";

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

export interface BookingDetailAdminClientProps {
  booking: AdminBookingDetail;
}

export function BookingDetailAdminClient({
  booking,
}: BookingDetailAdminClientProps) {
  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
          Booking {booking.reference ?? booking.id.slice(0, 8)}
        </Heading>
        <Box>
          <AdminStatusBadge status={booking.status} />
        </Box>
        <Text fontSize="sm" color="fg.muted">
          Created {formatDateTime(booking.createdAt)} · Updated{" "}
          {formatDateTime(booking.updatedAt)}
        </Text>
      </Stack>
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
        <Card title="Reservation">
          <Stack gap={1.5} fontSize="sm">
            <Box display="flex" justifyContent="space-between">
              <Text color="fg.muted">Date</Text>
              <Text fontWeight="600">{booking.date}</Text>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Text color="fg.muted">Time</Text>
              <Text fontWeight="600">{booking.timeSlot}</Text>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Text color="fg.muted">Covers</Text>
              <Text fontWeight="600">{booking.covers}</Text>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Text color="fg.muted">Deposit</Text>
              <Text fontWeight="600">
                {booking.depositPaid ? "Paid" : "—"}
              </Text>
            </Box>
            {booking.tableId ? (
              <Box display="flex" justifyContent="space-between">
                <Text color="fg.muted">Table</Text>
                <Text fontWeight="600">{booking.tableId.slice(0, 8)}</Text>
              </Box>
            ) : null}
          </Stack>
        </Card>
        <Card title="Customer">
          <Stack gap={1} fontSize="sm">
            <Text fontWeight="600">{booking.customerName}</Text>
            <Text color="fg.muted">{booking.customerEmail}</Text>
            <Text color="fg.muted">{booking.customerPhone}</Text>
          </Stack>
        </Card>
        <Box gridColumn={{ md: "1 / -1" }}>
          <Card title="Status">
            <BookingStatusControls
              bookingId={booking.id}
              currentStatus={booking.status}
            />
          </Card>
        </Box>
      </Grid>
    </Stack>
  );
}
