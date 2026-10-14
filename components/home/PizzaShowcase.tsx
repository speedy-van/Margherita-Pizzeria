"use client";

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
import { motion, useReducedMotion } from "framer-motion";
import NextLink from "next/link";

import { homeContent, type HomePizzaCard } from "@/lib/content/home";

const MotionBox = motion.create(Box);

// Indicative price per pizza for the showcase pills (12" base).
const PRICE_FROM: Record<string, string> = {
  margherita: "£9.68",
  pepperoni: "£10.56",
  donner: "£11.44",
};

interface PizzaCardProps {
  pizza: HomePizzaCard;
  index: number;
  reduceMotion: boolean;
}

function PizzaCard({ pizza, index, reduceMotion }: PizzaCardProps) {
  const initial = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 32 };
  const inView = { opacity: 1, y: 0 };
  const priceFrom = PRICE_FROM[pizza.id];

  return (
    <MotionBox
      initial={initial}
      whileInView={inView}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="rgba(164,189,167,0.78)"
      borderRadius="2xl"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      position="relative"
      boxShadow="0 0 0 1px rgba(164,189,167,0.24), 0 0 18px rgba(164,189,167,0.28), 0 12px 32px rgba(0,0,0,0.08)"
      css={{
        "&:hover": {
          borderColor: "rgba(164,189,167,1)",
          boxShadow:
            "0 0 0 1px rgba(164,189,167,0.42), 0 0 30px rgba(164,189,167,0.5), 0 18px 44px rgba(0,0,0,0.12)",
        },
        transition: "border-color .2s ease, box-shadow .2s ease",
      }}
    >
      {/* Image */}
      <Box
        position="relative"
        height={{ base: "240px", md: "280px" }}
        bg="surface.base"
        overflow="hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element, react/forbid-dom-props */}
        <img
          src={pizza.imageUrl}
          alt={pizza.name}
          loading="lazy"
          // eslint-disable-next-line react/forbid-component-props
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform .6s ease",
          }}
        />
        {/* top fade for label legibility */}
        <Box
          aria-hidden
          position="absolute"
          inset={0}
          backgroundImage="linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.55) 100%)"
        />

        {priceFrom ? (
          <Box
            position="absolute"
            top={3}
            left={3}
            bg="brand.solid"
            color="brand.contrast"
            paddingInline={3}
            paddingBlock={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="800"
            letterSpacing="0.04em"
            boxShadow="0 6px 18px rgba(164,189,167,0.45)"
          >
            From {priceFrom}
          </Box>
        ) : null}

        <HStack
          position="absolute"
          bottom={3}
          left={3}
          gap={1.5}
          bg="rgba(252,251,247,0.82)"
          borderWidth="1px"
          borderColor="rgba(0,0,0,0.14)"
          borderRadius="full"
          paddingInline={2.5}
          paddingBlock={1}
          backdropFilter="blur(8px)"
        >
          <Text color="fg.default" fontSize="2xs" fontWeight="700" letterSpacing="0.08em">
            HALAL · 24H SOURDOUGH
          </Text>
        </HStack>
      </Box>

      <Stack gap={3} padding={{ base: 5, md: 6 }} flex={1}>
        <Stack gap={1}>
          <Text
            textTransform="uppercase"
            letterSpacing="0.16em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            {pizza.tagline}
          </Text>
          <Heading as="h3" size="md" color="fg.default" fontFamily="heading">
            {pizza.name}
          </Heading>
        </Stack>
        <Text color="fg.muted">{pizza.description}</Text>
        <HStack gap={1.5} flexWrap="wrap" paddingTop={1}>
          {pizza.toppings.map((t) => (
            <Text
              key={t}
              fontSize="2xs"
              fontWeight="700"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="0.06em"
              borderWidth="1px"
              borderColor="border"
              borderRadius="full"
              paddingInline={2}
              paddingBlock={0.5}
            >
              {t}
            </Text>
          ))}
        </HStack>
        <Box paddingTop={2} marginTop="auto">
          <NextLink href="/menu" style={{ textDecoration: "none" }}>
            <Button
              size="sm"
              variant="outline"
              borderColor="border"
              color="fg.default"
              _hover={{ bg: "bg", borderColor: "brand.solid" }}
              width="100%"
            >
              Add to order
            </Button>
          </NextLink>
        </Box>
      </Stack>
    </MotionBox>
  );
}

export function PizzaShowcase() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <Box as="section" bg="bg" paddingBlock={{ base: 16, md: 24 }} paddingInline={{ base: 5, md: 8 }}>
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
              On the menu
            </Text>
            <Heading
              as="h2"
              size={{ base: "xl", md: "2xl" }}
              color="fg.default"
              fontFamily="heading"
            >
              Made fresh. Fired in about 90 seconds.
            </Heading>
            <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }}>
              A few of our regulars — see the full menu for everything from
              stuffed-crust to seafood pizzas.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 5, md: 6 }}>
            {homeContent.pizzas.map((pizza, i) => (
              <PizzaCard key={pizza.id} pizza={pizza} index={i} reduceMotion={reduceMotion} />
            ))}
          </SimpleGrid>

          <HStack justify="center" paddingTop={2}>
            <NextLink href="/menu" style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.emphasized" }}
                boxShadow="0 12px 28px rgba(164,189,167,0.35)"
              >
                See the full menu →
              </Button>
            </NextLink>
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
}
