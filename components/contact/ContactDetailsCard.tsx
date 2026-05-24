import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { restaurantLocation, siteConfig } from "@/lib/config/site";

interface LinkRowProps {
  href: string;
  label: string;
  hint: string;
}

function LinkRow({ href, label, hint }: LinkRowProps) {
  return (
    <Box as="li" listStyleType="none">
      <NextLink href={href} style={{ textDecoration: "none" }}>
        <Stack gap={0}>
          <Text color="fg.default" fontWeight="600" _hover={{ color: "brand.fg" }}>
            {label} →
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {hint}
          </Text>
        </Stack>
      </NextLink>
    </Box>
  );
}

export function ContactDetailsCard() {
  return (
    <Stack gap={5}>
      <Box
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        padding={{ base: 5, md: 6 }}
      >
        <Stack gap={3}>
          <Heading as="h2" size="sm" color="fg.default" fontFamily="heading">
            Visit
          </Heading>
          <Text color="fg.muted">
            {restaurantLocation.addressLine}
            <br />
            {restaurantLocation.city}, {restaurantLocation.postcode}
            <br />
            United Kingdom
          </Text>
          <Text color="fg.muted" fontSize="sm">
            Delivery within {siteConfig.deliveryRadiusMiles} miles of {siteConfig.postcode}.
          </Text>
        </Stack>
      </Box>

      <Box
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        padding={{ base: 5, md: 6 }}
      >
        <Stack gap={4}>
          <Heading as="h2" size="sm" color="fg.default" fontFamily="heading">
            Quick links
          </Heading>
          <Stack as="ul" gap={3}>
            <LinkRow href="/menu" label="View the menu" hint="Pizzas, sides and drinks." />
            <LinkRow href="/menu" label="Order delivery or collection" hint="Pick pizzas, then check out." />
            <LinkRow href="/book" label="Book a table" hint={`Our ${siteConfig.tablesCount}-table dining room.`} />
            <LinkRow href="/directions" label="Directions" hint="How to get to the restaurant." />
            <LinkRow href="/faq" label="FAQ" hint="Common questions, answered." />
          </Stack>
        </Stack>
      </Box>

      <Box
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        padding={{ base: 5, md: 6 }}
      >
        <Stack gap={2}>
          <Heading as="h2" size="sm" color="fg.default" fontFamily="heading">
            Press &amp; partnerships
          </Heading>
          <Text color="fg.muted">
            For press, supplier or partnership enquiries, please use the form
            and mark the subject clearly — we&apos;ll route it to the right person.
          </Text>
        </Stack>
      </Box>
    </Stack>
  );
}
