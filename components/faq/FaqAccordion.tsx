"use client";

import {
  Accordion,
  Box,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { FaqCategoryNav } from "@/components/faq/FaqCategoryNav";
import {
  faqCategories,
  type FaqCategoryId,
  type FaqItem,
} from "@/lib/content/faq";

export interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [activeCategory, setActiveCategory] = useState<FaqCategoryId | "all">("all");
  const [query, setQuery] = useState<string>("");

  const filtered = useMemo<FaqItem[]>(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
  }, [items, activeCategory, query]);

  return (
    <Stack gap={6}>
      <Stack gap={3}>
        <label
          htmlFor="faq-search"
          style={{
            fontSize: "0.875rem",
            color: "var(--margherita-colors-fg-default)",
          }}
        >
          Search the FAQs
        </label>
        <Input
          id="faq-search"
          placeholder="e.g. delivery, allergens, booking"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          bg="bg"
          borderColor="border"
          color="fg.default"
          _placeholder={{ color: "fg.muted" }}
          autoComplete="off"
          maxLength={120}
        />
      </Stack>

      <FaqCategoryNav
        categories={faqCategories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching questions"
          description="Try clearing the search or picking a different category."
        />
      ) : (
        <Accordion.Root
          multiple
          collapsible
          variant="enclosed"
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          overflow="hidden"
        >
          {filtered.map((item) => (
            <Accordion.Item
              key={item.id}
              value={item.id}
              borderBottomWidth="1px"
              borderColor="border"
              _last={{ borderBottomWidth: 0 }}
            >
              <Accordion.ItemTrigger
                paddingInline={{ base: 4, md: 6 }}
                paddingBlock={4}
                color="fg.default"
                _hover={{ bg: "bg.muted" }}
                textAlign="left"
              >
                <Box flex="1" fontWeight="600">
                  {item.question}
                </Box>
                <Accordion.ItemIndicator color="fg.muted" />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody
                  paddingInline={{ base: 4, md: 6 }}
                  paddingBlock={4}
                >
                  <Text color="fg.muted" lineHeight="1.7">
                    {item.answer}
                  </Text>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}
    </Stack>
  );
}
