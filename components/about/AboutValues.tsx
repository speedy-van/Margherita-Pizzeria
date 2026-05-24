import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { aboutContent } from "@/lib/content/about";

export function AboutValues() {
  return (
    <Box as="section" paddingBlock={{ base: 6, md: 10 }}>
      <Stack gap={{ base: 6, md: 8 }}>
        <Heading as="h2" size={{ base: "lg", md: "xl" }} color="fg.default" fontFamily="heading">
          What we care about.
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={5}>
          {aboutContent.values.map((value) => (
            <Box
              key={value.id}
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              padding={{ base: 5, md: 6 }}
            >
              <Stack gap={2}>
                <Heading as="h3" size="sm" color="fg.default" fontFamily="heading">
                  {value.title}
                </Heading>
                <Text color="fg.muted">{value.body}</Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
