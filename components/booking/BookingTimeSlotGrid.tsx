"use client";

import { Box, Button, Stack, Text } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export interface BookingTimeSlotGridProps {
  loading: boolean;
  slots: ReadonlyArray<{
    time: string;
    available: boolean;
    remainingTables: number;
  }>;
  selected: string | null;
  onSelect: (time: string) => void;
  emptyMessage?: string;
}

export function BookingTimeSlotGrid({
  loading,
  slots,
  selected,
  onSelect,
  emptyMessage = "No slots available for this date and party size.",
}: BookingTimeSlotGridProps) {
  if (loading) {
    return (
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(96px, 1fr))"
        gap={2}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} height="44px" radius="md" />
        ))}
      </Box>
    );
  }

  if (slots.length === 0) {
    return (
      <Box
        role="status"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        bg="bg.subtle"
        padding={4}
      >
        <Text fontSize="sm" color="fg.muted" textAlign="center">
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap={3} role="radiogroup" aria-label="Booking time">
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(96px, 1fr))"
        gap={2}
      >
        {slots.map((s) => {
          const active = selected === s.time;
          const disabled = !s.available;
          return (
            <Button
              key={s.time}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={disabled}
              disabled={disabled}
              onClick={() => {
                if (!disabled) onSelect(s.time);
              }}
              variant="plain"
              height="auto"
              paddingBlock={2}
              paddingInline={3}
              borderRadius="md"
              borderWidth="1px"
              borderColor={active ? "brand.solid" : "border"}
              bg={
                disabled
                  ? "bg.muted"
                  : active
                    ? "brand.subtle"
                    : "bg.subtle"
              }
              color={
                disabled
                  ? "fg.muted"
                  : active
                    ? "brand.fg"
                    : "fg.default"
              }
              cursor={disabled ? "not-allowed" : "pointer"}
              opacity={disabled ? 0.55 : 1}
              fontSize="sm"
              fontWeight="600"
              transition="border-color .15s, background-color .15s"
              _hover={disabled ? undefined : { borderColor: "brand.solid" }}
            >
              <Stack gap={0} align="center">
                <Text fontSize="sm" fontWeight="700">
                  {s.time}
                </Text>
                <Text fontSize="2xs" color={active ? "brand.fg" : "fg.muted"}>
                  {disabled
                    ? "Full"
                    : `${s.remainingTables} ${s.remainingTables === 1 ? "table" : "tables"}`}
                </Text>
              </Stack>
            </Button>
          );
        })}
      </Box>
    </Stack>
  );
}
