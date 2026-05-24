"use client";

import { Box, type BoxProps } from "@chakra-ui/react";

export interface SkeletonBlockProps extends Omit<BoxProps, "as"> {
  height?: BoxProps["height"];
  width?: BoxProps["width"];
  radius?: BoxProps["borderRadius"];
}

export function SkeletonBlock({
  height = "1.25rem",
  width = "100%",
  radius = "md",
  ...rest
}: SkeletonBlockProps) {
  return (
    <Box
      aria-hidden
      height={height}
      width={width}
      borderRadius={radius}
      bg="bg.muted"
      position="relative"
      overflow="hidden"
      css={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
        backgroundSize: "200% 100%",
        animation: "margherita-skeleton 1.4s ease-in-out infinite",
        "@keyframes margherita-skeleton": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      }}
      {...rest}
    />
  );
}
