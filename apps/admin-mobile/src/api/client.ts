import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import {
  STORAGE_KEYS,
  defaultBaseUrl,
  isLocalUrl,
  normalizeBaseUrl,
} from "@/config";
import { demoApiCall, demoUpload, isDemoToken } from "./demo";
import type { ApiEnvelope } from "./types";

/**
 * Fires whenever an authenticated request comes back 401. The session
 * layer wires this up to clear the token and bounce to login. We keep
 * a single global slot rather than an EventEmitter to avoid pulling in
 * extra deps and to keep behaviour deterministic in tests.
 */
type UnauthorizedHandler = (info: { path: string }) => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export type AuthCheckStatus = {
  path: string;
  status: number;
  ok: boolean;
  at: string;
};
let lastAuthCheck: AuthCheckStatus | null = null;
export function getLastAuthCheck(): AuthCheckStatus | null {
  return lastAuthCheck;
}

function recordAuthOutcome(path: string, status: number): void {
  // Track outcomes of admin/* endpoints for session health.
  if (!path.startsWith("/api/admin") && !path.startsWith("/api/mobile/admin/me")) {
    return;
  }
  lastAuthCheck = {
    path,
    status,
    ok: status >= 200 && status < 300,
    at: new Date().toISOString(),
  };
}

function notifyIfUnauthorized(path: string, status: number): void {
  if (status !== 401) return;
  // Login itself returning 401 is just "bad credentials" — don't nuke
  // the (non-existent) session for that.
  if (path === "/api/mobile/admin/login") return;
  if (!memoryToken) return;
  const handler = onUnauthorized;
  if (handler) handler({ path });
}

function debugLogAuthIssue(path: string, status: number): void {
  if (!__DEV__) return;
  if (status === 401 || status === 403) {
    // Token value is NEVER logged. Only shape/length, endpoint, status.
    // eslint-disable-next-line no-console
    console.warn("[admin-api] auth-failed", {
      endpoint: path,
      status,
      tokenPresent: Boolean(memoryToken),
      tokenLength: memoryToken ? memoryToken.length : 0,
    });
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiCallResult<T> =
  | { ok: true; status: number; data: T; raw: unknown }
  | { ok: false; status: number; code: string; message: string; raw: unknown };

export type ApiFileResult =
  | {
      ok: true;
      status: number;
      uri: string;
      fileName: string;
      contentType: string | null;
    }
  | { ok: false; status: number; code: string; message: string; raw: unknown };

type ApiClientOptions = {
  method?: Method;
  path: string;
  body?: unknown;
};

let memoryBaseUrl: string | null = null;
let memoryToken: string | null = null;
let memoryDevBypass = false;

export async function bootstrapSession(): Promise<{
  baseUrl: string;
  token: string | null;
  devBypass: boolean;
}> {
  const [storedBase, storedToken] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.baseUrl),
    AsyncStorage.getItem(STORAGE_KEYS.token),
  ]);
  // Release builds always fall back to the public production default if an
  // old stored local override is found.
  const usableStored =
    storedBase && !(!__DEV__ && isLocalUrl(storedBase)) ? storedBase : null;
  if (storedBase && !usableStored) {
    await AsyncStorage.removeItem(STORAGE_KEYS.baseUrl);
  }
  // Expo Web dev mode: a stored production URL causes CORS failures because
  // the production server has no CORS headers. Ignore any non-local stored
  // URL so the app always hits localhost in this mode, regardless of what a
  // previous session persisted (e.g., from a removed URL-settings panel).
  const shouldIgnoreStoredForWebDev =
    __DEV__ &&
    Platform.OS === "web" &&
    usableStored != null &&
    !isLocalUrl(usableStored);
  memoryBaseUrl = normalizeBaseUrl(
    shouldIgnoreStoredForWebDev ? defaultBaseUrl() : (usableStored ?? defaultBaseUrl()),
  );
  // Persist the normalised value so a stored apex URL gets healed once.
  if (usableStored && usableStored.replace(/\/+$/, "") !== memoryBaseUrl) {
    await AsyncStorage.setItem(STORAGE_KEYS.baseUrl, memoryBaseUrl);
  }
  memoryToken = storedToken;
  memoryDevBypass = false;
  await AsyncStorage.removeItem(STORAGE_KEYS.devBypass);
  return {
    baseUrl: memoryBaseUrl,
    token: memoryToken,
    devBypass: memoryDevBypass,
  };
}

export function getBaseUrl(): string {
  return memoryBaseUrl ?? normalizeBaseUrl(defaultBaseUrl());
}

export async function setBaseUrl(url: string): Promise<void> {
  const trimmed = normalizeBaseUrl(url);
  // Reject local URLs outright so a stale local override can never affect
  // TestFlight or App Store builds.
  if (!__DEV__ && trimmed && isLocalUrl(trimmed)) {
    memoryBaseUrl = normalizeBaseUrl(defaultBaseUrl());
    await AsyncStorage.removeItem(STORAGE_KEYS.baseUrl);
    return;
  }
  memoryBaseUrl = trimmed || normalizeBaseUrl(defaultBaseUrl());
  await AsyncStorage.setItem(STORAGE_KEYS.baseUrl, memoryBaseUrl);
}

export async function resetBaseUrl(): Promise<string> {
  memoryBaseUrl = normalizeBaseUrl(defaultBaseUrl());
  await AsyncStorage.removeItem(STORAGE_KEYS.baseUrl);
  return memoryBaseUrl;
}

export function getToken(): string | null {
  return memoryToken;
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) {
    await AsyncStorage.setItem(STORAGE_KEYS.token, token);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.token);
    await AsyncStorage.removeItem(STORAGE_KEYS.tokenExpiresAt);
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
  }
}

export function getDevBypass(): boolean {
  return memoryDevBypass;
}

export async function setDevBypass(_enabled: boolean): Promise<void> {
  memoryDevBypass = false;
  await AsyncStorage.removeItem(STORAGE_KEYS.devBypass);
}

function buildHeaders(options: {
  accept?: string;
  includeContentType?: boolean;
} = {}): Record<string, string> {
  const { accept = "application/json", includeContentType = true } = options;
  const headers: Record<string, string> = {
    Accept: accept,
  };
  if (includeContentType) headers["Content-Type"] = "application/json";
  if (memoryToken) {
    headers.Authorization = `Bearer ${memoryToken}`;
  }
  if (memoryDevBypass) {
    // Honoured by lib/auth/require-admin.ts in non-production only.
    headers["x-dev-admin"] = "true";
  }
  return headers;
}

function safeFileName(fileName: string): string {
  const safe = fileName.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-");
  return safe || "invoice.pdf";
}

export async function downloadApiFile(options: {
  path: string;
  fileName: string;
  directory?: "cache" | "document";
}): Promise<ApiFileResult> {
  const path = options.path.startsWith("/") ? options.path : `/${options.path}`;
  if (isDemoToken(memoryToken)) {
    return {
      ok: false,
      status: 0,
      code: "DEMO_FILE_UNAVAILABLE",
      message: "PDF actions need a live admin session and are not available in demo mode.",
      raw: null,
    };
  }

  const root =
    options.directory === "document"
      ? FileSystem.documentDirectory
      : FileSystem.cacheDirectory;
  if (!root) {
    return {
      ok: false,
      status: 0,
      code: "FILE_SYSTEM_UNAVAILABLE",
      message: "File storage is not available on this device.",
      raw: null,
    };
  }

  const base = getBaseUrl();
  const url = `${base}${path}`;
  const fileName = safeFileName(options.fileName);
  const fileUri = `${root}${fileName}`;

  let response: FileSystem.FileSystemDownloadResult;
  try {
    response = await FileSystem.downloadAsync(url, fileUri, {
      headers: buildHeaders({
        accept: "application/pdf",
        includeContentType: false,
      }),
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Could not download the invoice PDF. Check your connection and try again.\n\n" +
        `(${detail})`,
      raw: null,
    };
  }

  const status = response.status;
  if (status < 200 || status >= 300) {
    recordAuthOutcome(path, status);
    notifyIfUnauthorized(path, status);
    debugLogAuthIssue(path, status);
    return {
      ok: false,
      status,
      code: `HTTP_${status}`,
      message: `PDF download failed (${status})`,
      raw: response,
    };
  }

  recordAuthOutcome(path, status);
  return {
    ok: true,
    status,
    uri: response.uri,
    fileName,
    contentType: response.headers["Content-Type"] ?? response.headers["content-type"] ?? null,
  };
}

export async function apiCall<T>(
  options: ApiClientOptions,
): Promise<ApiCallResult<T>> {
  const base = getBaseUrl();
  const path = options.path.startsWith("/") ? options.path : `/${options.path}`;
  const url = `${base}${path}`;
  const method = options.method ?? "GET";

  const demoResult = demoApiCall<T>({
    method,
    path,
    body: options.body,
    token: memoryToken,
  });
  if (demoResult) return demoResult;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(),
      body: options.body == null ? undefined : JSON.stringify(options.body),
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Could not reach the admin server. Check your internet connection and try again.\n\n" +
        `(${detail})`,
      raw: null,
    };
  }

  let raw: unknown = null;
  const text = await response.text();
  if (text.length > 0) {
    try {
      raw = JSON.parse(text);
    } catch {
      raw = text;
    }
  }

  if (!response.ok) {
    recordAuthOutcome(path, response.status);
    notifyIfUnauthorized(path, response.status);
    debugLogAuthIssue(path, response.status);
    const envelope = raw as ApiEnvelope<T> | null;
    if (envelope && envelope.ok === false && envelope.error) {
      return {
        ok: false,
        status: response.status,
        code: envelope.error.code,
        message: envelope.error.message,
        raw,
      };
    }
    return {
      ok: false,
      status: response.status,
      code: `HTTP_${response.status}`,
      message: `Request failed (${response.status})`,
      raw,
    };
  }

  recordAuthOutcome(path, response.status);
  const envelope = raw as ApiEnvelope<T> | null;
  if (envelope && typeof envelope === "object" && "ok" in envelope) {
    if (envelope.ok === true) {
      return { ok: true, status: response.status, data: envelope.data, raw };
    }
    return {
      ok: false,
      status: response.status,
      code: envelope.error?.code ?? "UNKNOWN",
      message: envelope.error?.message ?? "Unknown error",
      raw,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: raw as T,
    raw,
  };
}

/**
 * Multipart upload helper. Builds FormData and lets fetch set the
 * multipart boundary automatically (do NOT set Content-Type by hand).
 * Auth + dev-bypass headers mirror {@link apiCall}.
 */
export async function apiUpload<T>(options: {
  path: string;
  method?: "POST" | "PUT" | "PATCH";
  /** Field name → value. File-like values are appended as-is. */
  fields: Record<string, string | Blob | { uri: string; name: string; type: string }>;
}): Promise<ApiCallResult<T>> {
  const base = getBaseUrl();
  const path = options.path.startsWith("/") ? options.path : `/${options.path}`;
  const url = `${base}${path}`;
  const method = options.method ?? "POST";

  const demoResult = demoUpload<T>({ path, token: memoryToken });
  if (demoResult) return demoResult;

  const form = new FormData();
  for (const [key, value] of Object.entries(options.fields)) {
    // React Native FormData accepts { uri, name, type } objects.
    form.append(key, value as unknown as Blob);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (memoryToken) headers.Authorization = `Bearer ${memoryToken}`;
  if (memoryDevBypass) headers["x-dev-admin"] = "true";

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body: form });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Could not reach the admin server. Check your internet connection and try again.\n\n" +
        `(${detail})`,
      raw: null,
    };
  }

  let raw: unknown = null;
  const text = await response.text();
  if (text.length > 0) {
    try {
      raw = JSON.parse(text);
    } catch {
      raw = text;
    }
  }

  if (!response.ok) {
    recordAuthOutcome(path, response.status);
    notifyIfUnauthorized(path, response.status);
    debugLogAuthIssue(path, response.status);
    const envelope = raw as ApiEnvelope<T> | null;
    if (envelope && envelope.ok === false && envelope.error) {
      return {
        ok: false,
        status: response.status,
        code: envelope.error.code,
        message: envelope.error.message,
        raw,
      };
    }
    return {
      ok: false,
      status: response.status,
      code: `HTTP_${response.status}`,
      message: `Upload failed (${response.status})`,
      raw,
    };
  }

  recordAuthOutcome(path, response.status);
  const envelope = raw as ApiEnvelope<T> | null;
  if (envelope && typeof envelope === "object" && "ok" in envelope) {
    if (envelope.ok === true) {
      return { ok: true, status: response.status, data: envelope.data, raw };
    }
    return {
      ok: false,
      status: response.status,
      code: envelope.error?.code ?? "UNKNOWN",
      message: envelope.error?.message ?? "Unknown error",
      raw,
    };
  }

  return { ok: true, status: response.status, data: raw as T, raw };
}
