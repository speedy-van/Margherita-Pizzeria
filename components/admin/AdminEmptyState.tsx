"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface AdminEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AdminEmptyState({
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.subtle"
      padding={8}
      textAlign="center"
    >
      <Stack gap={3} align="center">
        <Heading as="h3" size="sm" color="fg.default">
          {title}
        </Heading>
        {description ? (
          <Text color="fg.muted" fontSize="sm" maxW="48ch">
            {description}
          </Text>
        ) : null}
        {action ? <Box paddingTop={2}>{action}</Box> : null}
      </Stack>
    </Box>
  );
}
