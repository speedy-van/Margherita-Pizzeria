"use client";

import { Box, Button, HStack, Spinner, Stack, Text } from "@chakra-ui/react";

export interface BookingSubmitBarProps {
  disabled: boolean;
  disabledReason?: string;
  loading: boolean;
  submitLabel: string;
  onSubmit: () => void;
}

export function BookingSubmitBar({
  disabled,
  disabledReason,
  loading,
  submitLabel,
  onSubmit,
}: BookingSubmitBarProps) {
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
        <HStack justify="flex-end">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={disabled || loading}
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
            size="lg"
            width={{ base: "full", md: "auto" }}
          >
            {loading ? <Spinner size="sm" /> : submitLabel}
          </Button>
        </HStack>
        {disabled && disabledReason && !loading ? (
          <Text fontSize="xs" color="fg.muted" textAlign={{ base: "center", md: "right" }}>
            {disabledReason}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
