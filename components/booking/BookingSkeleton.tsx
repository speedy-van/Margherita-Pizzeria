"use client";

import { Box, Stack } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export function BookingSkeleton() {
  return (
    <Stack gap={6}>
      <SkeletonBlock height="32px" width="60%" radius="md" />
      <SkeletonBlock height="20px" width="80%" radius="md" />
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(96px, 1fr))"
        gap={2}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} height="44px" radius="md" />
        ))}
      </Box>
      <SkeletonBlock height="160px" radius="lg" />
    </Stack>
  );
}
