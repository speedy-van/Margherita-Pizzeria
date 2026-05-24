"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";

const FILTERABLE_ALLERGENS = [
  "gluten",
  "milk",
  "egg",
  "nuts",
  "peanuts",
  "sesame",
  "soy",
  "sulphites",
] as const;

export interface MenuFiltersProps {
  selectedAllergensToAvoid: string[];
  onToggleAllergen: (allergen: string) => void;
  showOnlyAvailable: boolean;
  onToggleAvailable: (next: boolean) => void;
}

export function MenuFilters({
  selectedAllergensToAvoid,
  onToggleAllergen,
  showOnlyAvailable,
  onToggleAvailable,
}: MenuFiltersProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.subtle"
      padding={{ base: 4, md: 5 }}
    >
      <Stack gap={4}>
        <Stack gap={2}>
          <Heading as="h2" size="sm" color="fg.default">
            Hide items containing…
          </Heading>
          <Text fontSize="xs" color="fg.muted">
            Pick any allergens you want to avoid. Items containing them will be
            hidden from the menu below.
          </Text>
        </Stack>

        <HStack gap={2} flexWrap="wrap" role="group" aria-label="Allergens to avoid">
          {FILTERABLE_ALLERGENS.map((a) => {
            const selected = selectedAllergensToAvoid.includes(a);
            return (
              <Button
                key={a}
                type="button"
                size="xs"
                onClick={() => onToggleAllergen(a)}
                aria-pressed={selected}
                bg={selected ? "brand.solid" : "transparent"}
                color={selected ? "brand.contrast" : "fg.default"}
                borderWidth="1px"
                borderColor={selected ? "brand.solid" : "border"}
                borderRadius="full"
                paddingInline="3"
                textTransform="capitalize"
                _hover={{
                  bg: selected ? "brand.emphasized" : "bg.muted",
                }}
              >
                {a}
              </Button>
            );
          })}
        </HStack>

        <Switch.Root
          checked={showOnlyAvailable}
          onCheckedChange={(d) => onToggleAvailable(d.checked)}
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label color="fg.default" fontSize="sm">
            Only show items available right now
          </Switch.Label>
        </Switch.Root>
      </Stack>
    </Box>
  );
}
