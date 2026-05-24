import { Box, Container, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { homeContent } from "@/lib/content/home";

// Lightweight inline SVG icons (no extra dep) — sized to current text color.
function Icon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "dough":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="9" cy="10.5" r="0.7" fill="currentColor" />
          <circle cx="14" cy="13" r="0.7" fill="currentColor" />
          <circle cx="11" cy="15" r="0.7" fill="currentColor" />
        </svg>
      );
    case "italy":
      return (
        <svg {...common}>
          <path d="M12 3v18M5 12h14" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "halal":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h10M4 18h16" />
          <path d="M17 9l2.5 3-2.5 3" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 3l2.6 5.7 6.2.7-4.7 4.3 1.3 6.1L12 17l-5.4 2.8 1.3-6.1L3.2 9.4l6.2-.7L12 3z" />
        </svg>
      );
    case "bike":
      return (
        <svg {...common}>
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17l4-7h5l3 7M10 10l-2-4h2" />
        </svg>
      );
    default:
      return null;
  }
}

const ICON_FOR_INDEX = ["dough", "italy", "halal", "clock", "star", "bike"] as const;

export function TrustStrip() {
  return (
    <Box
      as="section"
      bg="bg.subtle"
      borderTopWidth="1px"
      borderBottomWidth="1px"
      borderColor="border"
      paddingBlock={{ base: 8, md: 10 }}
      paddingInline={{ base: 5, md: 8 }}
      position="relative"
      overflow="hidden"
    >
      {/* subtle brand wash */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        opacity={0.4}
        backgroundImage="radial-gradient(ellipse at 0% 50%, rgba(230,126,34,0.06), transparent 45%), radial-gradient(ellipse at 100% 50%, rgba(192,57,43,0.06), transparent 45%)"
      />
      <Container maxW="container.xl" position="relative">
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={{ base: 5, md: 6 }}>
          {homeContent.trustItems.map((item, i) => (
            <HStack key={item.label} gap={3} align="start">
              <Box
                flexShrink={0}
                width="40px"
                height="40px"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="linear-gradient(135deg, rgba(230,126,34,0.16), rgba(192,57,43,0.16))"
                color="brand.fg"
                borderWidth="1px"
                borderColor="rgba(230,126,34,0.25)"
              >
                <Icon name={ICON_FOR_INDEX[i % ICON_FOR_INDEX.length] ?? "star"} />
              </Box>
              <Stack gap={0.5} flex={1} minW={0}>
                <Text
                  fontWeight="700"
                  color="fg.default"
                  fontSize={{ base: "sm", md: "md" }}
                  lineHeight="1.25"
                >
                  {item.label}
                </Text>
                <Text color="fg.muted" fontSize={{ base: "xs", md: "sm" }} lineHeight="1.35">
                  {item.detail}
                </Text>
              </Stack>
            </HStack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
