import { Box, Container, Stack } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export default function BookLoading() {
  return (
    <Box paddingBlock={{ base: 6, md: 10 }}>
      <Container maxW="5xl">
        <Stack gap={6}>
          <SkeletonBlock height="36px" width="50%" />
          <SkeletonBlock height="20px" width="70%" />
          <SkeletonBlock height="56px" width="260px" />
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(96px, 1fr))"
            gap={2}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBlock key={i} height="44px" />
            ))}
          </Box>
          <SkeletonBlock height="180px" />
          <SkeletonBlock height="120px" />
        </Stack>
      </Container>
    </Box>
  );
}
