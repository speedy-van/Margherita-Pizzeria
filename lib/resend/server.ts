import { Resend } from "resend";

import { env, isProduction } from "@/lib/env";

let cachedClient: Resend | null = null;

export function getResend(): Resend | null {
  const key = env.AUTH_RESEND_KEY.trim();
  if (!key) {
    return null;
  }
  if (cachedClient) return cachedClient;
  cachedClient = new Resend(key);
  return cachedClient;
}

export function getFromEmail(): string | null {
  const from = env.RESEND_FROM_EMAIL.trim();
  return from || null;
}

export interface MailSkipResult {
  ok: true;
  skipped: true;
  reason: string;
}

export interface MailSentResult {
  ok: true;
  skipped: false;
  id: string | null;
}

export interface MailFailResult {
  ok: false;
  error: string;
}

export type MailResult = MailSkipResult | MailSentResult | MailFailResult;

/**
 * Ensure env is wired before attempting to send. In development this returns
 * a skipped result rather than throwing, so local flows don't fail when
 * Resend keys are placeholders. In production missing config is a hard failure.
 */
export type MailerHandle =
  | { ok: true; skipped: false; resend: Resend; from: string }
  | MailSkipResult
  | MailFailResult;

export function getMailerOrSkip(): MailerHandle {
  const resend = getResend();
  const from = getFromEmail();
  if (!resend || !from) {
    const reason = `Resend ${!resend ? "key" : "from-email"} not configured`;
    if (isProduction) {
      return { ok: false, error: reason };
    }
    return { ok: true, skipped: true, reason };
  }
  return { ok: true, skipped: false, resend, from };
}
