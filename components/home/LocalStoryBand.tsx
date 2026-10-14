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
      {/* Light overlay for the required black text. */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="linear-gradient(105deg, rgba(252,251,247,0.94) 0%, rgba(252,251,247,0.84) 45%, rgba(252,251,247,0.62) 100%)"
      />
      {/* Brand color wash on top */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        backgroundImage="radial-gradient(ellipse at 100% 0%, rgba(164,189,167,0.18), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(164,189,167,0.18), transparent 55%)"
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
            color="fg.default"
            fontFamily="heading"
          >
            {story.heading}
          </Heading>
          {story.paragraphs.map((p) => (
            <Text
              key={p.slice(0, 18)}
              color="fg.muted"
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
