import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { contactDetails, restaurantLocation, siteConfig } from "@/lib/config/site";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getCanonicalUrl } from "@/lib/seo/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Fresh Halal Pizza Delivered in Glasgow East End | Order Online",
  description:
    "Stone-baked sourdough pizza, kebabs, burgers and wraps delivered to Glasgow's East End. £3.99 flat delivery fee. Order online from Margherita Pizzeria, Dennistoun.",
  path: "/order",
  keywords: getKeywordsForPath("/order"),
});

// ── Data ──────────────────────────────────────────────────────────────────────

const trustBadges = [
  { icon: "bike", label: "£3.99 delivery" },
  { icon: "pound", label: "Flat fee within 4 miles" },
  { icon: "clock", label: "Open late" },
  { icon: "halal", label: "Halal certified" },
] as const;

const featuredItems = [
  {
    name: "Halal Sourdough Pizza",
    description: "24-hr cold-proved dough, stone-baked to perfection",
    badge: "House Special",
    imageSrc: "/legacy/margherita-real.jpg",
  },
  {
    name: "Donner Kebab Pizza",
    description: "Sourdough base with shawarma-spiced lamb & garlic sauce",
    badge: "Bestseller",
    imageSrc: "/legacy/donner-real.jpg",
  },
  {
    name: "Smashburger",
    description: "Double smashed halal beef patty, American cheese",
    badge: "Popular",
    imageSrc: "/legacy/deal-smashburger.jpg",
  },
  {
    name: "Chicken Shawarma Wrap",
    description: "Marinated chicken, garlic sauce, fresh salad",
    badge: "Fan Favourite",
    imageSrc: "/uploads/images/chicken-shawarma-wrap.png",
  },
] as const;

const fulfilment = [
  {
    title: "Delivery",
    body: `Hot, halal sourdough pizza to your door within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}. £3.99 flat delivery fee.`,
  },
  {
    title: "Collection",
    body: `Order ahead and skip the wait — pick up fresh from ${siteConfig.address}.`,
  },
] as const;

const trustPoints = [
  {
    icon: "halal",
    label: "Halal Certified",
    detail: "Fully certified — all meats sourced halal",
  },
  {
    icon: "dough",
    label: "Stone-baked sourdough",
    detail: "24-hour cold-proved dough, baked in our stone oven",
  },
  {
    icon: "italy",
    label: "Trained in Italy",
    detail: "Authentic Italian pizza technique",
  },
  {
    icon: "location",
    label: restaurantLocation.fullAddress,
    detail: "Dennistoun, Glasgow East End",
  },
] as const;

// ── Inline icons (same SVG set as TrustStrip) ─────────────────────────────────

function Icon({ name }: { name: string }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "bike":
      return (
        <svg {...p}>
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17l4-7h5l3 7M10 10l-2-4h2" />
        </svg>
      );
    case "pound":
      return (
        <svg {...p}>
          <path d="M9 5a3 3 0 0 1 6 0v2H8v7h10M8 14H4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "halal":
      return (
        <svg {...p}>
          <path d="M4 6h16M4 12h10M4 18h16" />
          <path d="M17 9l2.5 3-2.5 3" />
        </svg>
      );
    case "dough":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="9" cy="10.5" r="0.7" fill="currentColor" />
          <circle cx="14" cy="13" r="0.7" fill="currentColor" />
          <circle cx="11" cy="15" r="0.7" fill="currentColor" />
        </svg>
      );
    case "italy":
      return (
        <svg {...p}>
          <path d="M12 3v18M5 12h14" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "location":
      return (
        <svg {...p}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    default:
      return null;
  }
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function OrderPageJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${getCanonicalUrl("/order")}#webpage`,
    name: "Order Online — Margherita Pizzeria",
    url: getCanonicalUrl("/order"),
    description:
      "Order halal stone-baked sourdough pizza, kebabs, burgers and wraps for delivery or collection in Glasgow's East End.",
    inLanguage: "en-GB",
    isPartOf: { "@id": `${getCanonicalUrl("/")}#website` },
    about: { "@id": `${getCanonicalUrl("/")}#restaurant` },
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: getCanonicalUrl("/menu"),
      },
    },
  };
  return <JsonLd data={schema} id="order-page-ld" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderLandingPage() {
  const whatsappHref = `https://wa.me/${contactDetails.primaryPhoneTel.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, I'd like to place an order!")}`;
  const telHref = `tel:${contactDetails.primaryPhoneTel}`;

  return (
    <Box as="main" minH="calc(100dvh - 64px)">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Order", path: "/order" },
        ]}
      />
      <OrderPageJsonLd />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Box
        paddingBlock={{ base: 10, md: 16 }}
        paddingInline={{ base: 5, md: 8 }}
        position="relative"
        overflow="hidden"
      >
        {/* decorative radial brand glow */}
        <Box
          aria-hidden
          position="absolute"
          inset={0}
          backgroundImage="radial-gradient(ellipse at 25% 60%, rgba(192,57,43,0.14), transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(230,126,34,0.09), transparent 50%)"
          pointerEvents="none"
        />

        <Container maxW="container.lg" position="relative">
          <Stack gap={{ base: 5, md: 7 }} maxW="680px">
            <Text
              textTransform="uppercase"
              letterSpacing="0.2em"
              fontSize="xs"
              color="brand.fg"
              fontWeight="700"
            >
              Halal Certified · Dennistoun, Glasgow
            </Text>

            <Heading
              as="h1"
              fontFamily="heading"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.1"
              backgroundImage="linear-gradient(90deg, #ffffff 0%, #ffffff 30%, #f4c08a 48%, #e8533a 54%, #f4c08a 60%, #ffffff 70%, #ffffff 100%)"
              backgroundSize="200% auto"
              backgroundClip="text"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              animation="hero-shimmer 4s linear infinite"
            >
              Fresh Halal Pizza Delivered in Glasgow East End
            </Heading>

            <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }} maxW="55ch">
              Stone-baked sourdough pizza, kebabs, burgers and wraps. Order online
              for delivery or collection from Dennistoun.
            </Text>

            {/* Primary CTAs — full-width on mobile for easy tapping */}
            <HStack gap={3} flexWrap="wrap">
              <NextLink href="/menu" style={{ textDecoration: "none" }}>
                <Button
                  size="lg"
                  minH="52px"
                  minW={{ base: "full", sm: "auto" }}
                  bg="brand.solid"
                  color="brand.contrast"
                  _hover={{ bg: "brand.emphasized" }}
                  fontWeight="700"
                  animation="logo-neon-pulse 2.8s ease-in-out infinite"
                >
                  Order Now
                </Button>
              </NextLink>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Button
                  size="lg"
                  minH="52px"
                  variant="outline"
                  borderColor="border"
                  color="fg.default"
                  _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
                >
                  Call / WhatsApp
                </Button>
              </a>
            </HStack>
          </Stack>
        </Container>
      </Box>

      {/* ── DELIVERY TRUST STRIP ─────────────────────────────────────────── */}
      <Box
        bg="bg.subtle"
        borderTopWidth="1px"
        borderBottomWidth="1px"
        borderColor="border"
        paddingBlock={{ base: 3, md: 4 }}
        overflowX="auto"
      >
        <Container maxW="container.lg" paddingInline={{ base: 4, md: 8 }}>
          <HStack
            gap={{ base: 3, md: 4 }}
            justify={{ base: "start", md: "center" }}
            flexWrap="nowrap"
          >
            {trustBadges.map((badge) => (
              <HStack
                key={badge.label}
                gap={2}
                flexShrink={0}
                paddingInline={{ base: 3, md: 4 }}
                paddingBlock={{ base: 2, md: 3 }}
                borderWidth="1px"
                borderColor="rgba(192,57,43,0.55)"
                borderRadius="xl"
                bg="bg.canvas"
                animation="logo-neon-pulse 2.8s ease-in-out infinite"
              >
                <Box color="brand.fg" lineHeight="0" flexShrink={0}>
                  <Icon name={badge.icon} />
                </Box>
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="600"
                  color="fg.default"
                  whiteSpace="nowrap"
                >
                  {badge.label}
                </Text>
              </HStack>
            ))}
          </HStack>
        </Container>
      </Box>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────────────── */}
      <Box paddingBlock={{ base: 10, md: 14 }} paddingInline={{ base: 5, md: 8 }}>
        <Container maxW="container.lg">
          <Stack gap={{ base: 6, md: 8 }}>
            <Stack gap={2}>
              <Text
                textTransform="uppercase"
                letterSpacing="0.18em"
                fontSize="xs"
                color="brand.fg"
                fontWeight="700"
              >
                Customer Favourites
              </Text>
              <Heading
                as="h2"
                fontFamily="heading"
                fontSize={{ base: "2xl", md: "3xl" }}
                color="fg.default"
              >
                What We&apos;re Famous For
              </Heading>
            </Stack>

            <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 3, md: 5 }}>
              {featuredItems.map((item) => (
                <Box
                  key={item.name}
                  borderWidth="1px"
                  borderColor="rgba(192,57,43,0.55)"
                  borderRadius="xl"
                  bg="bg.subtle"
                  overflow="hidden"
                  position="relative"
                  animation="logo-neon-pulse 2.8s ease-in-out infinite"
                  transition="transform 0.2s ease"
                  _hover={{ transform: "translateY(-3px)" }}
                >
                  {/* Food photo — fill container, crop to centre */}
                  <Box
                    position="relative"
                    height={{ base: "130px", md: "160px" }}
                    overflow="hidden"
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.name}
                      fill
                      style={{ objectFit: "cover", objectPosition: "center" }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </Box>

                  {/* Text content */}
                  <Box padding={{ base: 3, md: 4 }}>
                    <Stack gap={1.5}>
                      <Box
                        display="inline-flex"
                        width="fit-content"
                        bg="rgba(192,57,43,0.12)"
                        color="brand.fg"
                        borderRadius="full"
                        paddingInline={2}
                        paddingBlock={0.5}
                      >
                        <Text
                          fontSize="2xs"
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                        >
                          {item.badge}
                        </Text>
                      </Box>
                      <Text
                        fontWeight="700"
                        fontSize={{ base: "sm", md: "md" }}
                        color="fg.default"
                        lineHeight="1.25"
                      >
                        {item.name}
                      </Text>
                      <Text
                        fontSize={{ base: "xs", md: "sm" }}
                        color="fg.muted"
                        lineHeight="1.4"
                      >
                        {item.description}
                      </Text>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>

            <HStack gap={3} flexWrap="wrap">
              <NextLink href="/menu" style={{ textDecoration: "none" }}>
                <Button
                  size="lg"
                  minH="48px"
                  bg="brand.solid"
                  color="brand.contrast"
                  _hover={{ bg: "brand.emphasized" }}
                >
                  View Full Menu &amp; Order
                </Button>
              </NextLink>
            </HStack>
          </Stack>
        </Container>
      </Box>

      {/* ── FULFILMENT OPTIONS ───────────────────────────────────────────── */}
      <Box
        bg="bg.subtle"
        borderTopWidth="1px"
        borderColor="border"
        paddingBlock={{ base: 10, md: 14 }}
        paddingInline={{ base: 5, md: 8 }}
      >
        <Container maxW="container.lg">
          <Stack gap={{ base: 6, md: 8 }}>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={{ base: "2xl", md: "3xl" }}
              color="fg.default"
            >
              Delivery or Collection
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 4, md: 6 }}>
              {fulfilment.map((option) => (
                <Box
                  key={option.title}
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="xl"
                  bg="bg.canvas"
                  padding={{ base: 5, md: 6 }}
                >
                  <Stack gap={2}>
                    <Heading as="h3" size="md" color="fg.default">
                      {option.title}
                    </Heading>
                    <Text color="fg.muted">{option.body}</Text>
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* ── TRUST POINTS ─────────────────────────────────────────────────── */}
      <Box paddingBlock={{ base: 10, md: 14 }} paddingInline={{ base: 5, md: 8 }}>
        <Container maxW="container.lg">
          <Stack gap={{ base: 6, md: 8 }}>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={{ base: "2xl", md: "3xl" }}
              color="fg.default"
            >
              Why Choose Us
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={{ base: 4, md: 6 }}>
              {trustPoints.map((point) => (
                <HStack key={point.label} gap={3} align="start">
                  {/* Wrapper isolates the overflowing radar rings from the HStack flow */}
                  <Box position="relative" flexShrink={0} width="40px" height="40px">
                    {point.icon === "location" && (
                      <>
                        <Box
                          className="radar-ring"
                          position="absolute"
                          inset={0}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor="rgba(192,57,43,0.65)"
                          animation="radar-ring 2s ease-out infinite"
                          pointerEvents="none"
                        />
                        <Box
                          className="radar-ring"
                          position="absolute"
                          inset={0}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor="rgba(192,57,43,0.65)"
                          animation="radar-ring 2s ease-out 0.8s infinite"
                          pointerEvents="none"
                        />
                      </>
                    )}
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="linear-gradient(135deg, rgba(230,126,34,0.16), rgba(192,57,43,0.16))"
                      color="brand.fg"
                      borderWidth="1px"
                      borderColor={
                        point.icon === "location"
                          ? "rgba(192,57,43,0.55)"
                          : "rgba(230,126,34,0.25)"
                      }
                    >
                      <Icon name={point.icon} />
                    </Box>
                  </Box>
                  <Stack gap={0.5} flex={1} minW={0}>
                    <Text
                      fontWeight="700"
                      color="fg.default"
                      fontSize={{ base: "sm", md: "md" }}
                      lineHeight="1.25"
                    >
                      {point.label}
                    </Text>
                    <Text
                      color="fg.muted"
                      fontSize={{ base: "xs", md: "sm" }}
                      lineHeight="1.35"
                    >
                      {point.detail}
                    </Text>
                  </Stack>
                </HStack>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* ── STICKY MOBILE BOTTOM CTA ─────────────────────────────────────── */}
      {/*
       * The global MobileQuickBar (Order / Call / WhatsApp / Directions)
       * already renders as a fixed bottom bar on mobile (base–md) across all pages.
       * AppShell adds 72px bottom padding so page content is never obscured.
       *
       * This sticky bar targets desktop (md+) where MobileQuickBar is hidden,
       * giving visitors a persistent "ready to order?" nudge without covering
       * mobile content with a second overlapping fixed bar.
       */}
      <Box
        display={{ base: "none", md: "block" }}
        position="sticky"
        bottom={6}
        zIndex={100}
        paddingInline={8}
        pointerEvents="none"
      >
        <Container maxW="container.lg" pointerEvents="auto">
          <Box
            bg="rgba(13,13,13,0.88)"
            backdropFilter="saturate(180%) blur(14px)"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border"
            padding={{ base: 4, md: 5 }}
          >
            <HStack justify="space-between" gap={4} flexWrap="wrap">
              <Text fontWeight="600" color="fg.default" fontSize="md">
                Ready to order? £3.99 flat delivery fee within 4 miles.
              </Text>
              <HStack gap={3} flexShrink={0}>
                <NextLink href="/menu" style={{ textDecoration: "none" }}>
                  <Button
                    size="sm"
                    minH="40px"
                    bg="brand.solid"
                    color="brand.contrast"
                    _hover={{ bg: "brand.emphasized" }}
                    fontWeight="700"
                    animation="logo-neon-pulse 2.8s ease-in-out infinite"
                  >
                    Order Now
                  </Button>
                </NextLink>
                <a href={telHref} style={{ textDecoration: "none" }}>
                  <Button
                    size="sm"
                    minH="40px"
                    variant="outline"
                    borderColor="border"
                    color="fg.default"
                    _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
                  >
                    Call Us
                  </Button>
                </a>
              </HStack>
            </HStack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
