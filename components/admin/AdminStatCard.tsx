"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface AdminStatCardProps {
  label: string;
  value: ReactNode;
  helper?: string;
}

export function AdminStatCard({ label, value, helper }: AdminStatCardProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.subtle"
      padding={5}
      minH="100%"
    >
      <Stack gap={1.5}>
        <Text
          fontSize="xs"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="0.08em"
          color="fg.muted"
        >
          {label}
        </Text>
        <Heading as="div" size="xl" color="fg.default" lineHeight="1">
          {value}
        </Heading>
        {helper ? (
          <Text fontSize="xs" color="fg.muted">
            {helper}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
