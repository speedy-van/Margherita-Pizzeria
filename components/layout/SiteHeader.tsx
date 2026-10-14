"use client";

import {
  Badge,
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

import { trackLandingCallClick } from "@/lib/analytics/conversion-events";
import { siteConfig } from "@/lib/config/site";
import type { NavItem } from "@/types/site";

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Directions", href: "/directions" },
  { label: "Contact", href: "/contact" },
];

function BrandMark() {
  return (
    <NextLink href="/" aria-label={`${siteConfig.name} - home`}>
      <HStack gap={{ base: 2.5, md: 3 }} align="center" minW={0}>
        <Box
          position="relative"
          boxSize={{ base: "46px", md: "62px" }}
          borderRadius="full"
          flexShrink={0}
          boxShadow="0 10px 24px rgba(0,0,0,0.16), 0 0 18px rgba(164,189,167,0.26)"
          css={{
            "&::before": {
              content: '""',
              position: "absolute",
              inset: "-3px",
              borderRadius: "9999px",
              border: "1px solid rgba(164,189,167,0.84)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.32), 0 0 14px rgba(164,189,167,0.48)",
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              inset: "-9px",
              borderRadius: "9999px",
              background:
                "radial-gradient(circle, rgba(164,189,167,0.26) 0%, rgba(164,189,167,0) 70%)",
              filter: "blur(6px)",
              pointerEvents: "none",
            },
          }}
        >
          <Box
            position="absolute"
            inset="0"
            borderRadius="full"
            overflow="hidden"
            bg="#FCFBF7"
            borderWidth="1px"
            borderColor="rgba(0,0,0,0.12)"
          >
            <Image
              src="/logo-sage.png"
              alt={`${siteConfig.name} logo`}
              fill
              sizes="62px"
              priority
              style={{
                objectFit: "cover",
                transform: "scale(1.02)",
                filter: "contrast(1.06) saturate(1.03)",
              }}
            />
          </Box>
        </Box>

        <Stack gap={1} lineHeight="1" minW={0}>
          <HStack gap={2} align="center" minW={0}>
            <Text
              fontFamily="heading"
              fontSize={{ base: "md", md: "xl" }}
              fontWeight="700"
              color="fg.default"
              whiteSpace="nowrap"
              letterSpacing="0.01em"
            >
              {siteConfig.name}
            </Text>
            <Badge
              display={{ base: "none", md: "inline-flex" }}
              colorPalette="green"
              variant="subtle"
              borderRadius="full"
              paddingInline={2}
              fontSize="2xs"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Open Late
            </Badge>
          </HStack>

          <Text
            display={{ base: "none", md: "block" }}
            fontSize="xs"
            color="brand.fg"
            letterSpacing="0.18em"
            textTransform="uppercase"
            fontWeight="600"
            whiteSpace="nowrap"
          >
            Stone-baked - Halal - Glasgow
          </Text>
        </Stack>
      </HStack>
    </NextLink>
  );
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNav({ pathname }: { pathname: string | null }) {
  return (
    <HStack as="nav" aria-label="Primary" gap={6} display={{ base: "none", md: "flex" }}>
      {NAV_ITEMS.map((item) => {
        const href = item.href as string;
        const active = isActivePath(pathname, href);

        return (
          <NextLink key={href} href={href}>
            <Text
              color={active ? "fg.default" : "fg.muted"}
              fontWeight={active ? "700" : "600"}
              paddingInline={3}
              paddingBlock={1.5}
              borderRadius="full"
              borderWidth="1px"
              borderColor={active ? "rgba(0,0,0,0.72)" : "transparent"}
              bg={active ? "rgba(164,189,167,0.55)" : "transparent"}
              _hover={{
                color: "fg.default",
                bg: "rgba(0,0,0,0.05)",
                borderColor: "rgba(0,0,0,0.14)",
              }}
              transition="all 140ms"
            >
              {item.label}
            </Text>
          </NextLink>
        );
      })}
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
      borderWidth="1px"
      borderColor="rgba(0,0,0,0.2)"
      borderRadius="lg"
      bg="rgba(0,0,0,0.03)"
      _hover={{ bg: "rgba(0,0,0,0.08)" }}
    >
      <Box as="span" aria-hidden fontSize="xl" lineHeight="1">
        {open ? "X" : "☰"}
      </Box>
    </IconButton>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname && (pathname.startsWith("/lp") || pathname.startsWith("/admin"))) {
    return null;
  }

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="docked"
      bg="rgba(252,251,247,0.92)"
      borderBottomWidth="1px"
      borderColor="rgba(0,0,0,0.1)"
      backdropFilter="saturate(190%) blur(14px)"
      boxShadow="0 8px 24px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(0,0,0,0.04)"
    >
      <Container maxW="container.xl" paddingInline={{ base: 4, md: 8 }}>
        <Flex
          align="center"
          justify="space-between"
          minH={{ base: "64px", md: "78px" }}
          gap={4}
        >
          <BrandMark />

          <DesktopNav pathname={pathname} />

          <HStack gap={2}>
            <NextLink
              href={`tel:${siteConfig.phoneTel}`}
              onClick={() => trackLandingCallClick("header")}
            >
              <Button
                display={{ base: "none", md: "inline-flex" }}
                variant="outline"
                borderColor="rgba(0,0,0,0.22)"
                color="fg.default"
                bg="rgba(252,251,247,0.72)"
                _hover={{
                  bg: "rgba(0,0,0,0.05)",
                  borderColor: "rgba(0,0,0,0.42)",
                }}
                size="md"
              >
                Call {siteConfig.phone}
              </Button>
            </NextLink>

            <NextLink href="/menu">
              <Button
                bg="#A4BDA7"
                color="brand.contrast"
                borderWidth="1px"
                borderColor="rgba(0,0,0,0.18)"
                _hover={{
                  filter: "brightness(1.06)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 12px 28px rgba(164,189,167,0.42)",
                }}
                size={{ base: "sm", md: "md" }}
                fontWeight="700"
                paddingInline={{ base: 4, md: 5 }}
                boxShadow="0 8px 20px rgba(164,189,167,0.34)"
              >
                Order Now
              </Button>
            </NextLink>

            <MobileMenuButton open={open} onToggle={() => setOpen((v) => !v)} />
          </HStack>
        </Flex>
      </Container>

      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="end" size="xs">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg="#FCFBF7" color="fg.default">
            <Drawer.Header borderBottomWidth="1px" borderColor="border">
              <Drawer.Title>Navigate</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton aria-label="Close menu" variant="ghost" color="fg.default">
                  <Box as="span" aria-hidden fontSize="lg">
                    X
                  </Box>
                  <VisuallyHidden>Close</VisuallyHidden>
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body>
              <Stack gap={3} paddingTop={4} paddingBottom={4}>
                <NextLink href="/menu" onClick={() => setOpen(false)}>
                  <Button
                    width="100%"
                    bg="#A4BDA7"
                    color="brand.contrast"
                    _hover={{ filter: "brightness(1.04)" }}
                  >
                    Start Order
                  </Button>
                </NextLink>

                <NextLink
                  href={`tel:${siteConfig.phoneTel}`}
                  onClick={() => {
                    trackLandingCallClick("header");
                    setOpen(false);
                  }}
                >
                  <Button
                    width="100%"
                    variant="outline"
                    borderColor="rgba(0,0,0,0.3)"
                    color="fg.default"
                    bg="#FCFBF7"
                  >
                    Call {siteConfig.phone}
                  </Button>
                </NextLink>
              </Stack>

              <Stack as="nav" aria-label="Mobile" gap={4} paddingBlock={4}>
                {NAV_ITEMS.map((item) => {
                  const href = item.href as string;
                  const active = isActivePath(pathname, href);

                  return (
                    <NextLink key={href} href={href} onClick={() => setOpen(false)}>
                      <Text
                        fontSize="lg"
                        color={active ? "fg.default" : "fg.muted"}
                        fontWeight={active ? "700" : "500"}
                        borderWidth="1px"
                        borderColor={active ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.14)"}
                        bg={active ? "rgba(164,189,167,0.55)" : "#FCFBF7"}
                        borderRadius="lg"
                        paddingInline={4}
                        paddingBlock={3}
                      >
                        {item.label}
                      </Text>
                    </NextLink>
                  );
                })}
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  );
}
