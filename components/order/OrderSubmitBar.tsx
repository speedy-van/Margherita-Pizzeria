"use client";

import { Box, Button, HStack, Spinner, Stack, Text } from "@chakra-ui/react";

import { formatGBPFromPence } from "@/lib/utils/currency";

export interface OrderSubmitBarProps {
  totalPence: number;
  disabled: boolean;
  disabledReason?: string;
  loading: boolean;
  submitLabel: string;
  onSubmit: () => void;
}

export function OrderSubmitBar({
  totalPence,
  disabled,
  disabledReason,
  loading,
  submitLabel,
  onSubmit,
}: OrderSubmitBarProps) {
  return (
    <Box
      position={{ base: "sticky", md: "static" }}
      bottom={0}
      bg="bg"
      borderTopWidth={{ base: "1px", md: "0" }}
      borderColor="border"
      paddingBlock={{ base: 3, md: 0 }}
      paddingInline={{ base: 4, md: 0 }}
      marginTop={{ base: 0, md: 2 }}
      zIndex={5}
    >
      <Stack gap={2}>
        <HStack justify="space-between" align="baseline" gap={3}>
          <Text fontSize="sm" color="fg.muted">
            Total (preview)
          </Text>
          <Text fontWeight="700" color="fg.default" fontSize="lg">
            {formatGBPFromPence(totalPence)}
          </Text>
        </HStack>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
          bg="brand.solid"
          color="brand.contrast"
          _hover={{ bg: "brand.emphasized" }}
          size="lg"
          width="full"
        >
          {loading ? <Spinner size="sm" /> : submitLabel}
        </Button>
        {disabled && disabledReason && !loading ? (
          <Text fontSize="xs" color="fg.muted" textAlign="center">
            {disabledReason}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
