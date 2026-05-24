"use client";

import { Box, Button, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import {
  trackLandingMenuClick,
  type LandingSource,
} from "@/lib/analytics/conversion-events";
import type { LandingMenuPreviewItem } from "@/lib/content/landing";

export interface LandingMenuPreviewProps {
  source: LandingSource;
  title: string;
  body: string;
  items: LandingMenuPreviewItem[];
  cta: { label: string; href: string };
}

export function LandingMenuPreview({
  source,
  title,
  body,
  items,
  cta,
}: LandingMenuPreviewProps) {
  return (
    <Box
      as="section"
      bg="bg.subtle"
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
              {title}
            </Heading>
            <Text color="fg.muted" maxW="60ch">
              {body}
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={{ base: 3, md: 4 }}>
            {items.map((item) => (
              <Stack
                key={item.name}
                bg="bg"
                borderWidth="1px"
                borderColor="border"
                borderRadius="lg"
                padding={4}
                gap={2}
              >
                <Text fontWeight="700" color="fg.default">
                  {item.name}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {item.description}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>

          <Box>
            <NextLink href={cta.href} onClick={() => trackLandingMenuClick(source)}>
              <Button
                size="lg"
                variant="outline"
                borderColor="border"
                color="fg.default"
                _hover={{ borderColor: "brand.fg", color: "brand.fg" }}
              >
                {cta.label}
              </Button>
            </NextLink>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
