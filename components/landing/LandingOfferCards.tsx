"use client";

import { Box, Button, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import {
  trackLandingBookClick,
  trackLandingOrderIntent,
  type LandingSource,
} from "@/lib/analytics/conversion-events";
import type { LandingOfferCard } from "@/lib/content/landing";

export interface LandingOfferCardsProps {
  source: LandingSource;
  offers: LandingOfferCard[];
}

export function LandingOfferCards({ source, offers }: LandingOfferCardsProps) {
  return (
    <Box
      as="section"
      paddingBlock={{ base: 10, md: 16 }}
      paddingInline={{ base: 5, md: 8 }}
    >
      <Container maxW="container.xl">
        <Stack gap={{ base: 6, md: 8 }}>
          <Stack gap={2}>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={{ base: "2xl", md: "4xl" }}
              color="fg.default"
            >
              Choose how you want it
            </Heading>
            <Text color="fg.muted" maxW="60ch">
              Delivery within {`5 miles of G31`}, collection from Alexandra Parade, or dine in with us.
            </Text>
          </Stack>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 4, md: 6 }}>
            {offers.map((offer) => (
              <Stack
                key={offer.id}
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                padding={{ base: 5, md: 6 }}
                gap={3}
                justify="space-between"
              >
                <Stack gap={2}>
                  <Heading as="h3" fontSize="xl" color="fg.default">
                    {offer.title}
                  </Heading>
                  <Text color="fg.muted">{offer.description}</Text>
                </Stack>
                <Box>
                  <NextLink
                    href={offer.cta.href}
                    onClick={() => {
                      if (offer.id === "delivery" || offer.id === "collection") {
                        trackLandingOrderIntent(source);
                      } else if (offer.id === "dinein") {
                        trackLandingBookClick(source);
                      }
                    }}
                  >
                    <Button
                      bg="brand.solid"
                      color="brand.contrast"
                      _hover={{ bg: "brand.emphasized" }}
                      minH="44px"
                    >
                      {offer.cta.label}
                    </Button>
                  </NextLink>
                </Box>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
