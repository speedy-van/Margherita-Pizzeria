"use client";

import { Box, Button, Container, HStack, Stack, Text } from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import NextLink from "next/link";

import {
  trackLandingBookClick,
  trackLandingDirectionsClick,
  trackLandingMenuClick,
  trackLandingOrderIntent,
  type LandingSource,
} from "@/lib/analytics/conversion-events";

export type LandingHeroVariant = "delivery" | "collection";
export type LandingHeroSecondaryEvent = "menu" | "book" | "directions";

export interface LandingHeroSecondaryCta {
  label: string;
  href: string;
  eventName: LandingHeroSecondaryEvent;
}

export interface LandingHeroProps {
  eyebrow: string;
  title: string;
  body: string;
  primaryCta: {
    label: string;
    href: string;
    eventSource: LandingSource;
  };
  secondaryCtas: LandingHeroSecondaryCta[];
  variant: LandingHeroVariant;
}

const MotionStack = motion(Stack);

function trackSecondary(
  event: LandingHeroSecondaryEvent,
  source: LandingSource,
): void {
  if (event === "menu") trackLandingMenuClick(source);
  else if (event === "book") trackLandingBookClick(source);
  else if (event === "directions") trackLandingDirectionsClick(source);
}

export function LandingHero({
  eyebrow,
  title,
  body,
  primaryCta,
  secondaryCtas,
  variant,
}: LandingHeroProps) {
  const reduce = useReducedMotion();

  const initial = reduce ? false : { opacity: 0, y: 12, filter: "blur(6px)" };
  const animate = reduce
    ? undefined
    : { opacity: 1, y: 0, filter: "blur(0px)" };

  const radialA =
    variant === "delivery"
      ? "radial-gradient(60% 60% at 20% 10%, rgba(192,57,43,0.35), transparent 70%)"
      : "radial-gradient(60% 60% at 80% 10%, rgba(230,126,34,0.30), transparent 70%)";
  const radialB =
    "radial-gradient(50% 50% at 90% 80%, rgba(13,13,13,0.0), rgba(13,13,13,0.6))";

  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      bg="bg"
      paddingBlock={{ base: 10, md: 20 }}
      paddingInline={{ base: 5, md: 8 }}
    >
      <Box
        aria-hidden
        position="absolute"
        inset="0"
        backgroundImage={`${radialA}, ${radialB}`}
        opacity={0.9}
        pointerEvents="none"
      />
      <Box
        aria-hidden
        position="absolute"
        inset="0"
        opacity={0.06}
        pointerEvents="none"
        backgroundImage="repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 6px)"
      />
      <Container maxW="container.lg" position="relative">
        <MotionStack
          gap={{ base: 5, md: 7 }}
          initial={initial}
          animate={animate}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Text
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            {eyebrow}
          </Text>
          <Text
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "3xl", sm: "4xl", md: "6xl" }}
            lineHeight="1.05"
            color="fg.default"
            maxW="22ch"
          >
            {title}
          </Text>
          <Text
            color="fg.muted"
            fontSize={{ base: "md", md: "lg" }}
            maxW="60ch"
          >
            {body}
          </Text>
          <HStack gap={3} flexWrap="wrap">
            <NextLink
              href={primaryCta.href}
              onClick={() => trackLandingOrderIntent(primaryCta.eventSource)}
            >
              <Button
                size="lg"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.emphasized" }}
                minH="48px"
                paddingInline={6}
              >
                {primaryCta.label}
              </Button>
            </NextLink>
            {secondaryCtas.map((cta) => (
              <NextLink
                key={cta.href}
                href={cta.href}
                onClick={() =>
                  trackSecondary(cta.eventName, primaryCta.eventSource)
                }
              >
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="border"
                  color="fg.default"
                  _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
                  minH="48px"
                >
                  {cta.label}
                </Button>
              </NextLink>
            ))}
          </HStack>
        </MotionStack>
      </Container>
    </Box>
  );
}
