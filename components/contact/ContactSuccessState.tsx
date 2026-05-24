"use client";

import { Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export interface ContactSuccessStateProps {
  onReset: () => void;
  message: string;
}

export function ContactSuccessState({ onReset, message }: ContactSuccessStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      bg="brand.subtle"
      borderWidth="1px"
      borderColor="brand.muted"
      borderRadius="xl"
      padding={{ base: 6, md: 8 }}
    >
      <Stack gap={4}>
        <Heading as="h2" size="md" color="fg.default" fontFamily="heading">
          Message sent.
        </Heading>
        <Text color="fg.muted">{message}</Text>
        <Text color="fg.muted" fontSize="sm">
          We&apos;ll come back to you as soon as we can.
        </Text>
        <HStack gap={3} flexWrap="wrap" paddingTop={2}>
          <Button
            onClick={onReset}
            variant="outline"
            borderColor="border"
            color="fg.default"
            _hover={{ bg: "bg.subtle" }}
          >
            Send another message
          </Button>
          <NextLink href="/menu" style={{ textDecoration: "none" }}>
            <Button bg="brand.solid" color="brand.contrast" _hover={{ bg: "brand.emphasized" }}>
              View the menu
            </Button>
          </NextLink>
        </HStack>
      </Stack>
    </Box>
  );
}
