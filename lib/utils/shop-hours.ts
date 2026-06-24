import type { OpeningHours, OpeningHoursDay } from "@/types/database";

export const OPENING_HOURS_SETTING_KEY = "opening_hours";

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { open: "11:00", close: "23:00" },
  tuesday: { open: "11:00", close: "23:00" },
  wednesday: { open: "11:00", close: "23:00" },
  thursday: { open: "11:00", close: "23:00" },
  friday: { open: "11:00", close: "00:00" },
  saturday: { open: "11:00", close: "00:00" },
  sunday: { open: "11:00", close: "23:00" },
};

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DAY_KEYS: (keyof OpeningHours)[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_LABELS: Record<keyof OpeningHours, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export interface ShopStatus {
  isOpen: boolean;
  /** "HH:mm" of today's closing time, when open. `"00:00"` means midnight. */
  closesAt: string | null;
  /** "HH:mm" of the next opening time, when closed. */
  opensAt: string | null;
  /** Human label like "today", "tomorrow", or weekday name. */
  opensDayLabel: string | null;
}

export function isValidHHMM(value: unknown): value is string {
  return typeof value === "string" && HHMM_RE.test(value);
}

function parseHHMM(value: string): number | null {
  if (!isValidHHMM(value)) return null;
  const parts = value.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function closeMinutes(value: string): number | null {
  const close = parseHHMM(value);
  if (close === null) return null;
  return close === 0 ? 24 * 60 : close;
}

export function isOpeningRangeValid(open: string, close: string): boolean {
  const openMinutes = parseHHMM(open);
  const closeMinutesValue = closeMinutes(close);
  if (openMinutes === null || closeMinutesValue === null) return false;
  return closeMinutesValue > openMinutes;
}

function dayEntry(hours: OpeningHours, dayIndex: number): OpeningHoursDay | null {
  const key = DAY_KEYS[dayIndex];
  if (!key) return null;
  const entry = hours[key];
  if (!entry || entry.closed) return null;
  if (!isOpeningRangeValid(entry.open, entry.close)) return null;
  return entry;
}

/**
 * Compute whether the shop is open at `now`. Treats `close === "00:00"` as
 * end-of-day (24:00). Does not currently handle ranges that wrap past midnight
 * into the next calendar day — close at midnight is the boundary.
 */
export function computeShopStatus(
  now: Date,
  hours: OpeningHours = DEFAULT_OPENING_HOURS,
): ShopStatus {
  const todayIdx = now.getDay();
  const today = dayEntry(hours, todayIdx);
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  if (today) {
    const open = parseHHMM(today.open);
    const close = closeMinutes(today.close);
    if (open !== null && close !== null && minutesNow >= open && minutesNow < close) {
      return {
        isOpen: true,
        closesAt: today.close,
        opensAt: null,
        opensDayLabel: null,
      };
    }
    if (open !== null && minutesNow < open) {
      return {
        isOpen: false,
        closesAt: null,
        opensAt: today.open,
        opensDayLabel: "today",
      };
    }
  }

  for (let i = 1; i <= 7; i += 1) {
    const idx = (todayIdx + i) % 7;
    const entry = dayEntry(hours, idx);
    if (entry) {
      const label =
        i === 1 ? "tomorrow" : (DAY_LABELS[DAY_KEYS[idx]!] ?? null);
      return {
        isOpen: false,
        closesAt: null,
        opensAt: entry.open,
        opensDayLabel: label,
      };
    }
  }

  return { isOpen: false, closesAt: null, opensAt: null, opensDayLabel: null };
}

/**
 * Return the exact {@link Date} of the next time the shop opens, relative to
 * `now`. Returns `null` when the shop is currently open or no opening hours
 * are configured for any day. Used to drive the reopening countdown.
 */
export function getNextOpening(
  now: Date,
  hours: OpeningHours = DEFAULT_OPENING_HOURS,
): Date | null {
  const todayIdx = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const today = dayEntry(hours, todayIdx);
  if (today) {
    const open = parseHHMM(today.open);
    const close = closeMinutes(today.close);
    // Already open → no upcoming opening to count down to.
    if (open !== null && close !== null && minutesNow >= open && minutesNow < close) return null;
    // Closed earlier today, opens later today.
    if (open !== null && minutesNow < open) {
      const next = new Date(now);
      next.setHours(Math.floor(open / 60), open % 60, 0, 0);
      return next;
    }
  }

  for (let i = 1; i <= 7; i += 1) {
    const idx = (todayIdx + i) % 7;
    const entry = dayEntry(hours, idx);
    if (entry) {
      const open = parseHHMM(entry.open);
      if (open === null) continue;
      const next = new Date(now);
      next.setDate(now.getDate() + i);
      next.setHours(Math.floor(open / 60), open % 60, 0, 0);
      return next;
    }
  }

  return null;
}

export function formatClosedMessage(status: ShopStatus): string {
  if (status.isOpen) return "";
  if (status.opensAt && status.opensDayLabel) {
    return `We're closed right now. Online ordering reopens ${status.opensDayLabel} at ${status.opensAt}.`;
  }
  return "We're closed for online ordering right now.";
}

export function coerceOpeningHours(value: unknown): OpeningHours {
  if (!value || typeof value !== "object") return DEFAULT_OPENING_HOURS;
  const obj = value as Record<string, unknown>;
  const out: OpeningHours = { ...DEFAULT_OPENING_HOURS };
  for (const day of DAY_KEYS) {
    const entry = obj[day];
    if (entry && typeof entry === "object") {
      const e = entry as Record<string, unknown>;
      const open =
        isValidHHMM(e.open) ? e.open : DEFAULT_OPENING_HOURS[day].open;
      const close =
        isValidHHMM(e.close) ? e.close : DEFAULT_OPENING_HOURS[day].close;
      const closed = typeof e.closed === "boolean" ? e.closed : undefined;
      if (!closed && !isOpeningRangeValid(open, close)) {
        out[day] = DEFAULT_OPENING_HOURS[day];
      } else {
        out[day] = { open, close, ...(closed !== undefined ? { closed } : {}) };
      }
    }
  }
  return out;
}

export function validateOpeningHours(value: unknown): OpeningHours | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const out: OpeningHours = { ...DEFAULT_OPENING_HOURS };

  for (const day of DAY_KEYS) {
    const entry = obj[day];
    if (!entry || typeof entry !== "object") return null;
    const e = entry as Record<string, unknown>;
    const closed = typeof e.closed === "boolean" ? e.closed : undefined;
    const open = e.open;
    const close = e.close;

    if (closed === true) {
      out[day] = {
        open: isValidHHMM(open) ? open : DEFAULT_OPENING_HOURS[day].open,
        close: isValidHHMM(close) ? close : DEFAULT_OPENING_HOURS[day].close,
        closed,
      };
      continue;
    }

    if (!isValidHHMM(open) || !isValidHHMM(close)) return null;
    if (!isOpeningRangeValid(open, close)) return null;
    out[day] = { open, close, ...(closed !== undefined ? { closed } : {}) };
  }

  return out;
}

/**
 * Load opening hours from the `settings` table (DB is source of truth),
 * falling back to {@link DEFAULT_OPENING_HOURS} when the row is missing or
 * the DB is unreachable. Never throws.
 */
export async function getOpeningHours(): Promise<OpeningHours> {
  try {
    const { inArray } = await import("drizzle-orm");
    const { db } = await import("@/lib/db/client");
    const { settings } = await import("@/lib/db/schema");
    const rows = await db
      .select()
      .from(settings)
      .where(inArray(settings.key, [OPENING_HOURS_SETTING_KEY]));
    const row = rows[0];
    if (!row) return DEFAULT_OPENING_HOURS;
    return coerceOpeningHours(row.value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[shop-hours] getOpeningHours failed, using defaults:", err);
    return DEFAULT_OPENING_HOURS;
  }
}
