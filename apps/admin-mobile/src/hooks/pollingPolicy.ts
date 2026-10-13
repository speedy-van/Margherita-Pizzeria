export const BADGE_POLL_INTERVAL_MS = 8_000;
export const MAX_BADGE_RETRY_DELAY_MS = 60_000;

export function retryDelayMs(options: {
  failureCount: number;
  retryAfterMs?: number;
  baseMs?: number;
  maxMs?: number;
  random?: () => number;
}): number {
  const retryAfterMs = options.retryAfterMs;
  if (
    retryAfterMs != null &&
    Number.isFinite(retryAfterMs) &&
    retryAfterMs >= 0
  ) {
    return Math.ceil(retryAfterMs);
  }

  const baseMs = options.baseMs ?? BADGE_POLL_INTERVAL_MS;
  const maxMs = options.maxMs ?? MAX_BADGE_RETRY_DELAY_MS;
  const attempts = Math.max(0, Math.trunc(options.failureCount) - 1);
  const exponential = Math.min(maxMs, baseMs * 2 ** attempts);
  const random = options.random ?? Math.random;
  const jitterRatio = Math.max(0, Math.min(1, random()));
  const jitter = Math.floor(exponential * 0.2 * jitterRatio);
  return Math.min(maxMs, exponential + jitter);
}

export function nextPollDelayMs(options: {
  nextAllowedAt: number;
  now?: number;
  cadenceMs?: number;
}): number {
  const now = options.now ?? Date.now();
  const cadenceMs = options.cadenceMs ?? BADGE_POLL_INTERVAL_MS;
  return Math.max(cadenceMs, options.nextAllowedAt - now);
}
