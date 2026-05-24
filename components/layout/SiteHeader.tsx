"use client";

import {
  Box,
  Button,
  Container,
  Drawer,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { siteConfig } from "@/lib/config/site";
import type { NavItem } from "@/types/site";

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Book", href: "/book" },
  { label: "Directions", href: "/directions" },
  { label: "Contact", href: "/contact" },
];

function BrandMark() {
  return (
    <NextLink href="/" aria-label={`${siteConfig.name} — home`}>
      <HStack gap={3} align="center" minW={0}>
        <Box
          position="relative"
          boxSize={{ base: "44px", md: "60px" }}
          borderRadius="full"
          flexShrink={0}
          animation="logo-neon-pulse 2.2s ease-in-out infinite"
          css={{
            "&::before": {
              content: '""',
              position: "absolute",
              inset: "-4px",
              borderRadius: "9999px",
              padding: "3px",
              background:
                "conic-gradient(from 0deg, #C0392B 0%, #E04B36 18%, transparent 40%, transparent 60%, #E04B36 82%, #C0392B 100%)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              animation: "logo-neon-spin 2.4s linear infinite",
              filter: "drop-shadow(0 0 6px #C0392B) drop-shadow(0 0 12px #C0392B)",
              pointerEvents: "none",
            },
          }}
          className="logo-neon-rotor"
        >
          <Box
            position="absolute"
            inset="0"
            borderRadius="full"
            overflow="hidden"
            bg="#000"
          >
            <Image
              src="/logo.png"
              alt={`${siteConfig.name} logo`}
              fill
              sizes="60px"
              priority
              style={{ objectFit: "cover" }}
            />
            <Box
              as="span"
              aria-hidden
              position="absolute"
              inset="0"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontFamily="heading"
              fontWeight="900"
              fontSize={{ base: "26px", md: "34px" }}
              lineHeight="1"
              color="#C0392B"
              className="logo-m-flash"
              animation="logo-m-flash 1.6s ease-in-out infinite"
              style={{ pointerEvents: "none" }}
            >
              M
            </Box>
          </Box>
        </Box>
        <Stack gap={1} lineHeight="1" minW={0}>
          <Text
            fontFamily="heading"
            fontSize={{ base: "md", md: "xl" }}
            fontWeight="700"
            color="fg.default"
            whiteSpace="nowrap"
          >
            {siteConfig.name}
          </Text>
          <Text
            display={{ base: "none", md: "block" }}
            fontSize="xs"
            color="brand.fg"
            letterSpacing="0.18em"
            textTransform="uppercase"
            fontWeight="600"
            whiteSpace="nowrap"
          >
            Sourdough · Halal · Dennistoun
          </Text>
        </Stack>
      </HStack>
    </NextLink>
  );
}

function DesktopNav() {
  return (
    <HStack as="nav" aria-label="Primary" gap={6} display={{ base: "none", md: "flex" }}>
      {NAV_ITEMS.map((item) => (
        <NextLink key={item.href.toString()} href={item.href as string}>
          <Text
            color="fg.default"
            fontWeight="500"
            _hover={{ color: "brand.fg" }}
            transition="color 120ms"
          >
            {item.label}
          </Text>
        </NextLink>
      ))}
    </HStack>
  );
}

function MobileMenuButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <IconButton
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={onToggle}
      variant="ghost"
      color="fg.default"
      display={{ base: "inline-flex", md: "none" }}
      size="sm"
    >
      <Box as="span" aria-hidden fontSize="xl" lineHeight="1">
        {open ? "✕" : "☰"}
      </Box>
    </IconButton>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Landing pages render their own minimal LandingShell chrome.
  // Admin pages render their own AdminShell chrome.
  if (pathname && (pathname.startsWith("/lp") || pathname.startsWith("/admin"))) {
    return null;
  }

  return (
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
          minH={{ base: "60px", md: "72px" }}
          gap={4}
        >
          <BrandMark />

          <DesktopNav />

          <HStack gap={2}>
            {/* Start-of-flow CTA: send users to the menu to build a cart
                before they reach /order (checkout). */}
            <NextLink href="/menu">
              <Button
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.emphasized" }}
                size={{ base: "sm", md: "md" }}
              >
                Order Now
              </Button>
            </NextLink>
            <MobileMenuButton open={open} onToggle={() => setOpen((v) => !v)} />
          </HStack>
        </Flex>
      </Container>

      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement="end"
        size="xs"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg="bg.subtle" color="fg.default">
            <Drawer.Header borderBottomWidth="1px" borderColor="border">
              <Drawer.Title>Menu</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton aria-label="Close menu" variant="ghost" color="fg.default">
                  <Box as="span" aria-hidden fontSize="lg">
                    ✕
                  </Box>
                  <VisuallyHidden>Close</VisuallyHidden>
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Stack as="nav" aria-label="Mobile" gap={4} paddingBlock={4}>
                {NAV_ITEMS.map((item) => (
                  <NextLink
                    key={item.href.toString()}
                    href={item.href as string}
                    onClick={() => setOpen(false)}
                  >
                    <Text fontSize="lg" color="fg.default">
                      {item.label}
                    </Text>
                  </NextLink>
                ))}
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
}
