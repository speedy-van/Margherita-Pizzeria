import Constants from "expo-constants";

import { isRecord, safeString } from "./lib/customer-data";

export { money } from "./lib/customer-data";

const PRODUCTION_URL = "https://www.margheritapizza.uk";
const configuredUrl = safeString(process.env.EXPO_PUBLIC_API_BASE_URL)
  || safeString(Constants.expoConfig?.extra?.MARGHERITA_PROD_URL)
  || PRODUCTION_URL;

/** Local development is opt-in through EXPO_PUBLIC_API_BASE_URL. */
export const API_BASE_URL = /^https?:\/\//i.test(configuredUrl)
  ? configuredUrl.replace(/\/+$/, "")
  : PRODUCTION_URL;

export function toAbsoluteUrl(pathOrUrl: string | null | undefined): string | null {
  const path = safeString(pathOrUrl);
  if (!path || path.startsWith("//")) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return null;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const imageAbsoluteURL = toAbsoluteUrl;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(message: string, code = "REQUEST_FAILED", status = 0, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export interface ApiRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

function responseError(body: unknown, status: number): ApiError {
  const error = isRecord(body) && isRecord(body.error) ? body.error : {};
  const fields: Record<string, string> = {};
  if (isRecord(error.fields)) {
    for (const [key, value] of Object.entries(error.fields).slice(0, 12)) {
      if (typeof value === "string" && value.trim()) fields[key] = value.trim();
    }
  }
  const message = safeString(error.message, status >= 500
    ? "Margherita is temporarily unavailable. Please try again."
    : `This request could not be completed${status ? ` (${status})` : ""}. Please try again.`);
  const details = Array.from(new Set(Object.values(fields))).join(" ");
  return new ApiError(`${message}${details ? ` ${details}` : ""}`, safeString(error.code, "REQUEST_FAILED"), status, fields);
}

async function requestJson<T>(path: string, payload: unknown, method: "GET" | "POST", options: ApiRequestOptions): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new ApiError("This app request is not valid.", "INVALID_PATH");
  }
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  const timeout = Math.max(1000, Math.min(60_000, options.timeoutMs ?? 20_000));
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener("abort", abort);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { Accept: "application/json", ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
      ...(method === "POST" ? { body: JSON.stringify(payload) } : {}),
      signal: controller.signal,
    });
    let body: unknown;
    try { body = await response.json(); } catch {
      throw new ApiError("The server returned an unreadable response. Please try again.", "INVALID_RESPONSE", response.status);
    }
    if (!response.ok || !isRecord(body) || body.ok !== true) throw responseError(body, response.status);
    if (!("data" in body) || body.data === undefined) {
      throw new ApiError("The server response was incomplete. Please try again.", "INVALID_RESPONSE", response.status);
    }
    // Legacy fallback settings returned with HTTP 200 are not verified live state.
    if (path.split("?")[0] === "/api/customer/settings" && safeString(body.warning)) {
      throw new ApiError("Live opening times could not be checked. Please refresh or call the restaurant.", "SETTINGS_UNAVAILABLE", response.status);
    }
    return body.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError(timedOut ? "This request timed out. Please try again." : "This request was cancelled.", timedOut ? "TIMEOUT" : "REQUEST_ABORTED");
    }
    throw new ApiError("Couldn't connect to Margherita. Check your connection and try again.", "NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

export function getJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return requestJson<T>(path, undefined, "GET", options);
}

export function postJson<T>(path: string, payload: unknown, options: ApiRequestOptions = {}): Promise<T> {
  return requestJson<T>(path, payload, "POST", options);
}
