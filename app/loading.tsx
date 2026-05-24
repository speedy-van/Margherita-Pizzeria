import { Box, Container, Stack } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export default function Loading() {
  return (
    <Box paddingBlock={{ base: 10, md: 16 }}>
      <Container maxW="container.lg" paddingInline={{ base: 5, md: 8 }}>
        <Stack gap={6}>
          <SkeletonBlock height="14px" width="120px" />
          <SkeletonBlock height="44px" width="80%" />
          <SkeletonBlock height="20px" width="60%" />
          <Stack gap={3}>
            <SkeletonBlock height="120px" />
            <SkeletonBlock height="120px" />
            <SkeletonBlock height="120px" />
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
