import { Box, Container, SimpleGrid, Stack } from "@chakra-ui/react";

import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

export default function MenuLoading() {
  return (
    <Box paddingBlock={{ base: 10, md: 16 }}>
      <Container maxW="container.xl" paddingInline={{ base: 5, md: 8 }}>
        <Stack gap={{ base: 6, md: 8 }}>
          <Stack gap={3}>
            <SkeletonBlock height="14px" width="80px" />
            <SkeletonBlock height="44px" width="70%" />
            <SkeletonBlock height="20px" width="90%" />
          </Stack>
          <Stack direction="row" gap={2}>
            <SkeletonBlock height="32px" width="64px" radius="full" />
            <SkeletonBlock height="32px" width="80px" radius="full" />
            <SkeletonBlock height="32px" width="72px" radius="full" />
            <SkeletonBlock height="32px" width="80px" radius="full" />
          </Stack>
          <SkeletonBlock height="100px" />
          <Stack gap={5}>
            <SkeletonBlock height="28px" width="160px" />
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Stack
                  key={i}
                  gap={3}
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="xl"
                  padding={0}
                  overflow="hidden"
                >
                  <SkeletonBlock height="160px" radius="none" />
                  <Stack gap={2} padding={4}>
                    <SkeletonBlock height="20px" width="60%" />
                    <SkeletonBlock height="14px" />
                    <SkeletonBlock height="14px" width="80%" />
                    <SkeletonBlock height="32px" width="100px" radius="md" />
                  </Stack>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
