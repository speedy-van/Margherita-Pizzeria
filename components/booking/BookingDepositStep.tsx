"use client";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";

import { formatGBPFromPence } from "@/lib/utils/currency";

export interface BookingDepositStepProps {
  depositEnabled: boolean;
  depositAmountPence: number;
  payDeposit: boolean;
  onChange: (next: boolean) => void;
}

export function BookingDepositStep({
  depositEnabled,
  depositAmountPence,
  payDeposit,
  onChange,
}: BookingDepositStepProps) {
  if (!depositEnabled || depositAmountPence <= 0) {
    return (
      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        bg="bg.subtle"
        padding={4}
      >
        <Text fontSize="sm" color="fg.muted">
          No deposit required today.
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap={3}>
      <label htmlFor="booking-deposit-toggle" style={{ display: "block", cursor: "pointer" }}>
        <Box
          borderWidth="1px"
          borderColor={payDeposit ? "brand.solid" : "border"}
          borderRadius="lg"
          bg={payDeposit ? "brand.subtle" : "bg.subtle"}
          padding={4}
        >
          <HStack gap={3} align="flex-start">
            <input
              id="booking-deposit-toggle"
              type="checkbox"
              aria-label={`Pay ${formatGBPFromPence(depositAmountPence)} deposit now`}
              checked={payDeposit}
              onChange={(e) => onChange(e.target.checked)}
            />
            <Stack gap={1}>
              <Text fontWeight="700" color="fg.default" fontSize="sm">
                Pay {formatGBPFromPence(depositAmountPence)} deposit now
              </Text>
              <Text fontSize="xs" color="fg.muted">
                The deposit is recorded against your booking request. It does
                not guarantee acceptance — we&apos;ll confirm your table by
                email.
              </Text>
            </Stack>
          </HStack>
        </Box>
      </label>
    </Stack>
  );
}
