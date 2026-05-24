import { Box, Button, Container, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Page not found",
  description: "We couldn't find that page. Browse the menu or start an order instead.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <Box paddingBlock={{ base: 16, md: 24 }}>
      <Container maxW="container.md" paddingInline={{ base: 5, md: 8 }}>
        <Stack gap={6}>
          <Text
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            404
          </Text>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "3xl", md: "5xl" }}
            color="fg.default"
          >
            We couldn&apos;t find that page.
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }}>
            The page may have moved or never existed. Try the menu or jump
            straight into an order.
          </Text>
          <HStack gap={3} flexWrap="wrap">
            <NextLink href="/">
              <Button bg="brand.solid" color="brand.contrast" _hover={{ bg: "brand.emphasized" }}>
                Back to home
              </Button>
            </NextLink>
            <NextLink href="/order">
              <Button variant="outline" borderColor="border" color="fg.default">
                Start an order
              </Button>
            </NextLink>
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
}
