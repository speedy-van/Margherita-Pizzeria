"use client";

import {
  Box,
  Button,
  Container,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import NextLink from "next/link";

import { siteConfig } from "@/lib/config/site";
import { homeContent } from "@/lib/content/home";

const MotionStack = motion.create(Stack);
const MotionText = motion.create(Text);
const MotionBox = motion.create(Box);

export interface HomeHeroProps {
  backgroundImageUrl?: string | null;
}

const HERO_BADGES = [
  { icon: "🍕", label: "24h Sourdough" },
  { icon: "✅", label: "Halal Certified" },
  { icon: "🚴", label: "Free in G31" },
  { icon: "⭐", label: `${siteConfig.rating} / 5` },
] as const;

export function HomeHero({ backgroundImageUrl = null }: HomeHeroProps = {}) {
  const reduceMotion = useReducedMotion();
  const hero = homeContent.hero;

  const videoSrc = "/legacy/pizza-making.mp4";
  const posterSrc = "/legacy/pizza-making-poster.jpg";
  const resolvedPoster = backgroundImageUrl ?? posterSrc;
  const floatPizza = "/legacy/margherita-real.jpg";

  const initial = reduceMotion
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 0, y: 24, filter: "blur(8px)" };
  const animate = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      bg="surface.base"
      paddingBlock={{ base: 20, md: 32, lg: 36 }}
      paddingInline={{ base: 5, md: 8 }}
      minH={{ md: "92dvh" }}
      display="flex"
      alignItems="center"
    >
      {/* Hero video / poster */}
      {reduceMotion ? (
        <Box
          aria-hidden
          position="absolute"
          inset={0}
          style={{
            backgroundImage: `url("${resolvedPoster.replace(/"/g, "%22")}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <Box
          aria-hidden
          as="video"
          position="absolute"
          inset={0}
          width="100%"
          height="100%"
          style={{ objectFit: "cover" }}
          // @ts-expect-error -- Chakra Box forwards these to the underlying <video>
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={resolvedPoster}
        >
          <source src={videoSrc} type="video/mp4" />
        </Box>
      )}

      {/* Cinematic dark + brand gradient overlay */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="linear-gradient(180deg, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.82) 100%), radial-gradient(ellipse at 18% 0%, rgba(192,57,43,0.55), transparent 55%), radial-gradient(ellipse at 82% 100%, rgba(230,126,34,0.35), transparent 60%)"
      />

      {/* Grain */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        opacity={0.08}
        mixBlendMode="overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Floating pizza disc (decorative, right side, desktop only) */}
      {!reduceMotion ? (
        <MotionBox
          aria-hidden
          position="absolute"
          display={{ base: "none", lg: "block" }}
          right={{ lg: "-80px", xl: "-40px" }}
          top="50%"
          width={{ lg: "520px", xl: "620px" }}
          height={{ lg: "520px", xl: "620px" }}
          borderRadius="full"
          overflow="hidden"
          boxShadow="0 40px 120px rgba(0,0,0,0.6), 0 0 0 8px rgba(245,245,240,0.08), 0 0 0 16px rgba(230,126,34,0.18)"
          style={{
            translateY: "-50%",
          }}
          initial={{ opacity: 0, scale: 0.85, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        >
          <MotionBox
            position="absolute"
            inset={0}
            animate={{ rotate: 360 }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            style={{
              backgroundImage: `url("${floatPizza}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </MotionBox>
      ) : null}

      <Container maxW="container.xl" position="relative">
        <MotionStack
          gap={6}
          maxW={{ base: "100%", lg: "58%" }}
          initial={initial}
          animate={animate}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Live status pill */}
          <HStack gap={2}>
            <Box
              as="span"
              display="inline-block"
              width="8px"
              height="8px"
              borderRadius="full"
              bg="#22c55e"
              boxShadow="0 0 0 0 rgba(34,197,94,0.7)"
              css={{
                animation: reduceMotion ? undefined : "pulse-green 1.8s ease-out infinite",
                "@keyframes pulse-green": {
                  "0%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.7)" },
                  "70%": { boxShadow: "0 0 0 10px rgba(34,197,94,0)" },
                  "100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0)" },
                },
              }}
            />
            <Text
              fontSize="xs"
              fontWeight="700"
              color="whiteAlpha.900"
              textTransform="uppercase"
              letterSpacing="0.18em"
            >
              Open now · delivering till late
            </Text>
          </HStack>

          <MotionText
            textTransform="uppercase"
            letterSpacing="0.22em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
            initial={initial}
            animate={animate}
            transition={{ duration: 0.5 }}
          >
            {hero.eyebrow}
          </MotionText>

          <Box
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "4xl", sm: "5xl", md: "6xl", lg: "7xl" }}
            lineHeight="1.02"
            color="fg.default"
            letterSpacing="-0.02em"
            position="relative"
            display="inline-block"
            backgroundImage="linear-gradient(110deg, #F5F5F0 0%, #F5F5F0 35%, #FFFFFF 47%, #E67E22 52%, #FFFFFF 57%, #F5F5F0 65%, #F5F5F0 100%)"
            backgroundSize="300% 100%"
            backgroundClip="text"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundPosition: "200% 0",
              animation: "hero-shimmer 5.5s linear infinite",
            }}
            css={{
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
                WebkitTextFillColor: "#F5F5F0",
              },
            }}
          >
            {hero.headline}
          </Box>

          <Text
            fontSize={{ base: "md", md: "lg" }}
            maxW="44rem"
            fontWeight="medium"
            color="whiteAlpha.900"
          >
            {hero.body}
          </Text>

          {/* Trust badges row */}
          <HStack gap={2} flexWrap="wrap" paddingTop={1}>
            {HERO_BADGES.map((b) => (
              <HStack
                key={b.label}
                gap={1.5}
                bg="rgba(255,255,255,0.08)"
                borderWidth="1px"
                borderColor="rgba(255,255,255,0.18)"
                borderRadius="full"
                paddingInline={3}
                paddingBlock={1.5}
                backdropFilter="blur(8px)"
              >
                <Text fontSize="sm" aria-hidden>
                  {b.icon}
                </Text>
                <Text fontSize="xs" fontWeight="700" color="white">
                  {b.label}
                </Text>
              </HStack>
            ))}
          </HStack>

          <HStack gap={3} flexWrap="wrap" paddingTop={2}>
            <NextLink href={hero.primaryCta.href} style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.emphasized", transform: "translateY(-1px)" }}
                boxShadow="0 12px 28px rgba(192,57,43,0.45)"
                transition="all 0.18s ease"
              >
                {hero.primaryCta.label}
              </Button>
            </NextLink>
            <NextLink href={hero.secondaryCta.href} style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                variant="outline"
                borderColor="whiteAlpha.700"
                color="white"
                bg="whiteAlpha.100"
                backdropFilter="blur(8px)"
                _hover={{ bg: "whiteAlpha.300" }}
              >
                {hero.secondaryCta.label}
              </Button>
            </NextLink>
            <NextLink href={hero.tertiaryCta.href} style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
              >
                {hero.tertiaryCta.label}
              </Button>
            </NextLink>
          </HStack>
        </MotionStack>
      </Container>

      {/* Bottom curve */}
      <Box
        aria-hidden
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height="48px"
        backgroundImage="linear-gradient(180deg, transparent, rgba(0,0,0,0.45))"
        pointerEvents="none"
      />
    </Box>
  );
}
