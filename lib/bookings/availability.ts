import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  settings,
  tableBookings,
  tables,
  timeSlots,
} from "@/lib/db/schema";
import type {
  BookingAvailabilityResponse,
  BookingAvailabilitySlot,
  BookingSettings,
} from "@/lib/bookings/types";

const SETTING_KEYS = {
  DEPOSIT_ENABLED: "deposit_enabled",
  DEPOSIT_AMOUNT_PENCE: "deposit_amount_pence",
} as const;

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n >= 0 ? n : fallback;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      const n = Math.trunc(parsed);
      return n >= 0 ? n : fallback;
    }
  }
  return fallback;
}

export async function getBookingSettings(): Promise<BookingSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(
      inArray(settings.key, [
        SETTING_KEYS.DEPOSIT_ENABLED,
        SETTING_KEYS.DEPOSIT_AMOUNT_PENCE,
      ]),
    );
  const map = new Map<string, unknown>();
  for (const row of rows) {
    map.set(row.key, row.value);
  }
  return {
    depositEnabled: toBoolean(map.get(SETTING_KEYS.DEPOSIT_ENABLED), false),
    depositAmountPence: toPositiveInt(
      map.get(SETTING_KEYS.DEPOSIT_AMOUNT_PENCE),
      0,
    ),
  };
}

interface ActiveTable {
  id: string;
  number: number;
  maxCovers: number;
}

async function listActiveTables(): Promise<ActiveTable[]> {
  const rows = await db
    .select({
      id: tables.id,
      number: tables.number,
      maxCovers: tables.maxCovers,
    })
    .from(tables)
    .where(eq(tables.active, true))
    .orderBy(asc(tables.maxCovers), asc(tables.number));
  return rows;
}

async function listActiveBookingSlots(): Promise<string[]> {
  const rows = await db
    .select({ time: timeSlots.time })
    .from(timeSlots)
    .where(and(eq(timeSlots.type, "booking"), eq(timeSlots.active, true)))
    .orderBy(asc(timeSlots.time));
  return rows.map((r) => r.time);
}

interface OccupiedRow {
  timeSlot: string;
  tableId: string | null;
}

/**
 * Returns the set of tableIds that are blocked for each timeSlot on a given
 * date. Blocking statuses: pending, confirmed.
 */
async function getOccupiedTableIdsByTimeSlot(
  date: string,
): Promise<Map<string, Set<string>>> {
  const rows = await db
    .select({
      timeSlot: tableBookings.timeSlot,
      tableId: tableBookings.tableId,
      status: tableBookings.status,
    })
    .from(tableBookings)
    .where(eq(tableBookings.date, date));

  const map = new Map<string, Set<string>>();
  for (const r of rows as Array<OccupiedRow & { status: string }>) {
    if (r.status !== "pending" && r.status !== "confirmed") continue;
    if (!r.tableId) continue;
    const set = map.get(r.timeSlot) ?? new Set<string>();
    set.add(r.tableId);
    map.set(r.timeSlot, set);
  }
  return map;
}

export async function getAvailableBookingSlots(
  date: string,
  covers: number,
): Promise<BookingAvailabilityResponse> {
  const [bookingSettings, activeTables, bookingTimes, occupiedByTime] =
    await Promise.all([
      getBookingSettings(),
      listActiveTables(),
      listActiveBookingSlots(),
      getOccupiedTableIdsByTimeSlot(date),
    ]);

  const slots: BookingAvailabilitySlot[] = bookingTimes.map((time) => {
    const occupied = occupiedByTime.get(time) ?? new Set<string>();
    const freeTables = activeTables.filter((t) => !occupied.has(t.id));
    const fittingFreeTables = freeTables.filter((t) => t.maxCovers >= covers);
    const maxCoversAvailable = freeTables.reduce(
      (acc, t) => (t.maxCovers > acc ? t.maxCovers : acc),
      0,
    );
    return {
      time,
      active: true,
      available: fittingFreeTables.length > 0,
      remainingTables: fittingFreeTables.length,
      maxCoversAvailable,
    };
  });

  return {
    date,
    covers,
    slots,
    depositEnabled: bookingSettings.depositEnabled,
    depositAmountPence: bookingSettings.depositAmountPence,
  };
}

/**
 * Server-side authoritative assignment. Picks the smallest active table that
 * fits the requested covers AND is not blocked for the given date/timeSlot.
 * Returns null if no single table fits or all suitable tables are taken.
 */
export async function assignBestTableForBooking(
  date: string,
  timeSlot: string,
  covers: number,
): Promise<{ tableId: string } | null> {
  const [activeTables, occupiedByTime] = await Promise.all([
    listActiveTables(),
    getOccupiedTableIdsByTimeSlot(date),
  ]);

  // Also confirm the slot itself is active for type=booking.
  const [slot] = await db
    .select({ id: timeSlots.id })
    .from(timeSlots)
    .where(
      and(
        eq(timeSlots.type, "booking"),
        eq(timeSlots.time, timeSlot),
        eq(timeSlots.active, true),
      ),
    )
    .limit(1);
  if (!slot) return null;

  const occupied = occupiedByTime.get(timeSlot) ?? new Set<string>();
  // activeTables already ordered asc by maxCovers; pick the smallest fit.
  for (const t of activeTables) {
    if (t.maxCovers < covers) continue;
    if (occupied.has(t.id)) continue;
    return { tableId: t.id };
  }
  return null;
}
