import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS, defaultBaseUrl } from "@/config";
import type { ApiEnvelope } from "./types";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiCallResult<T> =
  | { ok: true; status: number; data: T; raw: unknown }
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
  const [storedBase, storedToken, storedBypass] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.baseUrl),
    AsyncStorage.getItem(STORAGE_KEYS.token),
    AsyncStorage.getItem(STORAGE_KEYS.devBypass),
  ]);
  memoryBaseUrl = storedBase ?? defaultBaseUrl();
  memoryToken = storedToken;
  memoryDevBypass = storedBypass === "1";
  return {
    baseUrl: memoryBaseUrl,
    token: memoryToken,
    devBypass: memoryDevBypass,
  };
}

export function getBaseUrl(): string {
  return memoryBaseUrl ?? defaultBaseUrl();
}

export async function setBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, "");
  memoryBaseUrl = trimmed || defaultBaseUrl();
  await AsyncStorage.setItem(STORAGE_KEYS.baseUrl, memoryBaseUrl);
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

export async function setDevBypass(enabled: boolean): Promise<void> {
  memoryDevBypass = enabled;
  await AsyncStorage.setItem(STORAGE_KEYS.devBypass, enabled ? "1" : "0");
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (memoryToken) {
    headers.Authorization = `Bearer ${memoryToken}`;
  }
  if (memoryDevBypass) {
    // Honoured by lib/auth/require-admin.ts in non-production only.
    headers["x-dev-admin"] = "true";
  }
  return headers;
}

export async function apiCall<T>(
  options: ApiClientOptions,
): Promise<ApiCallResult<T>> {
  const base = getBaseUrl();
  const path = options.path.startsWith("/") ? options.path : `/${options.path}`;
  const url = `${base}${path}`;
  const method = options.method ?? "GET";

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(),
      body: options.body == null ? undefined : JSON.stringify(options.body),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: `Could not reach ${url}: ${message}`,
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
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: `Could not reach ${url}: ${message}`,
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
