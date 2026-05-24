"use client";

import { Box, Button, HStack, Stack, Text } from "@chakra-ui/react";

import { EmptyState } from "@/components/ui/EmptyState";
import type { CollectionSlotOption } from "@/lib/orders/types";

export interface CollectionSlotStepProps {
  slots: CollectionSlotOption[];
  value: string; // "asap" or "HH:mm"
  onChange: (value: string) => void;
}

export function CollectionSlotStep({
  slots,
  value,
  onChange,
}: CollectionSlotStepProps) {
  if (slots.length === 0 && value !== "asap") {
    return (
      <EmptyState
        title="No collection slots available"
        description="Choose ASAP collection or try again shortly."
      />
    );
  }

  return (
    <Stack gap={3} role="radiogroup" aria-label="Collection time">
      <SlotButton
        active={value === "asap"}
        label="ASAP"
        hint="As soon as it's ready"
        onClick={() => onChange("asap")}
      />
      {slots.length > 0 ? (
        <Stack gap={2}>
          <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.1em">
            Or pick a time
          </Text>
          <HStack gap={2} flexWrap="wrap">
            {slots.map((s) => (
              <SlotChip
                key={s.id}
                time={s.time}
                active={value === s.time}
                onClick={() => onChange(s.time)}
              />
            ))}
          </HStack>
        </Stack>
      ) : null}
    </Stack>
  );
}

function SlotButton({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      variant="plain"
      height="auto"
      width="full"
      justifyContent="flex-start"
      textAlign="left"
      paddingBlock={3}
      paddingInline={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={active ? "brand.solid" : "border"}
      bg={active ? "brand.subtle" : "bg.subtle"}
      color="fg.default"
      _hover={{ borderColor: "brand.solid" }}
    >
      <Box>
        <Text fontWeight="700">{label}</Text>
        <Text fontSize="xs" color="fg.muted">
          {hint}
        </Text>
      </Box>
    </Button>
  );
}

function SlotChip({
  time,
  active,
  onClick,
}: {
  time: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      variant="plain"
      size="sm"
      paddingBlock={2}
      paddingInline={3}
      borderRadius="full"
      borderWidth="1px"
      borderColor={active ? "brand.solid" : "border"}
      bg={active ? "brand.subtle" : "bg.subtle"}
      color={active ? "brand.fg" : "fg.default"}
      fontSize="sm"
      _hover={{ borderColor: "brand.solid" }}
    >
      {time}
    </Button>
  );
}
