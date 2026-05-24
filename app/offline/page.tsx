import type { Metadata } from "next";
import { Box, Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <Box
      as="main"
      minH="70dvh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      paddingInline={6}
      paddingBlock={10}
      textAlign="center"
    >
      <Stack maxW="30rem" gap={4} align="center">
        <Heading as="h1" fontFamily="heading" fontSize="3xl">
          You&apos;re offline
        </Heading>
        <Text color="fg.muted" lineHeight="1.6">
          We can&apos;t reach the kitchen right now. Check your connection and
          try again — or call us on{" "}
          <ChakraLink href={`tel:${siteConfig.phoneTel}`} color="brand.fg" fontWeight={600}>
            {siteConfig.phone}
          </ChakraLink>
          .
        </Text>
      </Stack>
    </Box>
  );
}
