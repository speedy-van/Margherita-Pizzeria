"use client";

import {
  Box,
  Button,
  CloseButton,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEYS = {
  dismissedAt: "mp:pwa:dismissed-at",
  installed: "mp:pwa:installed",
} as const;

const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const FIRST_PROMPT_DELAY_MS = 8000; // give the user a moment

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const MotionBox = motion.create(Box);

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Chrome / Android
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari
  // @ts-expect-error -- legacy iOS-only property
  if (window.navigator?.standalone === true) return true;
  return false;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAppleDevice = /iPad|iPhone|iPod/.test(ua);
  // iPad on iOS 13+ reports as Mac — check touch.
  const isIpadOs = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return isAppleDevice || isIpadOs;
}

function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function withinCooldown(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.dismissedAt);
    if (!raw) return false;
    const at = Number.parseInt(raw, 10);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  const ios = useMemo(() => isIos(), []);
  const iosSafari = useMemo(() => ios && isSafari(), [ios]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    try {
      if (window.localStorage.getItem(STORAGE_KEYS.installed) === "1") return;
    } catch {
      // ignore
    }
    if (withinCooldown()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so it doesn't slam in on landing.
      window.setTimeout(() => setVisible(true), FIRST_PROMPT_DELAY_MS);
    };

    const onInstalled = () => {
      try {
        window.localStorage.setItem(STORAGE_KEYS.installed, "1");
      } catch {
        // ignore
      }
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — show "Add to Home Screen" hint.
    if (iosSafari) {
      const t = window.setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, FIRST_PROMPT_DELAY_MS);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [iosSafari]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEYS.dismissedAt, String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        try {
          window.localStorage.setItem(STORAGE_KEYS.installed, "1");
        } catch {
          // ignore
        }
      } else {
        try {
          window.localStorage.setItem(STORAGE_KEYS.dismissedAt, String(Date.now()));
        } catch {
          // ignore
        }
      }
    } finally {
      setDeferredPrompt(null);
      setVisible(false);
    }
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <MotionBox
        key="install-prompt"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        position="fixed"
        zIndex={1400}
        left={{ base: 3, md: 6 }}
        right={{ base: 3, md: "auto" }}
        bottom={{ base: "calc(env(safe-area-inset-bottom) + 84px)", md: 6 }}
        maxW={{ md: "380px" }}
        bg="rgba(13,13,13,0.96)"
        color="white"
        borderWidth="1px"
        borderColor="rgba(230,126,34,0.55)"
        borderRadius="2xl"
        boxShadow="0 18px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(230,126,34,0.15)"
        padding={{ base: 4, md: 5 }}
        backdropFilter="blur(8px)"
        role="dialog"
        aria-label="Install Margherita Pizzeria app"
      >
        <HStack align="start" gap={3}>
          <Box
            flexShrink={0}
            width="44px"
            height="44px"
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="linear-gradient(135deg, #E67E22 0%, #C0392B 100%)"
            boxShadow="0 6px 18px rgba(192,57,43,0.45)"
            fontSize="22px"
            aria-hidden
          >
            🍕
          </Box>
          <Stack gap={1} flex={1}>
            <Text fontWeight="700" fontSize="md" lineHeight="1.25">
              Install Margherita
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800" lineHeight="1.45">
              {showIosHint
                ? "Tap the Share button, then \u201cAdd to Home Screen\u201d for one-tap re-orders."
                : "Add us to your home screen for one-tap re-orders, faster loading and offline browsing."}
            </Text>
          </Stack>
          <CloseButton
            size="sm"
            color="whiteAlpha.800"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          />
        </HStack>

        <HStack gap={2} marginTop={4} justify="flex-end">
          <Button
            size="sm"
            variant="ghost"
            color="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={dismiss}
          >
            Not now
          </Button>
          {!showIosHint ? (
            <Button
              size="sm"
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
              onClick={install}
              disabled={!deferredPrompt}
            >
              Install app
            </Button>
          ) : (
            <Button
              size="sm"
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
              onClick={dismiss}
            >
              Got it
            </Button>
          )}
        </HStack>
      </MotionBox>
    </AnimatePresence>
  );
}
