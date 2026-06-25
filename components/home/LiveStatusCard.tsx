"use client";

import { Box, HStack, IconButton, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";

import { deliveryRules } from "@/lib/config/site";
import { formatGBPFromPence } from "@/lib/utils/currency";
import {
  computeShopStatus,
  type ShopStatus,
} from "@/lib/utils/shop-hours";
import type { OpeningHours } from "@/types/database";

const STORAGE_KEY = "mp_live_status_dismissed_v1";
const SHOW_DELAY_MS = 4000;

export interface LiveStatusCardProps {
  openingHours: OpeningHours;
}

export function LiveStatusCard({ openingHours }: LiveStatusCardProps) {
  const [visible, setVisible] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // ignore storage errors
    }
    const t = window.setTimeout(() => {
      setNow(new Date());
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const status = useMemo<ShopStatus | null>(
    () => (now ? computeShopStatus(now, openingHours) : null),
    [now, openingHours],
  );

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!visible || !status) return null;

  const headline = status.isOpen
    ? `Open now · closes ${status.closesAt}`
    : status.opensAt
      ? `Opens ${status.opensDayLabel} at ${status.opensAt} · order ahead`
      : "Order online — we'll prep it next service";

  const ctaHref = "/menu";
  const ctaLabel = status.isOpen ? "Order now" : "See the menu";

  const dotColor = status.isOpen ? "#27AE60" : "#A0998C";

  return (
    <Box
      role="status"
      aria-live="polite"
      position="fixed"
      bottom={{ base: 4, md: 6 }}
      right={{ base: 4, md: 6 }}
      zIndex={1200}
      maxW={{ base: "calc(100vw - 2rem)", sm: "20rem" }}
      bg="bg.panel"
      color="fg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      boxShadow="0 18px 40px rgba(10,8,6,0.28)"
      padding={4}
      css={{
        "@media print": { display: "none" },
        "@keyframes mpPulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(39,174,96,0.55)" },
          "70%": { boxShadow: "0 0 0 10px rgba(39,174,96,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(39,174,96,0)" },
        },
        "@keyframes mpSlideIn": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        animation: "mpSlideIn 280ms ease-out",
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    >
      <HStack align="flex-start" justify="space-between" gap={3}>
        <Stack gap={2} flex={1}>
          <HStack gap={2}>
            <Box
              aria-hidden
              width="10px"
              height="10px"
              borderRadius="full"
              bg={dotColor}
              css={
                status.isOpen
                  ? {
                      animation: "mpPulse 1.8s ease-out infinite",
                      "@media (prefers-reduced-motion: reduce)": {
                        animation: "none",
                      },
                    }
                  : undefined
              }
            />
            <Text fontWeight="700" fontSize="sm">
              {headline}
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
            Typical prep 18–22 min · 🛵 {formatGBPFromPence(deliveryRules.outsideFeePence)} flat
            delivery across Glasgow East End
          </Text>
          <NextLink
            href={ctaHref}
            onClick={dismiss}
            style={{
              display: "inline-block",
              marginTop: 2,
              background: "#C0392B",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              padding: "8px 14px",
              borderRadius: 8,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            {ctaLabel}
          </NextLink>
        </Stack>
        <IconButton
          aria-label="Dismiss"
          size="xs"
          variant="ghost"
          onClick={dismiss}
        >
          <Box as="span" aria-hidden fontSize="md" lineHeight="1">
            ×
          </Box>
        </IconButton>
      </HStack>
    </Box>
  );
}
