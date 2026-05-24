import { Box, Container, Stack } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export default function ContactLoading() {
  return (
    <Box paddingBlock={{ base: 10, md: 16 }}>
      <Container maxW="container.xl" paddingInline={{ base: 5, md: 8 }}>
        <Stack gap={6}>
          <SkeletonBlock height="20px" width="120px" />
          <SkeletonBlock height="44px" width="60%" />
          <SkeletonBlock height="20px" width="80%" />
          <Box
            display="grid"
            gap={6}
            gridTemplateColumns={{ base: "1fr", lg: "3fr 2fr" }}
          >
            <Stack gap={3}>
              <SkeletonBlock height="56px" />
              <SkeletonBlock height="56px" />
              <SkeletonBlock height="56px" />
              <SkeletonBlock height="160px" />
              <SkeletonBlock height="48px" width="180px" />
            </Stack>
            <Stack gap={3}>
              <SkeletonBlock height="120px" />
              <SkeletonBlock height="160px" />
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
