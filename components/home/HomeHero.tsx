"use client";

import {
  Box,
  Button,
  Container,
  HStack,
  SimpleGrid,
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
const ratingLabel = siteConfig.rating.toFixed(1);

export interface HomeHeroProps {
  backgroundImageUrl?: string | null;
  menuPreviewCategories?: {
    id: string;
    name: string;
    itemCount: number;
    imageUrl: string | null;
  }[];
}

const HERO_BADGES = [
  { icon: "🍕", label: "24h Sourdough" },
  { icon: "✅", label: "Halal Certified" },
  { icon: "🚴", label: "£4.49 delivery" },
  { icon: "⭐", label: `${ratingLabel} / 5` },
] as const;

export function HomeHero({
  backgroundImageUrl = null,
  menuPreviewCategories = [],
}: HomeHeroProps = {}) {
  const reduceMotion = useReducedMotion();
  const hero = homeContent.hero;

  const videoSrc = "/legacy/pizza-making.mp4";
  const posterSrc = "/legacy/pizza-making-poster.jpg";
  const resolvedPoster = backgroundImageUrl ?? posterSrc;
  const floatPizza = "/legacy/margherita-real.jpg";

  const initial = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 };
  const animate = { opacity: 1, y: 0 };

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

      {/* Light brand wash so text stays readable without softening the background. */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="linear-gradient(90deg, rgba(252,251,247,0.88) 0%, rgba(252,251,247,0.68) 44%, rgba(252,251,247,0.18) 100%), linear-gradient(180deg, rgba(252,251,247,0.18) 0%, rgba(252,251,247,0.04) 100%)"
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
          boxShadow="0 40px 120px rgba(0,0,0,0.24), 0 0 0 8px rgba(252,251,247,0.28), 0 0 0 16px rgba(164,189,167,0.22)"
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
              color="fg.default"
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
            backgroundImage="none"
            backgroundSize="300% 100%"
            backgroundClip="text"
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "#000000",
              backgroundPosition: "200% 0",
              animation: "hero-shimmer 5.5s linear infinite",
            }}
            css={{
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
                WebkitTextFillColor: "#000000",
              },
            }}
          >
            {hero.headline}
          </Box>

          <Text
            fontSize={{ base: "md", md: "lg" }}
            maxW="44rem"
            fontWeight="medium"
            color="fg.muted"
          >
            {hero.body}
          </Text>

          {/* Trust badges row */}
          <HStack gap={2} flexWrap="wrap" paddingTop={1}>
            {HERO_BADGES.map((b) => (
              <HStack
                key={b.label}
                gap={1.5}
                bg="rgba(252,251,247,0.72)"
                borderWidth="1px"
                borderColor="rgba(0,0,0,0.12)"
                borderRadius="full"
                paddingInline={3}
                paddingBlock={1.5}
              >
                <Text fontSize="sm" aria-hidden>
                  {b.icon}
                </Text>
                <Text fontSize="xs" fontWeight="700" color="fg.default">
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
                boxShadow="0 12px 28px rgba(164,189,167,0.42)"
                transition="all 0.18s ease"
              >
                {hero.primaryCta.label}
              </Button>
            </NextLink>
            <NextLink href={hero.secondaryCta.href} style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                variant="outline"
                borderColor="rgba(0,0,0,0.34)"
                color="fg.default"
                bg="rgba(252,251,247,0.72)"
                _hover={{ bg: "rgba(0,0,0,0.06)" }}
              >
                {hero.secondaryCta.label}
              </Button>
            </NextLink>
            <NextLink href={hero.tertiaryCta.href} style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                variant="ghost"
                color="fg.default"
                _hover={{ bg: "rgba(0,0,0,0.06)" }}
              >
                {hero.tertiaryCta.label}
              </Button>
            </NextLink>
          </HStack>

          {menuPreviewCategories.length > 0 ? (
            <Stack gap={3} paddingTop={4}>
              <Text
                textTransform="uppercase"
                letterSpacing="0.14em"
                fontSize="xs"
                color="fg.muted"
                fontWeight="700"
              >
                Browse the menu now
              </Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                {menuPreviewCategories.map((category) => (
                  <NextLink
                    key={category.id}
                    href={`/menu#menu-cat-${category.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Box
                      borderRadius="xl"
                      overflow="hidden"
                      borderWidth="1px"
                      borderColor="rgba(164,189,167,0.78)"
                      backgroundColor="rgba(252,251,247,0.82)"
                      minH="120px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="flex-end"
                      position="relative"
                      boxShadow="inset 0 0 0 1px rgba(255,255,255,0.45), 0 0 0 1px rgba(164,189,167,0.22), 0 0 18px rgba(164,189,167,0.26), 0 10px 24px rgba(0,0,0,0.1)"
                      _hover={{
                        transform: "translateY(-2px)",
                        borderColor: "rgba(164,189,167,1)",
                        boxShadow:
                          "inset 0 0 0 1px rgba(255,255,255,0.55), 0 0 0 1px rgba(164,189,167,0.42), 0 0 30px rgba(164,189,167,0.5), 0 14px 28px rgba(0,0,0,0.14)",
                      }}
                      transition="all 0.18s ease"
                      style={
                        category.imageUrl
                          ? {
                              backgroundImage: `linear-gradient(180deg, rgba(252,251,247,0.18) 0%, rgba(252,251,247,0.86) 100%), url("${category.imageUrl.replace(/"/g, "%22")}")`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <Box padding={3}>
                        <Text color="fg.default" fontSize="sm" fontWeight="800" lineClamp="1">
                          {category.name}
                        </Text>
                        <Text color="fg.muted" fontSize="xs" fontWeight="600">
                          {category.itemCount} dishes
                        </Text>
                      </Box>
                    </Box>
                  </NextLink>
                ))}
              </SimpleGrid>
            </Stack>
          ) : null}
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
        backgroundImage="linear-gradient(180deg, transparent, #FCFBF7)"
        pointerEvents="none"
      />
    </Box>
  );
}
