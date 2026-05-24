"use client";

import { Box, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface SectionProps extends Omit<BoxProps, "as"> {
  children: ReactNode;
  variant?: "default" | "muted" | "brand";
}

/**
 * Vertical-rhythm section with mobile-first padding.
 * Uses Chakra v3 tokens; renders as <section>.
 */
export function Section({
  children,
  variant = "default",
  ...rest
}: SectionProps) {
  const bg =
    variant === "muted"
      ? "bg.subtle"
      : variant === "brand"
        ? "brand.subtle"
        : "transparent";

  return (
    <Box
      as="section"
      bg={bg}
      paddingBlock={{ base: "10", md: "16", lg: "20" }}
      paddingInline={{ base: "5", md: "8" }}
      {...rest}
    >
      {children}
    </Box>
  );
}
