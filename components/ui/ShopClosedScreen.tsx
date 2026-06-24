"use client";

import { Box, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import { contactDetails } from "@/lib/config/site";
import {
  computeShopStatus,
  getNextOpening,
  type ShopStatus,
} from "@/lib/utils/shop-hours";
import type { OpeningHours } from "@/types/database";

const DAY_ORDER: { key: keyof OpeningHours; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function formatHours(open: string, close: string): string {
  const closeLabel = close === "00:00" ? "midnight" : close;
  return `${open} – ${closeLabel}`;
}

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function splitDuration(ms: number): TimeParts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <Stack gap={1} align="center" minW={{ base: "60px", sm: "72px" }}>
      <Box
        bg="red.900"
        color="red.50"
        borderWidth="1px"
        borderColor="red.500"
        borderRadius="xl"
        paddingY={{ base: 2, md: 3 }}
        paddingX={{ base: 2, md: 3 }}
        width="100%"
        textAlign="center"
        fontVariantNumeric="tabular-nums"
        boxShadow="0 4px 14px rgba(192,57,43,0.35)"
      >
        <Text
          as="span"
          fontWeight="bold"
          lineHeight="1"
          fontSize={{ base: "2xl", md: "4xl" }}
        >
          {String(value).padStart(2, "0")}
        </Text>
      </Box>
      <Text
        fontSize="2xs"
        fontWeight="semibold"
        textTransform="uppercase"
        letterSpacing="widest"
        color="red.800"
      >
        {label}
      </Text>
    </Stack>
  );
}

export interface ShopClosedScreenProps {
  openingHours: OpeningHours;
  initialShopStatus: ShopStatus;
}

/**
 * Full-page "we're closed" notice. Self-recomputes every 30 s so the screen
 * disappears at opening time without a reload.
 */
export function ShopClosedScreen({
  openingHours,
  initialShopStatus,
}: ShopClosedScreenProps) {
  const [status, setStatus] = useState<ShopStatus>(initialShopStatus);
  // Drives the live countdown; `null` until the client mounts to avoid an
  // SSR/client hydration mismatch (server has no notion of the live clock).
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setStatus(computeShopStatus(now, openingHours));
      const nextOpen = getNextOpening(now, openingHours);
      setRemainingMs(nextOpen ? nextOpen.getTime() - now.getTime() : null);
    };
    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [openingHours]);

  useEffect(() => {
    if (status.isOpen) window.location.reload();
  }, [status.isOpen]);

  if (status.isOpen) {
    return null;
  }

  const todayKey = DAY_ORDER[(new Date().getDay() + 6) % 7]?.key;
  const time =
    remainingMs !== null && remainingMs > 0 ? splitDuration(remainingMs) : null;

  return (
    <Stack gap={6} align="stretch">
      <Box
        borderWidth="2px"
        borderColor="red.500"
        bg="red.50"
        color="red.900"
        borderRadius="2xl"
        padding={{ base: 6, md: 8 }}
        textAlign="center"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="widest"
          mb={2}
        >
          Online ordering paused
        </Text>
        <Heading as="h2" size={{ base: "xl", md: "2xl" }} mb={3}>
          Sorry, we&rsquo;re closed right now
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} mb={1}>
          {status.opensAt && status.opensDayLabel
            ? `We reopen for online orders ${status.opensDayLabel} at ${status.opensAt}.`
            : "Please check back during our opening hours."}
        </Text>

        {time ? (
          <Box mt={5} mb={4}>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="widest"
              color="red.800"
              mb={3}
            >
              Reopening in
            </Text>
            <HStack
              gap={{ base: 2, md: 3 }}
              justify="center"
              align="flex-start"
            >
              {time.days > 0 ? (
                <CountdownUnit value={time.days} label="Days" />
              ) : null}
              <CountdownUnit value={time.hours} label="Hours" />
              <CountdownUnit value={time.minutes} label="Min" />
              <CountdownUnit value={time.seconds} label="Sec" />
            </HStack>
          </Box>
        ) : null}

        <Text fontSize="sm" color="red.800">
          You can&rsquo;t place an order until we reopen — but we&rsquo;ll be
          ready as soon as the kitchen&rsquo;s back on.
        </Text>
      </Box>

      <Box
        borderWidth="1px"
        borderColor="border"
        bg="bg.default"
        borderRadius="2xl"
        padding={{ base: 5, md: 6 }}
      >
        <Heading as="h3" size="md" mb={4}>
          Opening hours
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={{ base: 2, sm: 3 }}>
          {DAY_ORDER.map(({ key, label }) => {
            const entry = openingHours[key];
            const isToday = key === todayKey;
            return (
              <HStack
                key={key}
                justify="space-between"
                gap={4}
                paddingY={2}
                paddingX={3}
                borderRadius="md"
                bg={isToday ? "brand.subtle" : undefined}
                borderWidth={isToday ? "1px" : "0"}
                borderColor="brand.muted"
              >
                <Text fontWeight={isToday ? "bold" : "medium"}>
                  {label}
                  {isToday ? " (today)" : ""}
                </Text>
                <Text fontWeight={isToday ? "bold" : "normal"}>
                  {entry.closed
                    ? "Closed"
                    : formatHours(entry.open, entry.close)}
                </Text>
              </HStack>
            );
          })}
        </SimpleGrid>
      </Box>

      <HStack gap={3} flexWrap="wrap" justify="center">
        <Box asChild>
          <NextLink
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              borderRadius: "9999px",
              borderWidth: "1px",
              borderStyle: "solid",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to home
          </NextLink>
        </Box>
        <Box asChild>
          <a
            href={`tel:${contactDetails.primaryPhoneTel}`}
            style={{
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              borderRadius: "9999px",
              borderWidth: "1px",
              borderStyle: "solid",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Call us: {contactDetails.primaryPhone}
          </a>
        </Box>
      </HStack>
    </Stack>
  );
}
