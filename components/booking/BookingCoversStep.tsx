"use client";

import { Button, HStack, Stack, Text } from "@chakra-ui/react";

export interface BookingCoversStepProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

export function BookingCoversStep({
  value,
  onChange,
  min = 1,
  max = 12,
}: BookingCoversStepProps) {
  const options: number[] = [];
  for (let i = min; i <= max; i += 1) options.push(i);

  return (
    <Stack gap={2}>
      <Text fontSize="sm" color="fg.default">
        Number of covers
      </Text>
      <HStack
        gap={2}
        flexWrap="wrap"
        role="radiogroup"
        aria-label="Number of covers"
      >
        {options.map((n) => {
          const active = value === n;
          return (
            <Button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              variant="plain"
              minW="44px"
              height="auto"
              paddingBlock={2}
              paddingInline={3}
              borderRadius="full"
              borderWidth="1px"
              borderColor={active ? "brand.solid" : "border"}
              bg={active ? "brand.subtle" : "bg.subtle"}
              color={active ? "brand.fg" : "fg.default"}
              cursor="pointer"
              fontSize="sm"
              fontWeight="600"
              _hover={{ borderColor: "brand.solid" }}
            >
              {n}
            </Button>
          );
        })}
      </HStack>
      <Text fontSize="xs" color="fg.muted">
        Each table seats up to 4. We&apos;ll match the smallest table that fits
        your party.
      </Text>
    </Stack>
  );
}
