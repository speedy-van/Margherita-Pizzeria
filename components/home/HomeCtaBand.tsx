import {
  Box,
  Button,
  Container,
  HStack,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";

import { homeContent } from "@/lib/content/home";

export function HomeCtaBand() {
  const cta = homeContent.finalCta;
  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      bg="brand.subtle"
      borderTopWidth="1px"
      borderBottomWidth="1px"
      borderColor="border"
      paddingBlock={{ base: 14, md: 20 }}
      paddingInline={{ base: 5, md: 8 }}
    >
      {/* Background photo */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="url('/legacy/pepperoni-real.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
      />
      {/* Light gradient overlay for the required black text. */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="linear-gradient(105deg, rgba(252,251,247,0.94) 0%, rgba(252,251,247,0.84) 45%, rgba(252,251,247,0.62) 100%)"
      />
      {/* Brand color wash */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="radial-gradient(ellipse at 100% 0%, rgba(164,189,167,0.18), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(164,189,167,0.18), transparent 55%)"
      />
      <Container maxW="container.xl" position="relative">
        <Stack gap={5} maxW="46rem">
          <Text
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            {cta.eyebrow}
          </Text>
          <Heading
            as="h2"
            size={{ base: "xl", md: "2xl" }}
            color="fg.default"
            fontFamily="heading"
          >
            {cta.heading}
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }}>
            {cta.body}
          </Text>
          <HStack gap={3} flexWrap="wrap">
            <NextLink href={cta.primary.href} style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.emphasized" }}
              >
                {cta.primary.label}
              </Button>
            </NextLink>
            <NextLink href={cta.secondary.href} style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                variant="outline"
                borderColor="rgba(0,0,0,0.34)"
                color="fg.default"
                _hover={{ bg: "rgba(0,0,0,0.06)" }}
              >
                {cta.secondary.label}
              </Button>
            </NextLink>
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
}
