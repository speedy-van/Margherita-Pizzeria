"use client";

import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We hit an unexpected problem. Please try again — if it keeps happening, get in touch.",
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <Box
      role="alert"
      borderWidth="1px"
      borderColor="brand.muted"
      borderRadius="xl"
      bg="brand.subtle"
      paddingBlock={{ base: 8, md: 10 }}
      paddingInline={{ base: 5, md: 8 }}
    >
      <Stack gap={4}>
        <Heading as="h2" size="md" color="fg.default">
          {title}
        </Heading>
        <Text color="fg.muted">{description}</Text>
        {onRetry ? (
          <Box>
            <Button
              onClick={onRetry}
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
            >
              {retryLabel}
            </Button>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
