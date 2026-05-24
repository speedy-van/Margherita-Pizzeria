"use client";

import { Input, Stack, Text } from "@chakra-ui/react";

export interface BookingDateStepProps {
  value: string; // "YYYY-MM-DD"
  onChange: (next: string) => void;
  minDate: string;
  maxDate: string;
  error?: string;
}

export function BookingDateStep({
  value,
  onChange,
  minDate,
  maxDate,
  error,
}: BookingDateStepProps) {
  return (
    <Stack gap={1} maxW={{ base: "100%", sm: "260px" }}>
      <label
        htmlFor="booking-date"
        style={{
          fontSize: "0.875rem",
          color: "var(--chakra-colors-fg-default)",
        }}
      >
        Date
      </label>
      <Input
        id="booking-date"
        type="date"
        value={value}
        min={minDate}
        max={maxDate}
        onChange={(e) => onChange(e.target.value)}
        bg="bg"
        borderColor={error ? "brand.solid" : "border"}
        color="fg.default"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "booking-date-error" : undefined}
      />
      {error ? (
        <Text id="booking-date-error" fontSize="xs" color="brand.fg">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
