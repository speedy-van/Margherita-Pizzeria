"use client";

import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";

export interface AdminErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function AdminErrorState({
  title = "Something went wrong",
  description = "Try again. If the problem keeps happening, check the server logs.",
  onRetry,
}: AdminErrorStateProps) {
  return (
    <Box
      role="alert"
      borderWidth="1px"
      borderColor="red.300"
      borderRadius="lg"
      bg="red.50"
      padding={6}
    >
      <Stack gap={3}>
        <Heading as="h3" size="sm" color="red.900">
          {title}
        </Heading>
        <Text color="red.900" fontSize="sm">
          {description}
        </Text>
        {onRetry ? (
          <Box>
            <Button
              size="sm"
              onClick={onRetry}
              bg="red.600"
              color="white"
              _hover={{ bg: "red.700" }}
            >
              Try again
            </Button>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
