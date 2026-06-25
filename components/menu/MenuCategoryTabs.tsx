"use client";

import {
  Box,
  Button,
  CloseButton,
  Drawer,
  HStack,
  Portal,
  Stack,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

import type { PublicMenuCategory } from "@/lib/menu/types";

export interface MenuCategoryTabsProps {
  categories: ReadonlyArray<
    Pick<PublicMenuCategory, "id" | "name"> & { itemCount?: number }
  >;
  selectedCategoryId: string | "all";
  onChange: (next: string | "all") => void;
}

interface TabOption {
  id: string | "all";
  label: string;
  itemCount?: number;
}

interface PriorityMatcher {
  key: string;
  pattern: RegExp;
}

const MOBILE_INLINE_LIMIT = 7;

const MOBILE_PRIORITY_MATCHERS: PriorityMatcher[] = [
  { key: "deals", pattern: /deal/i },
  { key: "pizza", pattern: /pizza/i },
  { key: "burgers", pattern: /burger/i },
  { key: "wraps", pattern: /wrap/i },
  { key: "sides", pattern: /side/i },
  { key: "drinks", pattern: /drink/i },
];

function buildMobileInlineOptions(
  options: TabOption[],
  selectedCategoryId: string | "all",
): TabOption[] {
  if (options.length <= MOBILE_INLINE_LIMIT) {
    return options;
  }

  const allOption = options.find((option) => option.id === "all");
  const remaining = options.filter((option) => option.id !== "all");
  const inline: TabOption[] = allOption ? [allOption] : [];
  const seen = new Set(inline.map((option) => option.id));

  for (const matcher of MOBILE_PRIORITY_MATCHERS) {
    const match = remaining.find(
      (option) => !seen.has(option.id) && matcher.pattern.test(option.label),
    );

    if (match) {
      inline.push(match);
      seen.add(match.id);
    }
  }

  for (const option of remaining) {
    if (inline.length >= MOBILE_INLINE_LIMIT) {
      break;
    }

    if (!seen.has(option.id)) {
      inline.push(option);
      seen.add(option.id);
    }
  }

  const selectedOption = options.find((option) => option.id === selectedCategoryId);

  if (selectedOption && !seen.has(selectedOption.id)) {
    const replaceIndex = inline.findLastIndex((option) => option.id !== "all");

    if (replaceIndex >= 0) {
      inline[replaceIndex] = selectedOption;
    } else {
      inline.push(selectedOption);
    }
  }

  return inline;
}

function CategoryChip({
  option,
  isActive,
  onSelect,
  fullWidth = false,
}: {
  option: TabOption;
  isActive: boolean;
  onSelect: (id: string | "all") => void;
  fullWidth?: boolean;
}) {
  return (
    <Button
      type="button"
      onClick={() => onSelect(option.id)}
      aria-pressed={isActive}
      minH="11"
      width={fullWidth ? "100%" : "auto"}
      justifyContent="flex-start"
      flexShrink={0}
      borderRadius="full"
      borderWidth="1px"
      borderColor={isActive ? "brand.solid" : "border"}
      bg={isActive ? "brand.solid" : "bg.subtle"}
      color={isActive ? "brand.contrast" : "fg.default"}
      paddingInline={4}
      fontSize={{ base: "sm", md: "md" }}
      fontWeight="600"
      whiteSpace="nowrap"
      _hover={{
        bg: isActive ? "brand.emphasized" : "bg.muted",
      }}
      _active={{
        bg: isActive ? "brand.emphasized" : "bg",
      }}
    >
      <HStack gap={2} width={fullWidth ? "100%" : "auto"}>
        <Text as="span" overflow="hidden" textOverflow="ellipsis">
          {option.label}
        </Text>
        {typeof option.itemCount === "number" ? (
          <Box
            as="span"
            minW="7"
            height="7"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            paddingInline="2"
            borderRadius="full"
            fontSize="xs"
            lineHeight="1"
            bg={isActive ? "rgba(0, 0, 0, 0.18)" : "rgba(255, 255, 255, 0.08)"}
            color="inherit"
          >
            {option.itemCount}
          </Box>
        ) : null}
      </HStack>
    </Button>
  );
}

export function MenuCategoryTabs({
  categories,
  selectedCategoryId,
  onChange,
}: MenuCategoryTabsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const options = useMemo<TabOption[]>(
    () => [
      {
        id: "all",
        label: "All",
        itemCount: categories.reduce((sum, c) => sum + (c.itemCount ?? 0), 0),
      },
      ...categories.map((c) => ({
        id: c.id,
        label: c.name,
        itemCount: c.itemCount,
      })),
    ],
    [categories],
  );

  const mobileInlineOptions = useMemo(
    () => buildMobileInlineOptions(options, selectedCategoryId),
    [options, selectedCategoryId],
  );

  const mobileOverflowOptions = useMemo(
    () =>
      options.filter(
        (option) =>
          !mobileInlineOptions.some((inlineOption) => inlineOption.id === option.id),
      ),
    [mobileInlineOptions, options],
  );

  const handleSelect = (next: string | "all") => {
    onChange(next);
    setDrawerOpen(false);
  };

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text fontSize={{ base: "md", md: "sm" }} fontWeight="700" color="fg.default">
          Browse menu
        </Text>
        <Text fontSize={{ base: "sm", md: "xs" }} color="fg.muted">
          Choose a category or scroll the menu.
        </Text>
      </Stack>

      <Box display={{ base: "block", md: "none" }}>
        <HStack
          as="nav"
          aria-label="Menu categories"
          gap={2}
          overflowX="auto"
          overflowY="hidden"
          paddingBottom={1}
          align="stretch"
          css={{
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {mobileInlineOptions.map((option) => (
            <CategoryChip
              key={String(option.id)}
              option={option}
              isActive={option.id === selectedCategoryId}
              onSelect={handleSelect}
            />
          ))}

          {mobileOverflowOptions.length > 0 ? (
            <Button
              type="button"
              onClick={() => setDrawerOpen(true)}
              minH="11"
              flexShrink={0}
              borderRadius="full"
              borderWidth="1px"
              borderColor="border"
              bg="bg.subtle"
              color="fg.default"
              paddingInline={4}
              fontSize="sm"
              fontWeight="600"
              whiteSpace="nowrap"
              _hover={{ bg: "bg.muted" }}
            >
              <HStack gap={2}>
                <Text as="span">More categories</Text>
                <Box
                  as="span"
                  minW="7"
                  height="7"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  paddingInline="2"
                  borderRadius="full"
                  fontSize="xs"
                  lineHeight="1"
                  bg="rgba(255, 255, 255, 0.08)"
                >
                  {mobileOverflowOptions.length}
                </Box>
              </HStack>
            </Button>
          ) : null}
        </HStack>

        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(details) => setDrawerOpen(details.open)}
          placement="bottom"
          size="xs"
        >
          <Portal>
            <Drawer.Backdrop bg="rgba(0,0,0,0.6)" />
            <Drawer.Positioner>
              <Drawer.Content
                bg="bg"
                color="fg.default"
                borderTopWidth="1px"
                borderColor="border"
                borderTopRadius="2xl"
              >
                <Drawer.Header
                  borderBottomWidth="1px"
                  borderColor="border"
                  paddingInline={4}
                  paddingBlock={4}
                >
                  <HStack justify="space-between" align="center" gap={3}>
                    <Stack gap={0.5}>
                      <Drawer.Title fontFamily="heading" fontSize="xl" color="fg.default">
                        More categories
                      </Drawer.Title>
                      <Text fontSize="sm" color="fg.muted">
                        Choose a category to filter the menu.
                      </Text>
                    </Stack>
                    <Drawer.CloseTrigger asChild>
                      <CloseButton size="sm" aria-label="Close more categories" />
                    </Drawer.CloseTrigger>
                  </HStack>
                </Drawer.Header>

                <Drawer.Body paddingInline={4} paddingBlock={4}>
                  <Stack gap={2}>
                    {mobileOverflowOptions.map((option) => (
                      <CategoryChip
                        key={String(option.id)}
                        option={option}
                        isActive={option.id === selectedCategoryId}
                        onSelect={handleSelect}
                        fullWidth
                      />
                    ))}
                  </Stack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </Box>

      <Wrap as="nav" aria-label="Menu categories" gap={2} display={{ base: "none", md: "flex" }}>
        {options.map((option) => (
          <WrapItem key={String(option.id)}>
            <CategoryChip
              option={option}
              isActive={option.id === selectedCategoryId}
              onSelect={handleSelect}
            />
          </WrapItem>
        ))}
      </Wrap>
    </Stack>
  );
}
