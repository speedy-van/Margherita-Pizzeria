"use client";

import { Badge, Box, Container, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { trackLandingCallClick } from "@/lib/analytics/conversion-events";
import {
  contactDetails,
  restaurantLocation,
  siteConfig,
  socialLinks,
} from "@/lib/config/site";
import { DEFAULT_OPENING_HOURS } from "@/lib/utils/shop-hours";
import type { OpeningHours, OpeningHoursDay } from "@/types/database";
import type { FooterLinkGroup } from "@/types/site";

const FOOTER_GROUPS: FooterLinkGroup[] = [
  {
    title: "Order",
    links: [
      // Start-of-flow CTA: ordering begins on /menu.
      { label: "Order delivery", href: "/menu" },
      { label: "Collection", href: "/order" },
      { label: "Menu", href: "/menu" },
    ],
  },
  {
    title: "Visit",
    links: [
      { label: "Book a table", href: "/book" },
      { label: "Directions", href: "/directions" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const FOOTER_DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

function formatEntry(entry: OpeningHoursDay): string {
  if (entry.closed) return "closed";
  return `${entry.open}-${entry.close === "00:00" ? "midnight" : entry.close}`;
}

function formatDaySpan(startLabel: string, endLabel: string): string {
  return startLabel === endLabel ? startLabel : `${startLabel}-${endLabel}`;
}

function formatFooterHours(openingHours: OpeningHours | undefined): string {
  const hours = openingHours ?? DEFAULT_OPENING_HOURS;
  const segments: string[] = [];
  let start = FOOTER_DAYS[0]!;
  let end = FOOTER_DAYS[0]!;
  let current = formatEntry(hours[start.key]);

  for (const day of FOOTER_DAYS.slice(1)) {
    const value = formatEntry(hours[day.key]);
    if (value === current) {
      end = day;
      continue;
    }
    segments.push(`${formatDaySpan(start.label, end.label)} ${current}`);
    start = day;
    end = day;
    current = value;
  }

  segments.push(`${formatDaySpan(start.label, end.label)} ${current}`);
  return `Opening hours · ${segments.join(" · ")}`;
}

export interface SiteFooterProps {
  openingHours?: OpeningHours;
}

export function SiteFooter({ openingHours }: SiteFooterProps) {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // Landing pages render their own minimal LandingShell chrome.
  // Admin pages render their own AdminShell chrome.
  if (pathname && (pathname.startsWith("/lp") || pathname.startsWith("/admin"))) {
    return null;
  }

  return (
    <Box as="footer" bg="bg.subtle" borderTopWidth="1px" borderColor="border" mt={16}>
      <Container maxW="container.xl" paddingInline={{ base: 5, md: 8 }} paddingBlock={{ base: 10, md: 14 }}>
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={{ base: 8, md: 10 }}>
          <Stack gap={3}>
            <Heading as="p" size="md" fontFamily="heading" color="fg.default">
              {siteConfig.name}
            </Heading>
            <Text color="fg.muted">
              {restaurantLocation.addressLine}
              <br />
              {restaurantLocation.neighbourhood}, {restaurantLocation.city}
              <br />
              {restaurantLocation.postcode}, United Kingdom
            </Text>
            <Stack gap={1}>
              <Text asChild color="fg.default" fontWeight="600">
                <a
                  href={`tel:${contactDetails.primaryPhoneTel}`}
                  onClick={() => trackLandingCallClick("footer")}
                >
                  {contactDetails.primaryPhone}
                </a>
              </Text>
              <Text color="fg.muted" fontSize="sm">{contactDetails.whatsappLabel}</Text>
            </Stack>
            {siteConfig.halalCertified ? (
              <Badge colorPalette="green" alignSelf="flex-start">
                Halal Certified
              </Badge>
            ) : null}
            <HStack gap={4} pt={2} flexWrap="wrap">
              <Text asChild color="fg.default" _hover={{ color: "brand.fg" }} fontSize="sm">
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              </Text>
              <Text asChild color="fg.default" _hover={{ color: "brand.fg" }} fontSize="sm">
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </Text>
              <Text asChild color="fg.default" _hover={{ color: "brand.fg" }} fontSize="sm">
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer">
                  TikTok
                </a>
              </Text>
            </HStack>
          </Stack>

          {FOOTER_GROUPS.map((group) => (
            <Stack key={group.title} gap={3}>
              <Text
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.18em"
                color="brand.fg"
                fontWeight="700"
              >
                {group.title}
              </Text>
              <Stack as="ul" gap={2} listStyleType="none">
                {group.links.map((link) => (
                  <Box as="li" key={`${link.label}-${link.href.toString()}`}>
                    <NextLink href={link.href as string}>
                      <Text color="fg.default" _hover={{ color: "brand.fg" }}>
                        {link.label}
                      </Text>
                    </NextLink>
                  </Box>
                ))}
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>

        <Box mt={{ base: 10, md: 12 }} borderTopWidth="1px" borderColor="border" pt={6}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} alignItems="center">
            <Text color="fg.muted" fontSize="sm">
              © {year} {siteConfig.name}. All rights reserved.
            </Text>
            <Text color="fg.muted" fontSize="sm" textAlign={{ base: "left", md: "right" }}>
              {formatFooterHours(openingHours)}
            </Text>
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
}
