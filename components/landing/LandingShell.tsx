"use client";

import { Box, Container, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

import { restaurantLocation, siteConfig } from "@/lib/config/site";

export interface LandingShellProps {
  children: ReactNode;
  bottomCta?: ReactNode;
}

/**
 * Lightweight wrapper for Google Ads landing pages: branded top bar with only
 * a couple of low-distraction links, slim footer, and room for a sticky CTA.
 *
 * Note: the root layout always renders SiteHeader/SiteFooter, but those have
 * been taught to hide themselves on /lp/* routes so this is the only chrome
 * the visitor sees.
 */
export function LandingShell({ children, bottomCta }: LandingShellProps) {
  return (
    <Box
      as="div"
      display="flex"
      flexDirection="column"
      minH="100dvh"
      bg="bg"
      color="fg.default"
    >
      <Box
        as="header"
        position="sticky"
        top="0"
        zIndex="docked"
        bg="bg.subtle"
        borderBottomWidth="1px"
        borderColor="border"
        backdropFilter="saturate(180%) blur(8px)"
      >
        <Container maxW="container.xl" paddingInline={{ base: 4, md: 8 }}>
          <Flex
            align="center"
            justify="space-between"
            minH={{ base: "56px", md: "64px" }}
            gap={3}
          >
            <NextLink href="/" aria-label={`${siteConfig.name} — home`}>
              <Stack gap={0} lineHeight="1">
                <Text
                  fontFamily="heading"
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="700"
                  color="fg.default"
                >
                  {siteConfig.name}
                </Text>
                <Text
                  display={{ base: "none", sm: "block" }}
                  fontSize="xs"
                  color="brand.fg"
                  letterSpacing="0.16em"
                  textTransform="uppercase"
                  fontWeight="600"
                >
                  {siteConfig.rating}★ · {siteConfig.reviewCount} Google reviews
                </Text>
              </Stack>
            </NextLink>

            <HStack gap={{ base: 3, md: 5 }} as="nav" aria-label="Landing">
              <NextLink href="/menu">
                <Text
                  color="fg.default"
                  fontWeight="500"
                  fontSize={{ base: "sm", md: "md" }}
                  _hover={{ color: "brand.fg" }}
                >
                  Menu
                </Text>
              </NextLink>
              <NextLink href="/directions">
                <Text
                  color="fg.default"
                  fontWeight="500"
                  fontSize={{ base: "sm", md: "md" }}
                  _hover={{ color: "brand.fg" }}
                >
                  Directions
                </Text>
              </NextLink>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Box as="main" flex="1" paddingBottom={bottomCta ? { base: "96px", md: "0" } : "0"}>
        {children}
      </Box>

      <Box
        as="footer"
        bg="bg.subtle"
        borderTopWidth="1px"
        borderColor="border"
        paddingBlock={{ base: 6, md: 8 }}
        paddingInline={{ base: 4, md: 8 }}
      >
        <Container maxW="container.xl">
          <Stack
            gap={3}
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
          >
            <Stack gap={1}>
              <Text fontWeight="600" color="fg.default">
                {siteConfig.name}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {restaurantLocation.fullAddress}
              </Text>
            </Stack>
            <HStack
              gap={{ base: 4, md: 6 }}
              flexWrap="wrap"
              as="nav"
              aria-label="Landing footer"
            >
              <FooterLink href="/menu">Menu</FooterLink>
              <FooterLink href="/menu">Order</FooterLink>
              <FooterLink href="/book">Book</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </HStack>
          </Stack>
        </Container>
      </Box>

      {bottomCta}
    </Box>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <NextLink href={href}>
      <Text fontSize="sm" color="fg.muted" _hover={{ color: "brand.fg" }}>
        {children}
      </Text>
    </NextLink>
  );
}
