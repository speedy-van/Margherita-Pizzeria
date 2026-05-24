"use client";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { contactDetails, restaurantLocation } from "@/lib/config/site";

interface QuickAction {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  emphasis?: boolean;
  icon: React.ReactNode;
}

const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  restaurantLocation.fullAddress,
)}`;

const whatsappNumber = contactDetails.secondaryPhoneTel.replace(/[^0-9]/g, "");
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Hi Margherita Pizzeria!",
)}`;

const ACTIONS: QuickAction[] = [
  {
    id: "order",
    label: "Order",
    href: "/menu",
    emphasis: true,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18l-1.6 11.2A2 2 0 0 1 17.42 20H6.58a2 2 0 0 1-1.98-1.8L3 7Z" />
        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
      </svg>
    ),
  },
  {
    id: "call",
    label: "Call",
    href: `tel:${contactDetails.primaryPhoneTel}`,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: whatsappHref,
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.6.9-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.3-1.3-3.2-2.9-.2-.4 0-.4.3-.7.1-.1.3-.4.4-.5.1-.2.1-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.3 0 1.3 1 2.6 1.1 2.8.1.2 1.9 3 4.7 4.2 1.8.7 2.5.8 3.3.7.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2z" />
      </svg>
    ),
  },
  {
    id: "directions",
    label: "Directions",
    href: directionsHref,
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export function MobileQuickBar() {
  const pathname = usePathname() ?? "/";

  // Hide on admin / auth surfaces — chrome is already hidden there but be safe.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api")
  ) {
    return null;
  }

  return (
    <Box
      as="nav"
      aria-label="Quick contact"
      display={{ base: "block", md: "none" }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1090}
      bg="rgba(13,13,13,0.92)"
      borderTopWidth="1px"
      borderColor="border"
      backdropFilter="saturate(160%) blur(14px)"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <HStack gap={0} justify="space-between" paddingInline={2} paddingBlock={2}>
        {ACTIONS.map((action) => {
          const isExternal = !!action.external;
          const isTel = action.href.startsWith("tel:");
          const inner = (
            <Stack
              gap={0.5}
              align="center"
              justify="center"
              flex="1"
              minH="56px"
              paddingInline={1}
              borderRadius="lg"
              color={action.emphasis ? "brand.contrast" : "fg.default"}
              bg={action.emphasis ? "brand.solid" : "transparent"}
              transition="background 0.2s ease, transform 0.15s ease"
              _active={{ transform: "scale(0.95)" }}
              _hover={action.emphasis ? { bg: "brand.emphasized" } : { bg: "bg.subtle" }}
            >
              <Box aria-hidden lineHeight="0">{action.icon}</Box>
              <Text fontSize="2xs" fontWeight="700" letterSpacing="0.04em" textTransform="uppercase">
                {action.label}
              </Text>
            </Stack>
          );

          if (isExternal || isTel) {
            return (
              <Box
                as="a"
                // @ts-expect-error chakra Box anchor
                href={action.href}
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                key={action.id}
                aria-label={action.label}
                flex="1"
                display="block"
                style={{ textDecoration: "none" }}
              >
                {inner}
              </Box>
            );
          }

          return (
            <NextLink
              key={action.id}
              href={action.href}
              aria-label={action.label}
              style={{ textDecoration: "none", flex: 1, display: "block" }}
            >
              {inner}
            </NextLink>
          );
        })}
      </HStack>
    </Box>
  );
}
