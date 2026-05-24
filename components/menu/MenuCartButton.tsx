"use client";

import { Box, Button, Text } from "@chakra-ui/react";

import { formatGBPFromPence } from "@/lib/utils/currency";

export interface MenuCartButtonProps {
  totalQuantity: number;
  subtotalPence: number;
  onOpen: () => void;
  variant?: "sticky" | "inline";
}

export function MenuCartButton({
  totalQuantity,
  subtotalPence,
  onOpen,
  variant = "inline",
}: MenuCartButtonProps) {
  const isSticky = variant === "sticky";
  const empty = totalQuantity === 0;

  if (isSticky) {
    return (
      <Box
        position="fixed"
        bottom={{ base: "4", md: "6" }}
        left={{ base: "4", md: "auto" }}
        right={{ base: "4", md: "6" }}
        zIndex="docked"
        display={{ base: empty ? "none" : "block", md: "none" }}
        css={{
          paddingBottom: "env(safe-area-inset-bottom, 0)",
        }}
      >
        <Button
          type="button"
          onClick={onOpen}
          width="100%"
          size="lg"
          bg="brand.solid"
          color="brand.contrast"
          _hover={{ bg: "brand.emphasized" }}
          borderRadius="full"
          fontWeight="700"
          boxShadow="0 12px 30px rgba(0,0,0,0.45)"
          aria-label={`View cart, ${totalQuantity} items, subtotal ${formatGBPFromPence(
            subtotalPence,
          )}`}
        >
          <Text as="span">
            View cart · {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
          </Text>
          <Text as="span" marginInlineStart="auto" fontWeight="700">
            {formatGBPFromPence(subtotalPence)}
          </Text>
        </Button>
      </Box>
    );
  }

  return (
    <Button
      type="button"
      onClick={onOpen}
      bg="brand.solid"
      color="brand.contrast"
      _hover={{ bg: "brand.emphasized" }}
      borderRadius="full"
      aria-label={
        empty
          ? "View cart (empty)"
          : `View cart, ${totalQuantity} items, subtotal ${formatGBPFromPence(subtotalPence)}`
      }
    >
      {empty
        ? "Cart"
        : `Cart · ${totalQuantity} · ${formatGBPFromPence(subtotalPence)}`}
    </Button>
  );
}
