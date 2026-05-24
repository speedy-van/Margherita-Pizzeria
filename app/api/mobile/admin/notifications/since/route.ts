import { NextResponse } from "next/server";
import { and, gt, sql } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/client";
import { orders, tableBookings } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Foreground-polling fallback for the Android admin app. Returns any orders
 * and bookings created after `since`. Clients should pass the highest
 * `createdAt` they have already shown.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  // Default to the last 10 minutes so first-launch isn't an avalanche.
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 10 * 60_000);
  if (Number.isNaN(since.getTime())) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Invalid `since` timestamp." },
      },
      { status: 400 },
    );
  }
  const newOrders = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      type: orders.type,
      totalPence: orders.totalPence,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(gt(orders.createdAt, since))
    .orderBy(sql`${orders.createdAt} desc`)
    .limit(50);
  const newBookings = await db
    .select({
      id: tableBookings.id,
      reference: tableBookings.reference,
      date: tableBookings.date,
      timeSlot: tableBookings.timeSlot,
      covers: tableBookings.covers,
      createdAt: tableBookings.createdAt,
    })
    .from(tableBookings)
    .where(and(gt(tableBookings.createdAt, since)))
    .orderBy(sql`${tableBookings.createdAt} desc`)
    .limit(50);

  const latest = [
    ...newOrders.map((o) => o.createdAt.getTime()),
    ...newBookings.map((b) => b.createdAt.getTime()),
    since.getTime(),
  ].reduce((a, b) => (a > b ? a : b));

  return NextResponse.json({
    ok: true,
    data: {
      since: since.toISOString(),
      newestAt: new Date(latest).toISOString(),
      orders: newOrders.map((o) => ({
        id: o.id,
        reference: o.reference,
        type: o.type,
        totalPence: o.totalPence,
        createdAt: o.createdAt.toISOString(),
      })),
      bookings: newBookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        date: b.date,
        timeSlot: b.timeSlot,
        covers: b.covers,
        createdAt: b.createdAt.toISOString(),
      })),
    },
  });
}
