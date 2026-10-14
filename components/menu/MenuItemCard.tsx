"use client";

import { Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";

import { AllergenBadge } from "@/components/menu/AllergenBadge";
import { resolveMenuImageUrl } from "@/lib/menu/dish-classifier";
import type { AddToCartInput, PublicMenuItem } from "@/lib/menu/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

const MotionBox = motion.create(Box);

export interface MenuItemCardProps {
  item: PublicMenuItem;
  onAdd: (input: AddToCartInput) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const disabled = !item.available;
  // Always resolve an image: real photo > legacy override > dynamic SVG card.
  const resolvedImageUrl = resolveMenuImageUrl(item.name, item.imageUrl);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      borderWidth="1px"
      borderColor="rgba(164,189,167,0.78)"
      borderRadius="xl"
      bg="bg.subtle"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      height="100%"
      opacity={disabled ? 0.7 : 1}
      boxShadow="0 0 0 1px rgba(164,189,167,0.24), 0 0 18px rgba(164,189,167,0.28), 0 14px 34px rgba(0,0,0,0.08)"
      css={{
        "&:hover": {
          borderColor: "rgba(164,189,167,1)",
          boxShadow:
            "0 0 0 1px rgba(164,189,167,0.42), 0 0 28px rgba(164,189,167,0.46), 0 18px 42px rgba(0,0,0,0.12)",
        },
        transition: "border-color .2s ease, box-shadow .2s ease, opacity .2s ease",
      }}
    >
      <Box
        position="relative"
        width="100%"
        aspectRatio={16 / 9}
        bg="bg.muted"
        overflow="hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedImageUrl}
          alt={item.name}
          // eslint-disable-next-line react/forbid-component-props
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          loading="lazy"
        />

        {disabled ? (
          <Box
            position="absolute"
            top="2"
            right="2"
            bg="rgba(0,0,0,0.7)"
            color="fg.default"
            borderWidth="1px"
            borderColor="border"
            borderRadius="full"
            paddingInline="2"
            paddingBlock="0.5"
            fontSize="2xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Unavailable
          </Box>
        ) : null}
      </Box>

      <Stack
        gap={3}
        padding={{ base: 4, md: 5 }}
        flex="1"
        justifyContent="space-between"
      >
        <Stack gap={2}>
          <HStack
            justify="space-between"
            align="start"
            gap={3}
            flexWrap="wrap"
          >
            <Heading
              as="h3"
              fontFamily="heading"
              fontSize={{ base: "lg", md: "xl" }}
              color="fg.default"
              lineHeight="1.2"
            >
              {item.name}
            </Heading>
            <Text
              fontWeight="700"
              color="brand.fg"
              fontSize={{ base: "md", md: "lg" }}
              whiteSpace="nowrap"
            >
              {formatGBPFromPence(item.pricePence)}
            </Text>
          </HStack>

          {item.description ? (
            <Text color="fg.muted" fontSize="sm" lineHeight="1.5">
              {item.description}
            </Text>
          ) : null}

          {item.allergens.length > 0 ? (
            <HStack gap={1.5} flexWrap="wrap" aria-label="Allergens">
              {item.allergens.map((a) => (
                <AllergenBadge key={a} allergen={a} />
              ))}
            </HStack>
          ) : null}
        </Stack>

        {disabled ? (
          <Text
            fontSize="sm"
            color="fg.muted"
            fontStyle="italic"
            role="status"
          >
            Currently unavailable
          </Text>
        ) : (
          <Button
            type="button"
            onClick={() =>
              onAdd({
                menuItemId: item.id,
                name: item.name,
                unitPricePence: item.pricePence,
                allergens: item.allergens,
                imageUrl: item.imageUrl,
              })
            }
            aria-label={`Add ${item.name} to cart`}
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
            size="sm"
            alignSelf="flex-start"
          >
            Add to order
          </Button>
        )}
      </Stack>
    </MotionBox>
  );
}
