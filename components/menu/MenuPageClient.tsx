"use client";

import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { useCallback, useMemo, useState } from "react";

import { MenuCartButton } from "@/components/menu/MenuCartButton";
import { MenuCartDrawer } from "@/components/menu/MenuCartDrawer";
import { MenuCategoryTabs } from "@/components/menu/MenuCategoryTabs";
import { MenuFilters } from "@/components/menu/MenuFilters";
import { MenuGrid } from "@/components/menu/MenuGrid";
import { useMenuCart } from "@/hooks/useMenuCart";
import type {
  AddToCartInput,
  PublicMenuCategory,
  PublicMenuResponse,
} from "@/lib/menu/types";

export interface MenuPageClientProps {
  initialMenu: PublicMenuResponse;
}

export function MenuPageClient({ initialMenu }: MenuPageClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all",
  );
  const [selectedAllergensToAvoid, setSelectedAllergensToAvoid] = useState<
    string[]
  >([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useMenuCart();

  const handleToggleAllergen = useCallback((allergen: string) => {
    setSelectedAllergensToAvoid((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen],
    );
  }, []);

  const handleAdd = useCallback(
    (input: AddToCartInput) => {
      cart.addItem(input, 1);
      setCartOpen(true);
    },
    [cart],
  );

  const filteredCategories = useMemo<PublicMenuCategory[]>(() => {
    const allergenSet = new Set(
      selectedAllergensToAvoid.map((a) => a.toLowerCase()),
    );

    return initialMenu.categories
      .filter(
        (c) => selectedCategoryId === "all" || c.id === selectedCategoryId,
      )
      .map((c) => ({
        ...c,
        items: c.items.filter((item) => {
          if (showOnlyAvailable && !item.available) return false;
          if (allergenSet.size > 0) {
            const hits = item.allergens.some((a) =>
              allergenSet.has(a.toLowerCase()),
            );
            if (hits) return false;
          }
          return true;
        }),
      }));
  }, [
    initialMenu.categories,
    selectedAllergensToAvoid,
    selectedCategoryId,
    showOnlyAvailable,
  ]);

  return (
    <>
      <Stack gap={{ base: 6, md: 8 }}>
        <HStack
          justify="space-between"
          align="center"
          gap={3}
          flexWrap="wrap"
        >
          <Box>
            <Text fontSize="sm" color="fg.muted">
              {initialMenu.categories.reduce(
                (sum, c) => sum + c.items.length,
                0,
              )}{" "}
              dishes from our stone-baked sourdough kitchen.
            </Text>
          </Box>
          <Box display={{ base: "none", md: "block" }}>
            <MenuCartButton
              variant="inline"
              totalQuantity={cart.totalQuantity}
              subtotalPence={cart.subtotalPence}
              onOpen={() => setCartOpen(true)}
            />
          </Box>
        </HStack>

        <MenuCategoryTabs
          categories={initialMenu.categories.map((c) => ({
            id: c.id,
            name: c.name,
          }))}
          selectedCategoryId={selectedCategoryId}
          onChange={setSelectedCategoryId}
        />

        <MenuFilters
          selectedAllergensToAvoid={selectedAllergensToAvoid}
          onToggleAllergen={handleToggleAllergen}
          showOnlyAvailable={showOnlyAvailable}
          onToggleAvailable={setShowOnlyAvailable}
        />

        {initialMenu.categories.length === 0 ? (
          <Box
            borderWidth="1px"
            borderColor="border"
            borderRadius="xl"
            padding={{ base: 6, md: 10 }}
            textAlign="center"
            bg="bg.subtle"
          >
            <Heading as="h2" size="md" color="fg.default" marginBottom={2}>
              Menu coming soon
            </Heading>
            <Text color="fg.muted">
              We&apos;re finalising the menu. Please check back shortly.
            </Text>
          </Box>
        ) : (
          <MenuGrid categories={filteredCategories} onAdd={handleAdd} />
        )}

        {/* Mobile-only spacer so the sticky cart button never overlaps content. */}
        <Box
          aria-hidden
          height={{ base: cart.totalQuantity > 0 ? "20" : "0", md: "0" }}
        />
      </Stack>

      <MenuCartButton
        variant="sticky"
        totalQuantity={cart.totalQuantity}
        subtotalPence={cart.subtotalPence}
        onOpen={() => setCartOpen(true)}
      />

      <MenuCartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart.items}
        subtotalPence={cart.subtotalPence}
        totalQuantity={cart.totalQuantity}
        onIncrease={cart.increase}
        onDecrease={cart.decrease}
        onRemove={cart.removeItem}
        onClear={cart.clear}
      />
    </>
  );
}
