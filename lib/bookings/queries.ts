import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { tableBookings, type TableBooking } from "@/lib/db/schema";
import { bookingCustomerMessage } from "@/lib/bookings/status";
import { generateUniqueReference } from "@/lib/utils/reference";
import type {
  BookingStatus,
  CreateBookingInput,
  PublicBookingSummary,
} from "@/lib/bookings/types";

interface CreateBookingOptions {
  requireDepositPayment: boolean;
}

async function nextBookingReference(): Promise<string | null> {
  return generateUniqueReference(async (candidate) => {
    const [hit] = await db
      .select({ id: tableBookings.id })
      .from(tableBookings)
      .where(eq(tableBookings.reference, candidate))
      .limit(1);
    return Boolean(hit);
  });
}

export async function createBooking(
  input: CreateBookingInput,
  assignedTableId: string,
  _options: CreateBookingOptions,
): Promise<TableBooking> {
  const reference = await nextBookingReference();
  const [row] = await db
    .insert(tableBookings)
    .values({
      reference,
      tableId: assignedTableId,
      date: input.date,
      timeSlot: input.timeSlot,
      covers: input.covers,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      depositPaid: false,
      status: "pending",
    })
    .returning();
  if (!row) {
    throw new Error("Failed to create booking.");
  }
  return row;
}

export async function getBookingById(
  id: string,
): Promise<TableBooking | null> {
  if (!id) return null;
  const [row] = await db
    .select()
    .from(tableBookings)
    .where(eq(tableBookings.id, id))
    .limit(1);
  return row ?? null;
}

export async function getBookingByStripeSessionId(
  stripeSessionId: string,
): Promise<TableBooking | null> {
  if (!stripeSessionId) return null;
  const [row] = await db
    .select()
    .from(tableBookings)
    .where(eq(tableBookings.stripeSessionId, stripeSessionId))
    .limit(1);
  return row ?? null;
}

function toPublicSummary(row: TableBooking): PublicBookingSummary {
  const status = row.status as BookingStatus;
  return {
    id: row.id,
    reference: row.reference ?? null,
    date: row.date,
    timeSlot: row.timeSlot,
    covers: row.covers,
    status,
    depositPaid: row.depositPaid,
    estimatedMessage: bookingCustomerMessage(status, row.depositPaid),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getPublicBookingSummary(
  id: string,
): Promise<PublicBookingSummary | null> {
  const row = await getBookingById(id);
  if (!row) return null;
  return toPublicSummary(row);
}

export async function updateBookingStripeSession(
  id: string,
  stripeSessionId: string,
): Promise<void> {
  await db
    .update(tableBookings)
    .set({ stripeSessionId, updatedAt: new Date() })
    .where(eq(tableBookings.id, id));
}

/**
 * Idempotent: if booking already depositPaid, returns existing row without
 * change. Returns null when no booking matches the session id.
 */
export async function markBookingDepositPaidFromStripeSession(
  stripeSessionId: string,
  bookingIdFromMetadata?: string | null,
): Promise<{ transitioned: boolean; booking: TableBooking } | null> {
  let row: TableBooking | null = null;
  if (bookingIdFromMetadata) {
    row = await getBookingById(bookingIdFromMetadata);
  }
  if (!row) {
    row = await getBookingByStripeSessionId(stripeSessionId);
  }
  if (!row) return null;

  if (row.depositPaid) {
    if (row.stripeSessionId !== stripeSessionId) {
      await db
        .update(tableBookings)
        .set({ stripeSessionId, updatedAt: new Date() })
        .where(eq(tableBookings.id, row.id));
    }
    return { transitioned: false, booking: row };
  }

  const [updated] = await db
    .update(tableBookings)
    .set({
      depositPaid: true,
      stripeSessionId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(tableBookings.id, row.id), eq(tableBookings.depositPaid, false)),
    )
    .returning();

  if (!updated) {
    // Lost the race — fetch fresh row.
    const fresh = await getBookingById(row.id);
    return fresh ? { transitioned: false, booking: fresh } : null;
  }
  return { transitioned: true, booking: updated };
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<TableBooking | null> {
  const [updated] = await db
    .update(tableBookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(tableBookings.id, id))
    .returning();
  return updated ?? null;
}
