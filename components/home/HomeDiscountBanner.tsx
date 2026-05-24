import { Box, Container, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import type { PublicDiscount } from "@/lib/discounts/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export interface HomeDiscountBannerProps {
  discount: PublicDiscount | null;
}

function describeValue(d: PublicDiscount): string {
  if (d.type === "percentage") {
    return `${d.value}% off`;
  }
  return `${formatGBPFromPence(d.value)} off`;
}

function describeRules(d: PublicDiscount): string {
  const channels: string[] = [];
  if (d.appliesToDelivery) channels.push("delivery");
  if (d.appliesToCollection) channels.push("collection");
  const channelText =
    channels.length === 2
      ? "delivery & collection"
      : channels[0] ?? "selected orders";

  if (d.minOrderPence > 0) {
    return `on ${channelText} over ${formatGBPFromPence(d.minOrderPence)}`;
  }
  return `on ${channelText}`;
}

export function HomeDiscountBanner({ discount }: HomeDiscountBannerProps) {
  if (!discount) return null;

  return (
    <Box
      as="section"
      bg="brand.solid"
      color="brand.contrast"
      paddingBlock={{ base: 2.5, md: 3 }}
      aria-label="Site-wide offer"
    >
      <Container maxW="6xl" paddingInline={{ base: 4, md: 6 }}>
        <HStack
          gap={3}
          justify="space-between"
          align="center"
          flexWrap="wrap"
        >
          <Stack gap={0}>
            <Text fontWeight="700" fontSize={{ base: "sm", md: "md" }}>
              {discount.title} — {describeValue(discount)} {describeRules(discount)}
            </Text>
            {discount.description ? (
              <Text fontSize="xs" opacity={0.9}>
                {discount.description}
              </Text>
            ) : null}
          </Stack>
          <HStack gap={3} flexWrap="wrap">
            <Text
              fontWeight="700"
              fontSize="sm"
              letterSpacing="0.08em"
              textTransform="uppercase"
              borderWidth="1px"
              borderColor="brand.contrast"
              borderRadius="md"
              paddingInline={2}
              paddingBlock={1}
            >
              Code: {discount.code}
            </Text>
            <NextLink
              href="/menu"
              style={{
                color: "inherit",
                textDecoration: "underline",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Start your order →
            </NextLink>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}
