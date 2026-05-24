import { Box, Button, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { aboutContent } from "@/lib/content/about";

export function AboutVisitCta() {
  const cta = aboutContent.visitCta;
  return (
    <Box
      as="section"
      bg="brand.subtle"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      padding={{ base: 6, md: 10 }}
      marginTop={{ base: 6, md: 10 }}
    >
      <Stack gap={4} maxW="48rem">
        <Heading as="h2" size={{ base: "lg", md: "xl" }} color="fg.default" fontFamily="heading">
          {cta.heading}
        </Heading>
        <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }}>
          {cta.body}
        </Text>
        <HStack gap={3} flexWrap="wrap" paddingTop={2}>
          <NextLink href={cta.primary.href} style={{ textDecoration: "none" }}>
            <Button bg="brand.solid" color="brand.contrast" _hover={{ bg: "brand.emphasized" }}>
              {cta.primary.label}
            </Button>
          </NextLink>
          <NextLink href={cta.secondary.href} style={{ textDecoration: "none" }}>
            <Button variant="outline" borderColor="border" color="fg.default" _hover={{ bg: "bg.subtle" }}>
              {cta.secondary.label}
            </Button>
          </NextLink>
          <NextLink href={cta.tertiary.href} style={{ textDecoration: "none" }}>
            <Button variant="ghost" color="fg.default" _hover={{ bg: "bg.subtle" }}>
              {cta.tertiary.label}
            </Button>
          </NextLink>
        </HStack>
      </Stack>
    </Box>
  );
}
