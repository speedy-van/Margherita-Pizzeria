"use client";

import { Box, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import {
  computeShopStatus,
  type ShopStatus,
} from "@/lib/utils/shop-hours";
import type { OpeningHours } from "@/types/database";

export interface MenuPageClientProps {
  initialMenu: PublicMenuResponse;
  openingHours: OpeningHours;
  initialShopStatus: ShopStatus;
}

const DAY_ORDER: { key: keyof OpeningHours; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function formatHours(open: string, close: string): string {
  const closeLabel = close === "00:00" ? "midnight" : close;
  return `${open} – ${closeLabel}`;
}

export function MenuPageClient({
  initialMenu,
  openingHours,
  initialShopStatus,
}: MenuPageClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all",
  );
  const [selectedAllergensToAvoid, setSelectedAllergensToAvoid] = useState<
    string[]
  >([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [shopStatus, setShopStatus] = useState<ShopStatus>(initialShopStatus);
  const [closedAttempt, setClosedAttempt] = useState(false);

  const cart = useMenuCart();

  useEffect(() => {
    const tick = () => setShopStatus(computeShopStatus(new Date(), openingHours));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [openingHours]);

  useEffect(() => {
    const categoryIds = new Set(initialMenu.categories.map((category) => category.id));

    const applyHashCategory = () => {
      const hash = window.location.hash;
      if (!hash) {
        setSelectedCategoryId("all");
        return;
      }

      const raw = hash.startsWith("#") ? hash.slice(1) : hash;
      const candidate = raw.startsWith("menu-cat-") ? raw.slice("menu-cat-".length) : raw;
      if (categoryIds.has(candidate)) {
        setSelectedCategoryId(candidate);
      }
    };

    applyHashCategory();
    window.addEventListener("hashchange", applyHashCategory);
    return () => window.removeEventListener("hashchange", applyHashCategory);
  }, [initialMenu.categories]);

  useEffect(() => {
    if (selectedCategoryId === "all") {
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      return;
    }

    const nextHash = `#menu-cat-${selectedCategoryId}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${nextHash}`,
      );
    }
  }, [selectedCategoryId]);

  const handleToggleAllergen = useCallback((allergen: string) => {
    setSelectedAllergensToAvoid((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen],
    );
  }, []);

  const handleAdd = useCallback(
    (input: AddToCartInput) => {
      if (!shopStatus.isOpen) {
        setClosedAttempt(true);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      cart.addItem(input, 1);
      setCartOpen(true);
    },
    [cart, shopStatus.isOpen],
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
      <Stack
        gap={{ base: 6, md: 8 }}
        paddingBottom={{ base: "calc(env(safe-area-inset-bottom) + 104px)", md: 0 }}
      >
        {!shopStatus.isOpen ? (
          <Box
            role="alert"
            borderWidth="1px"
            borderColor="red.500"
            bg="red.50"
            color="red.900"
            borderRadius="xl"
            padding={{ base: 4, md: 5 }}
          >
            <Heading as="h2" size="md" mb={1}>
              Sorry, we&rsquo;re closed for online ordering
            </Heading>
            <Text fontSize="sm" mb={3}>
              {shopStatus.opensAt && shopStatus.opensDayLabel
                ? `Online ordering reopens ${shopStatus.opensDayLabel} at ${shopStatus.opensAt}. You can browse the menu, but items can't be added to the cart until then.`
                : "Please check back during our opening hours."}
              {closedAttempt
                ? " You tried to add an item — we'll be ready to take your order when we reopen."
                : ""}
            </Text>
            <Box
              borderTopWidth="1px"
              borderColor="red.200"
              paddingTop={3}
            >
              <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={2}>
                Opening hours
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={1} fontSize="sm">
                {DAY_ORDER.map(({ key, label }) => {
                  const entry = openingHours[key];
                  return (
                    <HStack key={key} justify="space-between" gap={4}>
                      <Text as="span" fontWeight="medium">{label}</Text>
                      <Text as="span">
                        {entry.closed
                          ? "Closed"
                          : formatHours(entry.open, entry.close)}
                      </Text>
                    </HStack>
                  );
                })}
              </SimpleGrid>
            </Box>
          </Box>
        ) : null}

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

        <Box
          position={{ base: "static", md: "sticky" }}
          top={{ md: "86px" }}
          zIndex={{ md: 20 }}
          bg="bg.default"
          borderWidth="1px"
          borderColor="border"
          borderRadius={{ base: "2xl", md: "xl" }}
          padding={{ base: 4, md: 4 }}
          boxShadow={{ md: "sm" }}
        >
          <MenuCategoryTabs
            categories={initialMenu.categories.map((c) => ({
              id: c.id,
              name: c.name,
              itemCount: c.items.length,
            }))}
            selectedCategoryId={selectedCategoryId}
            onChange={setSelectedCategoryId}
          />
        </Box>

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
          height={{
            base: cart.totalQuantity > 0
              ? "calc(env(safe-area-inset-bottom) + 88px)"
              : "0",
            md: "0",
          }}
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
