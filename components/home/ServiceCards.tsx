"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import NextLink from "next/link";

import { homeContent, type HomeServiceCard } from "@/lib/content/home";

const MotionBox = motion.create(Box);

const ICONS: Record<HomeServiceCard["id"], string> = {
  delivery: "🛵",
  collection: "🛍️",
  "dine-in": "🍽️",
};

const ACCENTS: Record<HomeServiceCard["id"], { from: string; to: string; ring: string }> = {
  delivery: { from: "#C0392B", to: "#E67E22", ring: "rgba(230,126,34,0.35)" },
  collection: { from: "#0EA5E9", to: "#22D3EE", ring: "rgba(14,165,233,0.35)" },
  "dine-in": { from: "#8B5CF6", to: "#EC4899", ring: "rgba(139,92,246,0.35)" },
};

function ServiceCard({ service, reduceMotion }: { service: HomeServiceCard; reduceMotion: boolean }) {
  const accent = ACCENTS[service.id];
  return (
    <MotionBox
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.2 }}
      position="relative"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      padding={{ base: 6, md: 7 }}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      css={{
        "&:hover": { borderColor: accent.ring },
        transition: "border-color .2s ease",
      }}
    >
      {/* accent corner glow */}
      <Box
        aria-hidden
        position="absolute"
        top={-40}
        right={-40}
        width="160px"
        height="160px"
        borderRadius="full"
        opacity={0.35}
        style={{
          background: `radial-gradient(circle, ${accent.ring}, transparent 70%)`,
        }}
      />

      <Stack gap={4} flex={1} position="relative">
        <Box
          width="52px"
          height="52px"
          borderRadius="xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="26px"
          style={{
            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            boxShadow: `0 10px 24px ${accent.ring}`,
          }}
          aria-hidden
        >
          {ICONS[service.id]}
        </Box>
        <Heading as="h3" size="md" color="fg.default" fontFamily="heading">
          {service.title}
        </Heading>
        <Text color="fg.muted">{service.body}</Text>
        <Box marginTop="auto" paddingTop={2}>
          <NextLink href={service.ctaHref} style={{ textDecoration: "none" }}>
            <Button
              variant="outline"
              borderColor="border"
              color="fg.default"
              _hover={{ bg: "bg" }}
              width="100%"
            >
              {service.ctaLabel} →
            </Button>
          </NextLink>
        </Box>
      </Stack>
    </MotionBox>
  );
}

export function ServiceCards() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <Box as="section" bg="bg.subtle" paddingBlock={{ base: 16, md: 24 }} paddingInline={{ base: 5, md: 8 }}>
      <Container maxW="container.xl">
        <Stack gap={{ base: 8, md: 12 }}>
          <Stack gap={3} maxW="44rem">
            <Text
              textTransform="uppercase"
              letterSpacing="0.2em"
              fontSize="xs"
              color="brand.fg"
              fontWeight="700"
            >
              Three ways to enjoy us
            </Text>
            <Heading as="h2" size={{ base: "xl", md: "2xl" }} color="fg.default" fontFamily="heading">
              Delivered, collected or eaten in.
            </Heading>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 5, md: 6 }}>
            {homeContent.services.map((s) => (
              <ServiceCard key={s.id} service={s} reduceMotion={reduceMotion} />
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
