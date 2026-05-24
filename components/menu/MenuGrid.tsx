"use client";

import { Box, Heading, SimpleGrid, Stack } from "@chakra-ui/react";

import { EmptyState } from "@/components/ui/EmptyState";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import type {
  AddToCartInput,
  PublicMenuCategory,
} from "@/lib/menu/types";

export interface MenuGridProps {
  categories: PublicMenuCategory[];
  onAdd: (input: AddToCartInput) => void;
}

export function MenuGrid({ categories, onAdd }: MenuGridProps) {
  const visible = categories.filter((c) => c.items.length > 0);

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No items match your filters"
        description="Try removing an allergen filter or switching back to All categories."
      />
    );
  }

  return (
    <Stack gap={{ base: 10, md: 14 }}>
      {visible.map((category) => (
        <Box key={category.id} as="section" aria-labelledby={`cat-${category.id}`}>
          <Heading
            as="h2"
            id={`cat-${category.id}`}
            fontFamily="heading"
            fontSize={{ base: "2xl", md: "3xl" }}
            color="fg.default"
            marginBottom={{ base: 4, md: 6 }}
          >
            {category.name}
          </Heading>
          <SimpleGrid
            columns={{ base: 1, sm: 2, lg: 3 }}
            gap={{ base: 4, md: 5 }}
          >
            {category.items.map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={onAdd} />
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </Stack>
  );
}
