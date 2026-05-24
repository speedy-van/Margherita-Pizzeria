import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { directionsContent } from "@/lib/content/directions";

export function ParkingInfo() {
  return (
    <Box as="section" paddingBlock={{ base: 6, md: 8 }}>
      <Stack gap={{ base: 5, md: 6 }}>
        <Heading as="h2" size={{ base: "lg", md: "xl" }} color="fg.default" fontFamily="heading">
          Parking
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={5}>
          {directionsContent.parking.map((tip) => (
            <Box
              key={tip.id}
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              padding={{ base: 5, md: 6 }}
            >
              <Stack gap={2}>
                <Heading as="h3" size="sm" color="fg.default">
                  {tip.title}
                </Heading>
                <Text color="fg.muted">{tip.body}</Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
