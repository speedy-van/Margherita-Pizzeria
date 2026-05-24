"use client";

import { Button, HStack } from "@chakra-ui/react";

import type { FaqCategory, FaqCategoryId } from "@/lib/content/faq";

export interface FaqCategoryNavProps {
  categories: FaqCategory[];
  active: FaqCategoryId | "all";
  onChange: (id: FaqCategoryId | "all") => void;
}

export function FaqCategoryNav({ categories, active, onChange }: FaqCategoryNavProps) {
  return (
    <HStack
      as="nav"
      aria-label="FAQ categories"
      gap={2}
      flexWrap="wrap"
      role="tablist"
    >
      <Button
        size="sm"
        role="tab"
        aria-selected={active === "all"}
        onClick={() => onChange("all")}
        bg={active === "all" ? "brand.solid" : "bg.subtle"}
        color={active === "all" ? "brand.contrast" : "fg.default"}
        borderWidth="1px"
        borderColor={active === "all" ? "brand.solid" : "border"}
        _hover={{ bg: active === "all" ? "brand.emphasized" : "bg" }}
      >
        All
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          size="sm"
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => onChange(cat.id)}
          bg={active === cat.id ? "brand.solid" : "bg.subtle"}
          color={active === cat.id ? "brand.contrast" : "fg.default"}
          borderWidth="1px"
          borderColor={active === cat.id ? "brand.solid" : "border"}
          _hover={{ bg: active === cat.id ? "brand.emphasized" : "bg" }}
        >
          {cat.title}
        </Button>
      ))}
    </HStack>
  );
}
