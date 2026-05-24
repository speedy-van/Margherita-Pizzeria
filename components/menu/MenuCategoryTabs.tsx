"use client";

import { Box, Button, HStack } from "@chakra-ui/react";

import type { PublicMenuCategory } from "@/lib/menu/types";

export interface MenuCategoryTabsProps {
  categories: ReadonlyArray<Pick<PublicMenuCategory, "id" | "name">>;
  selectedCategoryId: string | "all";
  onChange: (next: string | "all") => void;
}

interface TabOption {
  id: string | "all";
  label: string;
}

export function MenuCategoryTabs({
  categories,
  selectedCategoryId,
  onChange,
}: MenuCategoryTabsProps) {
  const options: TabOption[] = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <Box
      role="tablist"
      aria-label="Menu categories"
      overflowX="auto"
      paddingBlock="2"
      css={{
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: "6px" },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.15)",
          borderRadius: "3px",
        },
      }}
    >
      <HStack gap={2} minW="min-content">
        {options.map((opt) => {
          const isActive = opt.id === selectedCategoryId;
          return (
            <Button
              key={String(opt.id)}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.id)}
              size="sm"
              flexShrink={0}
              bg={isActive ? "brand.solid" : "transparent"}
              color={isActive ? "brand.contrast" : "fg.default"}
              borderWidth="1px"
              borderColor={isActive ? "brand.solid" : "border"}
              borderRadius="full"
              paddingInline="4"
              _hover={{
                bg: isActive ? "brand.emphasized" : "bg.subtle",
              }}
            >
              {opt.label}
            </Button>
          );
        })}
      </HStack>
    </Box>
  );
}
