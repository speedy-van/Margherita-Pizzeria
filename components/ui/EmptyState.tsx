"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Box
      role="status"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.subtle"
      paddingBlock={{ base: 10, md: 14 }}
      paddingInline={{ base: 5, md: 8 }}
      textAlign="center"
    >
      <Stack gap={4} align="center">
        {icon ? <Box aria-hidden>{icon}</Box> : null}
        <Heading as="h2" size="md" color="fg.default">
          {title}
        </Heading>
        {description ? (
          <Text color="fg.muted" maxW="48ch">
            {description}
          </Text>
        ) : null}
        {action ? <Box>{action}</Box> : null}
      </Stack>
    </Box>
  );
}
