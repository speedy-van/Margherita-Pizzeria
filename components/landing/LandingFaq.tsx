"use client";

import { Accordion, Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

import type { LandingFaqItem } from "@/lib/content/landing";

export interface LandingFaqProps {
  title?: string;
  items: LandingFaqItem[];
}

export function LandingFaq({ title = "Quick questions", items }: LandingFaqProps) {
  return (
    <Box
      as="section"
      paddingBlock={{ base: 10, md: 16 }}
      paddingInline={{ base: 5, md: 8 }}
    >
      <Container maxW="container.md">
        <Stack gap={{ base: 5, md: 7 }}>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize={{ base: "2xl", md: "4xl" }}
            color="fg.default"
          >
            {title}
          </Heading>
          <Accordion.Root
            multiple
            collapsible
            variant="enclosed"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border"
            borderRadius="xl"
            overflow="hidden"
          >
            {items.map((item) => (
              <Accordion.Item
                key={item.id}
                value={item.id}
                borderBottomWidth="1px"
                borderColor="border"
                _last={{ borderBottomWidth: 0 }}
              >
                <Accordion.ItemTrigger
                  paddingInline={{ base: 4, md: 5 }}
                  paddingBlock={4}
                  color="fg.default"
                  _hover={{ bg: "bg.muted" }}
                  textAlign="left"
                >
                  <Box flex="1" fontWeight="600">
                    {item.question}
                  </Box>
                  <Accordion.ItemIndicator color="fg.muted" />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody
                    paddingInline={{ base: 4, md: 5 }}
                    paddingBlock={4}
                  >
                    <Text color="fg.muted" lineHeight="1.7">
                      {item.answer}
                    </Text>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Stack>
      </Container>
    </Box>
  );
}
