import { Box, Container, SimpleGrid, Stack } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export default function OrderLoading() {
  return (
    <Box paddingBlock={{ base: 10, md: 16 }}>
      <Container maxW="container.xl" paddingInline={{ base: 5, md: 8 }}>
        <Stack gap={{ base: 6, md: 8 }}>
          <Stack gap={3}>
            <SkeletonBlock height="14px" width="80px" />
            <SkeletonBlock height="44px" width="60%" />
            <SkeletonBlock height="20px" width="80%" />
          </Stack>
          <SimpleGrid columns={{ base: 1, lg: 12 }} gap={{ base: 6, lg: 8 }}>
            <Stack gap={5} gridColumn={{ base: "auto", lg: "span 7" }}>
              <SkeletonBlock height="64px" />
              <SkeletonBlock height="120px" />
              <SkeletonBlock height="160px" />
              <SkeletonBlock height="120px" />
            </Stack>
            <Stack gap={5} gridColumn={{ base: "auto", lg: "span 5" }}>
              <SkeletonBlock height="200px" />
              <SkeletonBlock height="160px" />
              <SkeletonBlock height="56px" />
            </Stack>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
