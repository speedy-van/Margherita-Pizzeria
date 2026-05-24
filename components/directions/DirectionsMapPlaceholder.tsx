import { Box, Heading, Stack, Text } from "@chakra-ui/react";

import { directionsContent } from "@/lib/content/directions";

export function DirectionsMapPlaceholder() {
  const addr = directionsContent.address;
  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      bg="bg.subtle"
      minH={{ base: "220px", md: "300px" }}
      paddingBlock={{ base: 8, md: 12 }}
      paddingInline={{ base: 6, md: 10 }}
    >
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        opacity={0.5}
        backgroundImage="radial-gradient(circle at 30% 30%, rgba(192,57,43,0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(230,126,34,0.18), transparent 60%), linear-gradient(135deg, #161210 0%, #1A1A1A 100%)"
      />
      <Stack
        position="relative"
        gap={2}
        align="flex-start"
        justify="center"
        height="100%"
      >
        <Text
          textTransform="uppercase"
          letterSpacing="0.2em"
          fontSize="xs"
          color="brand.fg"
          fontWeight="700"
        >
          You&apos;ll find us at
        </Text>
        <Heading as="h2" size={{ base: "md", md: "lg" }} color="fg.default" fontFamily="heading">
          {addr.line}
        </Heading>
        <Text color="fg.muted">
          {addr.city}, {addr.postcode}
          <br />
          {addr.country}
        </Text>
      </Stack>
    </Box>
  );
}
