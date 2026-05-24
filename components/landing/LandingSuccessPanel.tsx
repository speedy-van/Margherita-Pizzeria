"use client";

import { Box, Button, Container, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export interface LandingSuccessPanelProps {
  /** Only set when we have a real order id from /order checkout. */
  orderId?: string;
  /** Whether the success page was reached via a conversion flag. */
  converted: boolean;
}

/**
 * Lightweight thank-you panel for `/lp/order-now/success`. Because the real
 * order success page lives at `/order/success`, this view is intentionally
 * conservative — it never claims a food order has been placed unless an
 * `orderId` was passed through.
 */
export function LandingSuccessPanel({ orderId, converted }: LandingSuccessPanelProps) {
  const hasOrder = typeof orderId === "string" && orderId.trim() !== "";

  return (
    <Box
      as="section"
      paddingBlock={{ base: 14, md: 20 }}
      paddingInline={{ base: 5, md: 8 }}
    >
      <Container maxW="container.md">
        <Stack gap={{ base: 5, md: 7 }}>
          <Text
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            {hasOrder ? "Order confirmed" : converted ? "Thanks" : "Almost there"}
          </Text>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "3xl", md: "5xl" }}
            color="fg.default"
            lineHeight="1.1"
          >
            {hasOrder
              ? "Your order is on its way."
              : "Thanks — let's finish your order."}
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }} maxW="60ch">
            {hasOrder
              ? "We've received your order. You can view full details and tracking on the live order page."
              : "If you came from an ad, your visit has been recorded. Pick up where you left off below — pricing, slots and delivery availability are confirmed on the order page."}
          </Text>
          <HStack gap={3} flexWrap="wrap">
            {hasOrder ? (
              <NextLink href={`/order/success?orderId=${encodeURIComponent(orderId)}`}>
                <Button
                  size="lg"
                  bg="brand.solid"
                  color="brand.contrast"
                  _hover={{ bg: "brand.emphasized" }}
                  minH="48px"
                >
                  View order
                </Button>
              </NextLink>
            ) : (
              <NextLink href="/order">
                <Button
                  size="lg"
                  bg="brand.solid"
                  color="brand.contrast"
                  _hover={{ bg: "brand.emphasized" }}
                  minH="48px"
                >
                  Continue to order
                </Button>
              </NextLink>
            )}
            <NextLink href="/menu">
              <Button
                size="lg"
                variant="outline"
                borderColor="border"
                color="fg.default"
                _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
                minH="48px"
              >
                View menu
              </Button>
            </NextLink>
            <NextLink href="/book">
              <Button
                size="lg"
                variant="outline"
                borderColor="border"
                color="fg.default"
                _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
                minH="48px"
              >
                Book a table
              </Button>
            </NextLink>
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
}
