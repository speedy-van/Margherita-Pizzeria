import { Box, Button, HStack, Stack } from "@chakra-ui/react";
import type { Metadata } from "next";
import NextLink from "next/link";

import { DirectionsMapPlaceholder } from "@/components/directions/DirectionsMapPlaceholder";
import { DirectionsRouteCards } from "@/components/directions/DirectionsRouteCards";
import { ParkingInfo } from "@/components/directions/ParkingInfo";
import { TransportInfo } from "@/components/directions/TransportInfo";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageShell } from "@/components/ui/PageShell";
import { directionsContent } from "@/lib/content/directions";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";
import { buildDirectionsPageSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = createPageMetadata({
  title: "Directions to Margherita Pizzeria | Alexandra Parade Glasgow",
  description:
    "Find Margherita Pizzeria at 652 Alexandra Parade, Glasgow G31 3BU, with route guidance for collection and dine-in visits.",
  path: "/directions",
  keywords: getKeywordsForPath("/directions"),
});

const placeJsonLd: Record<string, unknown> = {
  ...buildDirectionsPageSchema(),
  hasMap: directionsContent.mapSearchUrl,
};

export default function DirectionsPage() {
  return (
    <PageShell
      eyebrow={directionsContent.hero.eyebrow}
      title={directionsContent.hero.title}
      description={directionsContent.hero.description}
      maxW="container.xl"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Directions", path: "/directions" },
        ]}
      />
      <Stack gap={{ base: 6, md: 8 }}>
        <DirectionsMapPlaceholder />

        <HStack gap={3} flexWrap="wrap">
          <NextLink
            href={directionsContent.mapSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Button bg="brand.solid" color="brand.contrast" _hover={{ bg: "brand.emphasized" }}>
              Open in maps
            </Button>
          </NextLink>
          <NextLink href="/order" style={{ textDecoration: "none" }}>
            <Button variant="outline" borderColor="border" color="fg.default" _hover={{ bg: "bg.subtle" }}>
              Order for collection
            </Button>
          </NextLink>
          <NextLink href="/book" style={{ textDecoration: "none" }}>
            <Button variant="ghost" color="fg.default" _hover={{ bg: "bg.subtle" }}>
              Book a table
            </Button>
          </NextLink>
        </HStack>

        <Box>
          <DirectionsRouteCards />
        </Box>
        <Box>
          <TransportInfo />
        </Box>
        <Box>
          <ParkingInfo />
        </Box>
      </Stack>
      <JsonLd data={placeJsonLd} id="ld-directions" />
    </PageShell>
  );
}
