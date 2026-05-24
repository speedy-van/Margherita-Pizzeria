import { Box, Container, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import type { LandingTrustItem } from "@/lib/content/landing";

export interface LandingTrustBarProps {
  items: LandingTrustItem[];
}

export function LandingTrustBar({ items }: LandingTrustBarProps) {
  return (
    <Box
      as="section"
      bg="bg.subtle"
      borderBlockWidth="1px"
      borderColor="border"
      paddingBlock={{ base: 5, md: 6 }}
      paddingInline={{ base: 4, md: 8 }}
    >
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 4, md: 6 }}>
          {items.map((item) => (
            <Stack key={item.label} gap={1}>
              <Text
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.16em"
                color="fg.muted"
                fontWeight="600"
              >
                {item.label}
              </Text>
              <Text fontSize={{ base: "sm", md: "md" }} color="fg.default" fontWeight="600">
                {item.value}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
