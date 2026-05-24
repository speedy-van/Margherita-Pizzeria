"use client";

import { Box } from "@chakra-ui/react";

import { contactDetails } from "@/lib/config/site";

const WHATSAPP_NUMBER = contactDetails.secondaryPhoneTel.replace(/[^0-9]/g, "");
const PREFILLED =
  "Hi Margherita Pizzeria! I'd like to place an order / ask a question.";

export interface WhatsAppFabProps {
  /** Push the FAB up so it sits above a mobile bottom bar (px). */
  bottomOffset?: number;
}

export function WhatsAppFab({ bottomOffset = 0 }: WhatsAppFabProps) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILLED)}`;

  return (
    <Box
      as="a"
      // @ts-expect-error -- chakra Box forwards anchor props
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      position="fixed"
      right={{ base: 4, md: 6 }}
      bottom={{
        base: `calc(${bottomOffset + 84}px + env(safe-area-inset-bottom))`,
        md: `calc(${bottomOffset + 24}px + env(safe-area-inset-bottom))`,
      }}
      width={{ base: "56px", md: "60px" }}
      height={{ base: "56px", md: "60px" }}
      borderRadius="full"
      bg="#25D366"
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
      boxShadow="0 10px 30px rgba(37, 211, 102, 0.45), 0 4px 12px rgba(0,0,0,0.35)"
      zIndex={1100}
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{
        transform: "translateY(-2px) scale(1.04)",
        boxShadow:
          "0 14px 36px rgba(37, 211, 102, 0.55), 0 6px 16px rgba(0,0,0,0.4)",
      }}
      _active={{ transform: "scale(0.96)" }}
      css={{
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "9999px",
          boxShadow: "0 0 0 0 rgba(37, 211, 102, 0.55)",
          animation: "wa-pulse 2.4s cubic-bezier(0.66, 0, 0, 1) infinite",
          pointerEvents: "none",
        },
        "@keyframes wa-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(37,211,102,0.55)" },
          "70%": { boxShadow: "0 0 0 18px rgba(37,211,102,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(37,211,102,0)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "&::before": { animation: "none" },
        },
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        width="28"
        height="28"
        fill="currentColor"
      >
        <path d="M19.11 17.46c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.14-.6.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.18-1.35-.81-.72-1.35-1.61-1.51-1.88-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.6-1.45-.83-1.99-.22-.52-.44-.45-.6-.46l-.51-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.99 2.67 1.13 2.85.14.18 1.95 2.98 4.73 4.17.66.28 1.18.45 1.58.58.66.21 1.27.18 1.74.11.53-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM16.03 5.33c-5.9 0-10.7 4.8-10.7 10.7 0 1.88.49 3.72 1.43 5.34L5.33 26.67l5.45-1.41a10.69 10.69 0 0 0 5.25 1.36h.01c5.9 0 10.7-4.8 10.7-10.7s-4.8-10.59-10.71-10.59zm0 19.61h-.01a8.9 8.9 0 0 1-4.54-1.24l-.33-.19-3.23.85.86-3.15-.21-.33a8.86 8.86 0 0 1-1.36-4.75c0-4.9 4-8.89 8.91-8.89 2.38 0 4.61.93 6.29 2.61a8.83 8.83 0 0 1 2.6 6.29c0 4.9-4 8.8-8.98 8.8z" />
      </svg>
    </Box>
  );
}
