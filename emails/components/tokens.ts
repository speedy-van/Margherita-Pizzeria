/**
 * Email styling tokens. Kept in a tiny module to avoid circular imports
 * between `EmailShell` and its sub-components.
 */

export const emailBrand = {
  bg: "#0D0D0D",
  panel: "#1A1A1A",
  border: "#2A2A2A",
  fg: "#F5F5F0",
  muted: "#A0998C",
  brand: "#E69A8C",
  crimson: "#C0392B",
  amber: "#E67E22",
} as const;

export const emailFont =
  "Helvetica, Arial, 'Segoe UI', system-ui, sans-serif";
