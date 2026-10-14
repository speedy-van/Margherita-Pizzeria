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
      bottom={{ base: 4, md: 7 }}
      right={{ base: 4, md: 7 }}
      zIndex={1200}
      width={{ base: "calc(100vw - 2rem)", sm: "23rem" }}
      maxW="23rem"
      bg="#FFFDF8"
      color="#211B16"
      borderWidth="1px"
      borderColor="rgba(164,189,167,0.9)"
      borderRadius="lg"
      boxShadow="0 0 0 1px rgba(164,189,167,0.34), 0 0 30px rgba(164,189,167,0.5), 0 18px 44px rgba(10,8,6,0.16), 0 1px 0 rgba(255,255,255,0.9) inset"
      padding={{ base: 4, md: 5 }}
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
      <HStack align="flex-start" justify="space-between" gap={4}>
        <Stack gap={3} flex={1} minW={0}>
          <HStack
            gap={2}
            align="center"
            bg={status.isOpen ? "rgba(39,174,96,0.12)" : "rgba(160,153,140,0.16)"}
            borderWidth="1px"
            borderColor={status.isOpen ? "rgba(39,174,96,0.28)" : "rgba(160,153,140,0.28)"}
            borderRadius="full"
            paddingInline={3}
            paddingBlock={1.5}
            width="fit-content"
            maxW="100%"
          >
            <Box
              aria-hidden
              width="11px"
              height="11px"
              borderRadius="full"
              flexShrink={0}
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
            <Text
              fontWeight="800"
              fontSize={{ base: "sm", md: "md" }}
              lineHeight="1.2"
              color="#211B16"
              textWrap="balance"
            >
              {headline}
            </Text>
          </HStack>
          <Text
            fontSize={{ base: "sm", md: "sm" }}
            color="#5B5047"
            lineHeight="1.55"
            fontWeight="600"
          >
            Typical prep 18–22 min · {formatGBPFromPence(deliveryRules.outsideFeePence)} flat
            delivery within 4 miles
          </Text>
          <NextLink
            href={ctaHref}
            onClick={dismiss}
            style={{
              display: "inline-block",
              marginTop: 2,
              background: "#A4BDA7",
              color: "#000",
              fontWeight: 800,
              fontSize: "0.95rem",
              padding: "11px 16px",
              borderRadius: 8,
              textAlign: "center",
              textDecoration: "none",
              boxShadow: "0 10px 22px rgba(164,189,167,0.34)",
            }}
          >
            {ctaLabel}
          </NextLink>
        </Stack>
        <IconButton
          aria-label="Dismiss"
          size="sm"
          variant="ghost"
          onClick={dismiss}
          color="#211B16"
          bg="rgba(33,27,22,0.06)"
          borderRadius="full"
          flexShrink={0}
          _hover={{ bg: "rgba(33,27,22,0.12)" }}
        >
          <Box as="span" aria-hidden fontSize="lg" lineHeight="1" fontWeight="800">
            ×
          </Box>
        </IconButton>
      </HStack>
    </Box>
  );
}
