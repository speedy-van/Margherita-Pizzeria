import { randomInt } from "node:crypto";

/**
 * Customer-facing reference for orders/bookings.
 * Format: "MP" + 6 digits, e.g. "MP123456".
 *
 * We re-try a small number of times if a collision is reported by the caller's
 * uniqueness check. With 1M possible values and small daily volume, collisions
 * are vanishingly rare but still possible long-term.
 */
export const REFERENCE_PREFIX = "MP";
export const REFERENCE_DIGITS = 6;
export const REFERENCE_PATTERN = /^MP\d{6}$/;

export function generateReferenceCandidate(): string {
  // randomInt(min, max) is [min, max). We want 000000..999999.
  const n = randomInt(0, 1_000_000);
  return `${REFERENCE_PREFIX}${n.toString().padStart(REFERENCE_DIGITS, "0")}`;
}

/**
 * Generate a unique reference by repeatedly calling `exists(ref)` until a
 * free value is found. Returns null if it cannot find one within `maxTries`.
 */
export async function generateUniqueReference(
  exists: (candidate: string) => Promise<boolean>,
  maxTries = 8,
): Promise<string | null> {
  for (let i = 0; i < maxTries; i += 1) {
    const candidate = generateReferenceCandidate();
    if (!(await exists(candidate))) return candidate;
  }
  return null;
}

export function isValidReference(value: unknown): value is string {
  return typeof value === "string" && REFERENCE_PATTERN.test(value);
}
