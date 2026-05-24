"use client";

import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface PageShellProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  children: ReactNode;
  maxW?: "container.sm" | "container.md" | "container.lg" | "container.xl" | string;
}

/**
 * Standard page wrapper: branded heading block + responsive container.
 * Use as the root element of every route page.
 */
export function PageShell({
  title,
  eyebrow,
  description,
  children,
  maxW = "container.lg",
}: PageShellProps) {
  return (
    <Box as="main" minH="calc(100dvh - 64px)" paddingBlock={{ base: "10", md: "16" }}>
      <Container maxW={maxW} paddingInline={{ base: "5", md: "8" }}>
        <Stack gap={{ base: 6, md: 8 }}>
          <Stack gap={3}>
            {eyebrow ? (
              <Text
                textTransform="uppercase"
                letterSpacing="0.2em"
                fontSize="xs"
                color="brand.fg"
                fontWeight="700"
              >
                {eyebrow}
              </Text>
            ) : null}
            <Heading
              as="h1"
              fontFamily="heading"
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.1"
              color="fg.default"
            >
              {title}
            </Heading>
            {description ? (
              <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }} maxW="60ch">
                {description}
              </Text>
            ) : null}
          </Stack>
          <Box>{children}</Box>
        </Stack>
      </Container>
    </Box>
  );
}
