import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { directionsContent } from "@/lib/content/directions";

export function DirectionsRouteCards() {
  return (
    <Box as="section" paddingBlock={{ base: 6, md: 8 }}>
      <Stack gap={{ base: 6, md: 8 }}>
        <Heading as="h2" size={{ base: "lg", md: "xl" }} color="fg.default" fontFamily="heading">
          Getting here
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
          {directionsContent.routes.map((route) => (
            <Box
              key={route.id}
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              padding={{ base: 5, md: 6 }}
            >
              <Stack gap={3}>
                <Stack gap={1}>
                  <Heading as="h3" size="sm" color="fg.default" fontFamily="heading">
                    {route.origin}
                  </Heading>
                  <Text fontSize="xs" color="brand.fg" letterSpacing="0.12em" textTransform="uppercase">
                    {route.approxMinutes}
                  </Text>
                </Stack>
                <Stack gap={1}>
                  <Text fontSize="sm" color="fg.default" fontWeight="600">
                    Driving
                  </Text>
                  <Text color="fg.muted">{route.driving}</Text>
                </Stack>
                <Stack gap={1}>
                  <Text fontSize="sm" color="fg.default" fontWeight="600">
                    On foot or public transport
                  </Text>
                  <Text color="fg.muted">{route.walkingOrTransit}</Text>
                </Stack>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
