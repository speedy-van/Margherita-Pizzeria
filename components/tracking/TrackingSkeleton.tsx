"use client";

import { Box, Container, Stack } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export function TrackingSkeleton() {
  return (
    <Box paddingBlock={{ base: 10, md: 16 }}>
      <Container maxW="container.lg" paddingInline={{ base: 5, md: 8 }}>
        <Stack gap={{ base: 6, md: 8 }}>
          <Stack gap={3}>
            <SkeletonBlock height="14px" width="80px" />
            <SkeletonBlock height="44px" width="60%" />
            <SkeletonBlock height="20px" width="80%" />
          </Stack>
          <SkeletonBlock height="260px" radius="xl" />
          <Stack gap={4}>
            <SkeletonBlock height="120px" radius="xl" />
            <SkeletonBlock height="180px" radius="xl" />
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
