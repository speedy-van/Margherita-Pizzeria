import Constants from "expo-constants";
import { Platform } from "react-native";

type ExtraConfig = {
  MARGHERITA_PROD_URL?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

/**
 * Hard-coded production fallback. The real production URL should come
 * from `extra.MARGHERITA_PROD_URL` (set in `app.json`) or from the
 * `EXPO_PUBLIC_API_BASE_URL` env var (set in `eas.json` profiles).
 * This constant is the last-resort default so the app always points at
 * the public production backend.
 *
 * IMPORTANT: must point at `www.margheritapizza.uk` (not the apex).
 * The apex domain 307-redirects to `www`, and React Native's fetch /
 * NSURLSession strip the `Authorization` header on cross-host redirects.
 * Hitting the apex therefore makes every admin API call fail with 401
 * even though login succeeded.
 */
export const PRODUCTION_BASE_URL = "https://www.margheritapizza.uk";

const LOCAL_URL_RE = /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?\b/i;

export function isLocalUrl(url: string): boolean {
  return LOCAL_URL_RE.test(url.trim());
}

/**
 * Rewrites the bare-apex production host to its `www` equivalent.
 * See PRODUCTION_BASE_URL doc-comment for why.
 */
export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.replace(
    /^https?:\/\/margheritapizza\.uk\b/i,
    "https://www.margheritapizza.uk",
  );
}

function envOrExtraProdUrl(): string | undefined {
  // EXPO_PUBLIC_* vars are inlined at build time and available at runtime.
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim().replace(/\/+$/, "");
  if (extra.MARGHERITA_PROD_URL && extra.MARGHERITA_PROD_URL.trim()) {
    return extra.MARGHERITA_PROD_URL.trim().replace(/\/+$/, "");
  }
  return undefined;
}

/**
 * Resolve the backend base URL.
 *
 * Priority order:
 *  1. Expo Web dev mode → localhost:3000 (or EXPO_PUBLIC_API_BASE_URL if set).
 *     app.json extra.MARGHERITA_PROD_URL is intentionally skipped here:
 *     it is a native-build override, not a dev-web override, and the
 *     production server has no CORS headers so cross-origin browser fetches
 *     fail silently with "Failed to fetch".
 *  2. EXPO_PUBLIC_API_BASE_URL or extra.MARGHERITA_PROD_URL → native builds.
 *  3. Hard-coded production fallback.
 */
export function defaultBaseUrl(): string {
  if (__DEV__ && Platform.OS === "web") {
    const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (fromEnv && fromEnv.trim()) return fromEnv.trim().replace(/\/+$/, "");
    return "http://localhost:3000";
  }
  const configured = envOrExtraProdUrl();
  if (configured) return configured;
  return PRODUCTION_BASE_URL;
}

export const STORAGE_KEYS = {
  baseUrl: "margherita.baseUrl",
  token: "margherita.token",
  tokenExpiresAt: "margherita.tokenExpiresAt",
  user: "margherita.user",
  devBypass: "margherita.devBypass",
  rememberedEmail: "margherita.rememberedEmail",
} as const;
