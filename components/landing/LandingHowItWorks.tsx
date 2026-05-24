import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import type { LandingHowItWorksStep } from "@/lib/content/landing";

export interface LandingHowItWorksProps {
  title: string;
  steps: LandingHowItWorksStep[];
}

export function LandingHowItWorks({ title, steps }: LandingHowItWorksProps) {
  return (
    <Box
      as="section"
      paddingBlock={{ base: 10, md: 16 }}
      paddingInline={{ base: 5, md: 8 }}
    >
      <Container maxW="container.xl">
        <Stack gap={{ base: 6, md: 8 }}>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize={{ base: "2xl", md: "4xl" }}
            color="fg.default"
          >
            {title}
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 4 }} gap={{ base: 4, md: 6 }}>
            {steps.map((step) => (
              <Stack
                key={step.step}
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                padding={{ base: 5, md: 6 }}
                gap={3}
              >
                <Flex
                  align="center"
                  justify="center"
                  w="36px"
                  h="36px"
                  borderRadius="full"
                  bg="brand.solid"
                  color="brand.contrast"
                  fontWeight="700"
                  fontFamily="heading"
                >
                  {step.step}
                </Flex>
                <Heading as="h3" fontSize="lg" color="fg.default">
                  {step.title}
                </Heading>
                <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
                  {step.body}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
