"use client";

import {
  Box,
  Button,
  CloseButton,
  Drawer,
  HStack,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";

import { CartLineItem } from "@/components/menu/CartLineItem";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CartItem } from "@/lib/menu/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export interface MenuCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotalPence: number;
  totalQuantity: number;
  onIncrease: (menuItemId: string) => void;
  onDecrease: (menuItemId: string) => void;
  onRemove: (menuItemId: string) => void;
  onClear: () => void;
}

export function MenuCartDrawer({
  open,
  onOpenChange,
  items,
  subtotalPence,
  totalQuantity,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
}: MenuCartDrawerProps) {
  const empty = items.length === 0;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(d) => onOpenChange(d.open)}
      placement="end"
      size={{ base: "full", md: "sm" }}
    >
      <Portal>
        <Drawer.Backdrop bg="rgba(0,0,0,0.6)" />
        <Drawer.Positioner>
          <Drawer.Content bg="bg" color="fg.default" borderLeftWidth="1px" borderColor="border">
            <Drawer.Header
              borderBottomWidth="1px"
              borderColor="border"
              paddingInline={{ base: 4, md: 5 }}
              paddingBlock={4}
            >
              <HStack justify="space-between" align="center" gap={3}>
                <Stack gap={0}>
                  <Drawer.Title color="fg.default" fontFamily="heading" fontSize="xl">
                    Your order
                  </Drawer.Title>
                  <Text fontSize="xs" color="fg.muted">
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "item" : "items"} in cart
                  </Text>
                </Stack>
                <Drawer.CloseTrigger asChild>
                  <CloseButton
                    size="sm"
                    aria-label="Close cart"
                    color="fg.default"
                  />
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>

            <Drawer.Body paddingInline={{ base: 4, md: 5 }} paddingBlock={4}>
              {empty ? (
                <EmptyState
                  title="Your cart is empty"
                  description="Browse the menu and tap “Add to order” on anything you fancy."
                  action={
                    <Drawer.CloseTrigger asChild>
                      <Button
                        type="button"
                        bg="brand.solid"
                        color="brand.contrast"
                        _hover={{ bg: "brand.emphasized" }}
                      >
                        Back to menu
                      </Button>
                    </Drawer.CloseTrigger>
                  }
                />
              ) : (
                <Stack gap={3}>
                  {items.map((item) => (
                    <CartLineItem
                      key={item.menuItemId}
                      item={item}
                      onIncrease={onIncrease}
                      onDecrease={onDecrease}
                      onRemove={onRemove}
                    />
                  ))}
                </Stack>
              )}
            </Drawer.Body>

            <Drawer.Footer
              borderTopWidth="1px"
              borderColor="border"
              paddingInline={{ base: 4, md: 5 }}
              paddingBlock={4}
              flexDirection="column"
              alignItems="stretch"
              gap={3}
            >
              <HStack justify="space-between" align="center">
                <Text color="fg.muted" fontSize="sm">
                  Subtotal
                </Text>
                <Text fontWeight="700" color="fg.default" fontSize="lg">
                  {formatGBPFromPence(subtotalPence)}
                </Text>
              </HStack>
              <Stack gap={2}>
                {empty ? (
                  <Button
                    type="button"
                    disabled
                    bg="bg.muted"
                    color="fg.muted"
                    cursor="not-allowed"
                    aria-disabled
                  >
                    Continue to order
                  </Button>
                ) : (
                  <NextLink href="/order/checkout" style={{ textDecoration: "none" }}>
                    <Button
                      type="button"
                      width="100%"
                      bg="brand.solid"
                      color="brand.contrast"
                      _hover={{ bg: "brand.emphasized" }}
                    >
                      Continue to order
                    </Button>
                  </NextLink>
                )}
                {!empty ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClear}
                    color="fg.muted"
                    _hover={{ color: "brand.fg" }}
                  >
                    Clear cart
                  </Button>
                ) : null}
              </Stack>
              <Box>
                <Text fontSize="xs" color="fg.muted" textAlign="center">
                  Online ordering opens shortly. Cart is saved on this device.
                </Text>
              </Box>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
