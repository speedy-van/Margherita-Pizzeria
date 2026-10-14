"use client";

import { Badge, Box, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { siteConfig } from "@/lib/config/site";
import { testimonials } from "@/lib/content/testimonials";

function Stars({ rating }: { rating: number }) {
  return (
    <Text aria-label={`${rating} out of 5 stars`} color="brand.fg" letterSpacing="0.1em">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </Text>
  );
}

export function ReviewsBand() {
  const ratingLabel = siteConfig.rating.toFixed(1);

  return (
    <Box as="section" bg="bg.subtle" borderTopWidth="1px" borderColor="border" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl" paddingInline={{ base: 5, md: 8 }}>
        <Stack gap={3} mb={{ base: 8, md: 10 }} textAlign="center">
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.18em"
            color="brand.fg"
            fontWeight="700"
          >
            What our customers say
          </Text>
          <Heading as="h2" size={{ base: "lg", md: "xl" }} fontFamily="heading">
            {ratingLabel}★ from {siteConfig.reviewCount}+ reviews
          </Heading>
          <Text color="fg.muted">Based on Google reviews.</Text>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={{ base: 5, md: 6 }}>
          {testimonials.slice(0, 6).map((review) => (
            <Stack
              key={review.id}
              bg="bg.default"
              borderWidth="1px"
              borderColor="rgba(164,189,167,0.78)"
              borderRadius="lg"
              p={{ base: 5, md: 6 }}
              gap={3}
              boxShadow="0 0 0 1px rgba(164,189,167,0.22), 0 0 18px rgba(164,189,167,0.22), 0 10px 26px rgba(0,0,0,0.06)"
              transition="border-color .2s ease, box-shadow .2s ease"
              _hover={{
                borderColor: "rgba(164,189,167,1)",
                boxShadow:
                  "0 0 0 1px rgba(164,189,167,0.4), 0 0 28px rgba(164,189,167,0.42), 0 16px 34px rgba(0,0,0,0.1)",
              }}
            >
              <Stars rating={review.rating} />
              <Text color="fg.default" fontStyle="italic">
                “{review.quote}”
              </Text>
              <Stack direction="row" justify="space-between" align="center" pt={2}>
                <Text fontWeight="700" color="fg.default">
                  {review.name}
                </Text>
                <Badge
                  colorPalette={review.source === "GOOGLE" ? "blue" : "orange"}
                  variant="subtle"
                >
                  {review.source.replace("_", " ")}
                </Badge>
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
