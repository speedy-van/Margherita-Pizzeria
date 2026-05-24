"use client";

import { Box, HStack, Heading, Stack, Text } from "@chakra-ui/react";

import { formatGBPFromPence } from "@/lib/utils/currency";

export interface BookingSummaryCardProps {
  date: string;
  timeSlot: string | null;
  covers: number;
  depositEnabled: boolean;
  depositAmountPence: number;
  payDeposit: boolean;
}

export function BookingSummaryCard({
  date,
  timeSlot,
  covers,
  depositEnabled,
  depositAmountPence,
  payDeposit,
}: BookingSummaryCardProps) {
  const depositLine = !depositEnabled
    ? "No deposit required"
    : payDeposit
      ? `Deposit ${formatGBPFromPence(depositAmountPence)} due now`
      : `Deposit ${formatGBPFromPence(depositAmountPence)} (skipped)`;

  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.subtle"
      padding={{ base: 4, md: 5 }}
    >
      <Stack gap={3}>
        <Heading as="h2" size="sm" color="fg.default">
          Booking summary
        </Heading>
        <Row label="Date" value={date || "—"} />
        <Row label="Time" value={timeSlot ?? "Select a time"} />
        <Row label="Covers" value={String(covers)} />
        <Row label="Deposit" value={depositLine} />
        <Text fontSize="xs" color="fg.muted">
          We&apos;ll send a confirmation email once your booking has been
          reviewed. Your table is assigned automatically.
        </Text>
      </Stack>
    </Box>
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
