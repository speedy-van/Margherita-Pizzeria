import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import { aboutContent } from "@/lib/content/about";

export function AboutStory() {
  return (
    <Box as="section" paddingBlock={{ base: 2, md: 4 }}>
      <Stack gap={5} maxW="60ch">
        <Heading as="h2" size={{ base: "lg", md: "xl" }} color="fg.default" fontFamily="heading">
          {aboutContent.story.heading}
        </Heading>
        {aboutContent.story.paragraphs.map((p) => (
          <Text key={p.slice(0, 18)} color="fg.muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
            {p}
          </Text>
        ))}
      </Stack>
    </Box>
  );
}
