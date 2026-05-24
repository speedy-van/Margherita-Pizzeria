import { createSign } from "node:crypto";

import { env, hasFcmConfig } from "@/lib/env";

/**
 * Minimal FCM HTTP v1 sender. No SDK dependency.
 *
 * Requires the three FCM_* env vars to be set (see `hasFcmConfig`). When they
 * are not set, all senders return a skip result without throwing — callers
 * should treat that as "best effort".
 *
 * NOTHING in this module logs the private key or full access token.
 */

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}
let cached: CachedToken | null = null;

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalisePrivateKey(raw: string): string {
  // Env vars often encode newlines as literal \n.
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

async function getAccessToken(): Promise<string | null> {
  if (!hasFcmConfig) return null;
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - 60 > now) {
    return cached.accessToken;
  }

  const iat = now;
  const exp = iat + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: env.FCM_CLIENT_EMAIL,
    scope: FCM_SCOPE,
    aud: TOKEN_URL,
    exp,
    iat,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(normalisePrivateKey(env.FCM_PRIVATE_KEY));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error("[fcm] token exchange failed:", res.status);
    return null;
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) return null;
  cached = {
    accessToken: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600),
  };
  return cached.accessToken;
}

export interface FcmSendInput {
  token: string;
  title: string;
  body: string;
  /** Custom data payload — keep small (<4KB total). */
  data?: Record<string, string>;
  /** Defaults to "max" — required for full-screen lock-screen alerts. */
  androidPriority?: "high" | "normal";
  /** Notification channel id (must match Android side). */
  androidChannelId?: string;
}

export type FcmSendResult =
  | { ok: true; messageId: string }
  | { ok: false; skipped: true; reason: "no_config" }
  | { ok: false; status: number; error: string; tokenInvalid?: boolean };

const INVALID_TOKEN_ERRORS = new Set([
  "UNREGISTERED",
  "INVALID_ARGUMENT",
  "NOT_FOUND",
]);

export async function sendFcmDataAlert(
  input: FcmSendInput,
): Promise<FcmSendResult> {
  if (!hasFcmConfig) return { ok: false, skipped: true, reason: "no_config" };
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { ok: false, status: 0, error: "AUTH_FAILED" };
  }

  // Data-only message so the Android native handler controls the full-screen
  // intent (per lock-screen pattern). Title/body are passed as data fields.
  const message = {
    token: input.token,
    data: {
      title: input.title,
      body: input.body,
      channelId: input.androidChannelId ?? "admin_alerts",
      ...(input.data ?? {}),
    },
    android: {
      priority: input.androidPriority ?? "high",
    },
  };

  const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
    env.FCM_PROJECT_ID,
  )}/messages:send`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  if (res.ok) {
    const json = (await res.json()) as { name?: string };
    return { ok: true, messageId: json.name ?? "" };
  }
  let errorCode = "UNKNOWN";
  try {
    const json = (await res.json()) as {
      error?: { status?: string; message?: string };
    };
    errorCode = json.error?.status ?? "UNKNOWN";
  } catch {
    // ignore
  }
  return {
    ok: false,
    status: res.status,
    error: errorCode,
    tokenInvalid: INVALID_TOKEN_ERRORS.has(errorCode),
  };
}
