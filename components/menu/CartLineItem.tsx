"use client";

import { Box, Button, HStack, Stack, Text } from "@chakra-ui/react";

import { AllergenBadge } from "@/components/menu/AllergenBadge";
import type { CartItem } from "@/lib/menu/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export interface CartLineItemProps {
  item: CartItem;
  onIncrease: (menuItemId: string) => void;
  onDecrease: (menuItemId: string) => void;
  onRemove: (menuItemId: string) => void;
}

export function CartLineItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartLineItemProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      padding={3}
      bg="bg.subtle"
    >
      <Stack gap={2}>
        <HStack justify="space-between" align="start" gap={3}>
          <Stack gap={1} flex="1" minW={0}>
            <Text
              fontWeight="600"
              color="fg.default"
              fontSize="sm"
              lineHeight="1.3"
            >
              {item.name}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {formatGBPFromPence(item.unitPricePence)} each
            </Text>
            {item.allergens.length > 0 ? (
              <HStack gap={1} flexWrap="wrap">
                {item.allergens.map((a) => (
                  <AllergenBadge key={a} allergen={a} />
                ))}
              </HStack>
            ) : null}
          </Stack>
          <Text fontWeight="700" color="brand.fg" fontSize="sm">
            {formatGBPFromPence(item.totalPence)}
          </Text>
        </HStack>

        <HStack justify="space-between" align="center" gap={2}>
          <HStack gap={1}>
            <Button
              type="button"
              size="xs"
              onClick={() => onDecrease(item.menuItemId)}
              aria-label={`Decrease ${item.name}`}
              variant="outline"
              borderColor="border"
              color="fg.default"
              _hover={{ bg: "bg.muted" }}
            >
              −
            </Button>
            <Text
              minW="2ch"
              textAlign="center"
              color="fg.default"
              fontSize="sm"
              fontWeight="600"
              aria-live="polite"
            >
              {item.quantity}
            </Text>
            <Button
              type="button"
              size="xs"
              onClick={() => onIncrease(item.menuItemId)}
              aria-label={`Increase ${item.name}`}
              variant="outline"
              borderColor="border"
              color="fg.default"
              _hover={{ bg: "bg.muted" }}
            >
              +
            </Button>
          </HStack>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => onRemove(item.menuItemId)}
            aria-label={`Remove ${item.name} from cart`}
            color="fg.muted"
            _hover={{ color: "brand.fg" }}
          >
            Remove
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
}
