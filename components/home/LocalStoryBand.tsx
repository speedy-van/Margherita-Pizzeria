import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

import { homeContent } from "@/lib/content/home";

export function LocalStoryBand() {
  const story = homeContent.story;
  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      paddingBlock={{ base: 14, md: 20 }}
      paddingInline={{ base: 5, md: 8 }}
      bg="surface.base"
    >
      {/* Background photo */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="url('/legacy/pizza-making-poster.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
      />
      {/* Dark overlay for legibility */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="linear-gradient(105deg, rgba(10,8,6,0.86) 0%, rgba(10,8,6,0.72) 45%, rgba(10,8,6,0.3) 100%)"
      />
      {/* Brand color wash on top */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="radial-gradient(ellipse at 100% 0%, rgba(230,126,34,0.18), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(192,57,43,0.18), transparent 55%)"
      />
      <Container maxW="container.xl" position="relative">
        <Stack gap={5} maxW="48rem">
          <Text
            textTransform="uppercase"
            letterSpacing="0.2em"
            fontSize="xs"
            color="brand.fg"
            fontWeight="700"
          >
            {story.eyebrow}
          </Text>
          <Heading
            as="h2"
            size={{ base: "xl", md: "2xl" }}
            color="white"
            fontFamily="heading"
          >
            {story.heading}
          </Heading>
          {story.paragraphs.map((p) => (
            <Text
              key={p.slice(0, 18)}
              color="whiteAlpha.900"
              fontSize={{ base: "md", md: "lg" }}
            >
              {p}
            </Text>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
