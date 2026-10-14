"use client";

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";
import type { ReactNode } from "react";

import { EmotionRegistry } from "@/components/ui/EmotionRegistry";
import { brandColors } from "@/lib/config/site";

const config = defineConfig({
  cssVarsPrefix: "margherita",
  globalCss: ({
    "html, body": {
      backgroundColor: "{colors.surface.base}",
      color: "{colors.fg.default}",
      fontFamily: "var(--font-body), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      minHeight: "100dvh",
    },
    "*:focus-visible": {
      outline: "2px solid",
      outlineColor: "{colors.brand.solid}",
      outlineOffset: "2px",
      borderRadius: "4px",
    },
    "h1, h2, h3, h4, h5, h6": {
      fontFamily: "var(--font-heading), Georgia, serif",
      letterSpacing: "-0.01em",
    },
    "@keyframes hero-shimmer": {
      "0%": { backgroundPosition: "200% 0" },
      "100%": { backgroundPosition: "-100% 0" },
    },
    "@keyframes logo-neon-spin": {
      "0%": { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(360deg)" },
    },
    "@keyframes logo-neon-pulse": {
      "0%, 100%": {
        boxShadow:
          "0 0 6px #A4BDA7, 0 0 14px #A4BDA7, 0 0 28px rgba(164,189,167,0.52)",
      },
      "50%": {
        boxShadow:
          "0 0 10px #A4BDA7, 0 0 22px #8EA891, 0 0 44px rgba(164,189,167,0.6)",
      },
    },
    "@keyframes logo-m-flash": {
      "0%, 55%, 100%": {
        opacity: 1,
        textShadow:
          "0 0 4px #fff, 0 0 10px #A4BDA7, 0 0 18px #A4BDA7, 0 0 28px #A4BDA7",
      },
      "60%, 70%, 80%": {
        opacity: 0.15,
        textShadow: "0 0 2px #fff",
      },
      "65%, 75%, 85%": {
        opacity: 1,
        textShadow:
          "0 0 6px #fff, 0 0 14px #A4BDA7, 0 0 26px #8EA891",
      },
    },
    "@keyframes radar-ring": {
      "0%":   { transform: "scale(1)",   opacity: 0.75 },
      "100%": { transform: "scale(2.8)", opacity: 0    },
    },
    "@media (prefers-reduced-motion: reduce)": {
      ".logo-neon-rotor": { animation: "none !important" },
      ".logo-m-flash":    { animation: "none !important" },
      ".radar-ring":      { animation: "none !important" },
    },
  } as unknown as Record<string, never>),
  theme: {
    breakpoints: {
      sm: "30em",   // 480px
      md: "48em",   // 768px
      lg: "62em",   // 992px
      xl: "80em",   // 1280px
      "2xl": "96em", // 1536px
    },
    tokens: {
      fonts: {
        heading: { value: "var(--font-heading), Georgia, serif" },
        body: {
          value:
            "var(--font-body), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        },
      },
      colors: {
        brand: {
          50: { value: "#F3F7F4" },
          100: { value: "#E8EFE9" },
          200: { value: "#D7E3D8" },
          300: { value: "#C3D3C5" },
          400: { value: "#AFC5B1" },
          500: { value: brandColors.crimson },
          600: { value: "#8EA891" },
          700: { value: "#718C74" },
          800: { value: "#536A56" },
          900: { value: "#344438" },
        },
        amber: {
          500: { value: brandColors.amber },
        },
        forest: {
          500: { value: brandColors.forest },
        },
        surface: {
          base: { value: brandColors.nearBlack },
          raised: { value: brandColors.charcoal },
          subtle: { value: "#F4F1E8" },
          border: { value: "#D8D2C4" },
        },
        ink: {
          50: { value: brandColors.offWhite },
          muted: { value: brandColors.warmGrey },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "{colors.surface.base}" },
          subtle: { value: "{colors.surface.raised}" },
          muted: { value: "{colors.surface.subtle}" },
        },
        fg: {
          DEFAULT: { value: "{colors.ink.50}" },
          default: { value: "{colors.ink.50}" },
          muted: { value: "{colors.ink.muted}" },
        },
        border: {
          DEFAULT: { value: "{colors.surface.border}" },
        },
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.ink.50}" },
          fg: { value: "{colors.ink.50}" },
          muted: { value: "{colors.brand.400}" },
          subtle: { value: "{colors.brand.100}" },
          emphasized: { value: "{colors.brand.600}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        accent: {
          solid: { value: "{colors.amber.500}" },
          contrast: { value: "{colors.surface.base}" },
        },
        success: {
          solid: { value: "{colors.forest.500}" },
          contrast: { value: "{colors.ink.50}" },
        },
      },
    },
    recipes: {
      button: {
        base: {
          fontWeight: "600",
          borderRadius: "lg",
          letterSpacing: "0.01em",
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

export function Provider({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </EmotionRegistry>
  );
}
