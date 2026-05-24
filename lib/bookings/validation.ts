import { z } from "zod";

import type {
  BookingStatusUpdateInput,
  CreateBookingInput,
} from "@/lib/bookings/types";
import type {
  ValidationFailure,
  ValidationResult,
} from "@/lib/validations/menu";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FUTURE_DAYS = 90;

function fail(
  message: string,
  fields?: Record<string, string>,
  code = "VALIDATION_FAILED",
  status = 400,
): ValidationFailure {
  return {
    ok: false,
    status,
    error: { code, message, ...(fields ? { fields } : {}) },
  };
}

function flatten(err: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in fields)) {
      fields[path] = issue.message;
    }
  }
  return fields;
}

function todayUtcDateString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmdToUtc(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const parts = value.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

function validateDateString(
  value: string,
): { ok: true } | { ok: false; message: string } {
  const date = parseYmdToUtc(value);
  if (!date) return { ok: false, message: "Use a valid date (YYYY-MM-DD)." };
  const today = parseYmdToUtc(todayUtcDateString());
  if (!today) return { ok: false, message: "Invalid date." };
  if (date.getTime() < today.getTime()) {
    return { ok: false, message: "Date cannot be in the past." };
  }
  if (daysBetween(today, date) > MAX_FUTURE_DAYS) {
    return {
      ok: false,
      message: `Choose a date within the next ${MAX_FUTURE_DAYS} days.`,
    };
  }
  return { ok: true };
}

/* ──────────── Availability query ──────────── */

export interface AvailabilityQueryInput {
  date: string;
  covers: number;
}

export function validateAvailabilityQuery(
  searchParams: URLSearchParams,
): ValidationResult<AvailabilityQueryInput> {
  const dateRaw = searchParams.get("date") ?? "";
  const coversRaw = searchParams.get("covers") ?? "";

  const fields: Record<string, string> = {};

  const dateCheck = validateDateString(dateRaw.trim());
  if (!dateCheck.ok) {
    fields.date = dateCheck.message;
  }

  const coversNum = Number(coversRaw);
  if (
    !coversRaw ||
    !Number.isFinite(coversNum) ||
    !Number.isInteger(coversNum) ||
    coversNum < 1 ||
    coversNum > 12
  ) {
    fields.covers = "Covers must be a whole number between 1 and 12.";
  }

  if (Object.keys(fields).length > 0) {
    return fail("Invalid availability query.", fields);
  }

  return {
    ok: true,
    data: { date: dateRaw.trim(), covers: coversNum },
  };
}

/* ──────────── Create booking ──────────── */

const createBookingSchema = z.object({
  date: z.string().trim().regex(DATE_RE, "Use YYYY-MM-DD."),
  timeSlot: z.string().trim().regex(HHMM, "Use HH:mm."),
  covers: z
    .number()
    .int("Covers must be a whole number.")
    .min(1, "At least 1 cover.")
    .max(12, "Maximum 12 covers."),
  customerName: z.string().trim().min(2, "Name is too short.").max(160, "Name is too long."),
  customerEmail: z
    .string()
    .trim()
    .min(5, "Email is too short.")
    .max(255, "Email is too long.")
    .email("Enter a valid email."),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Phone number is too short.")
    .max(40, "Phone number is too long."),
  payDeposit: z.boolean(),
});

export function validateCreateBookingInput(
  input: unknown,
): ValidationResult<CreateBookingInput> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid booking payload.", flatten(parsed.error));
  }
  const data = parsed.data;

  const dateCheck = validateDateString(data.date);
  if (!dateCheck.ok) {
    return fail("Invalid booking payload.", { date: dateCheck.message });
  }

  return {
    ok: true,
    data: {
      date: data.date,
      timeSlot: data.timeSlot,
      covers: data.covers,
      customerName: data.customerName,
      customerEmail: data.customerEmail.toLowerCase(),
      customerPhone: data.customerPhone,
      payDeposit: data.payDeposit,
    },
  };
}

/* ──────────── Booking id ──────────── */

export function validateBookingId(
  id: string,
): ValidationResult<{ id: string }> {
  if (!id || !UUID_RE.test(id)) {
    return fail("Invalid booking id.", { id: "Invalid booking id." }, "INVALID_ID");
  }
  return { ok: true, data: { id } };
}

/* ──────────── Status update ──────────── */

const statusUpdateSchema = z.object({
  status: z.enum(["confirmed", "rejected", "cancelled", "completed"]),
});

export function validateBookingStatusUpdateInput(
  input: unknown,
): ValidationResult<BookingStatusUpdateInput> {
  const parsed = statusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid status payload.", flatten(parsed.error));
  }
  return { ok: true, data: { status: parsed.data.status } };
}
