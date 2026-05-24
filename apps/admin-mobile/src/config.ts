import Constants from "expo-constants";
import { Platform } from "react-native";

type ExtraConfig = {
  MARGHERITA_BASE_URL_LAN?: string;
  MARGHERITA_BASE_URL_EMULATOR?: string;
  MARGHERITA_BASE_URL_WEB?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

/**
 * Resolve a sensible default backend base URL per runtime target.
 * Override at runtime via the in-app Settings field (persisted to AsyncStorage).
 *
 * - Web / browser preview: http://localhost:3000 (same machine)
 * - Android emulator: http://10.0.2.2:3000 (loopback to host)
 * - Real device on Wi-Fi: LAN IP (override via in-app field if it changes)
 * - iOS simulator: http://localhost:3000
 */
export function defaultBaseUrl(): string {
  if (Platform.OS === "web") {
    return extra.MARGHERITA_BASE_URL_WEB ?? "http://localhost:3000";
  }
  if (Platform.OS === "android") {
    return extra.MARGHERITA_BASE_URL_EMULATOR ?? "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

export const STORAGE_KEYS = {
  baseUrl: "margherita.baseUrl",
  token: "margherita.token",
  tokenExpiresAt: "margherita.tokenExpiresAt",
  user: "margherita.user",
  devBypass: "margherita.devBypass",
  rememberedEmail: "margherita.rememberedEmail",
} as const;
