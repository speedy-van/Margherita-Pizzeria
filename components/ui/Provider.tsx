"use client";

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";
import type { ReactNode } from "react";

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
          "0 0 6px #C0392B, 0 0 14px #C0392B, 0 0 28px rgba(192,57,43,0.55)",
      },
      "50%": {
        boxShadow:
          "0 0 10px #E04B36, 0 0 22px #E04B36, 0 0 44px rgba(224,75,54,0.7)",
      },
    },
    "@keyframes logo-m-flash": {
      "0%, 55%, 100%": {
        opacity: 1,
        textShadow:
          "0 0 4px #fff, 0 0 10px #C0392B, 0 0 18px #C0392B, 0 0 28px #C0392B",
      },
      "60%, 70%, 80%": {
        opacity: 0.15,
        textShadow: "0 0 2px #fff",
      },
      "65%, 75%, 85%": {
        opacity: 1,
        textShadow:
          "0 0 6px #fff, 0 0 14px #E04B36, 0 0 26px #E04B36",
      },
    },
    "@media (prefers-reduced-motion: reduce)": {
      ".logo-neon-rotor": { animation: "none !important" },
      ".logo-m-flash": { animation: "none !important" },
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
          50: { value: "#FBEAE7" },
          100: { value: "#F2C2BA" },
          200: { value: "#E69A8C" },
          300: { value: "#D9725F" },
          400: { value: "#CC4A32" },
          500: { value: brandColors.crimson },
          600: { value: "#A03124" },
          700: { value: "#80271D" },
          800: { value: "#5F1E16" },
          900: { value: "#3F140E" },
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
          subtle: { value: "#222222" },
          border: { value: "#2A2A2A" },
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
          fg: { value: "{colors.brand.300}" },
          muted: { value: "{colors.brand.800}" },
          subtle: { value: "{colors.brand.900}" },
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
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
