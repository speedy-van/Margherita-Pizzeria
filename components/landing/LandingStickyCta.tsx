"use client";

import { Box, Button, Container, Flex, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import {
  trackLandingOrderIntent,
  type LandingSource,
} from "@/lib/analytics/conversion-events";

export interface LandingStickyCtaProps {
  label: string;
  href: string;
  source: LandingSource;
  helperText?: string;
}

export function LandingStickyCta({
  label,
  href,
  source,
  helperText,
}: LandingStickyCtaProps) {
  return (
    <Box
      as="div"
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex="banner"
      bg="bg.subtle"
      borderTopWidth="1px"
      borderColor="border"
      paddingBlock={3}
      paddingInline={{ base: 4, md: 6 }}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      display={{ base: "block", md: "none" }}
      role="region"
      aria-label="Quick action"
    >
      <Container maxW="container.md">
        <Flex align="center" justify="space-between" gap={3}>
          {helperText ? (
            <Text fontSize="xs" color="fg.muted" maxW="50%">
              {helperText}
            </Text>
          ) : (
            <span aria-hidden />
          )}
          <NextLink href={href} onClick={() => trackLandingOrderIntent(source)}>
            <Button
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
              minH="48px"
              paddingInline={5}
            >
              {label}
            </Button>
          </NextLink>
        </Flex>
      </Container>
    </Box>
  );
}
