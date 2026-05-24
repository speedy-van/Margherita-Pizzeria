import { and, eq, gte, inArray, lt, ne, sql as drizzleSql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  menuItems,
  orders,
  tableBookings,
} from "@/lib/db/schema";
import {
  getAdminBookings,
  getAdminOrders,
} from "@/lib/admin/queries";
import type { AdminDashboardStats } from "@/lib/admin/types";

/**
 * Returns dashboard stats for the admin home page.
 *
 * Note: the project does not have a dedicated timezone helper. "Today" is
 * therefore computed using the server's local clock (00:00–24:00 in the
 * server TZ). When the app runs in UK time this matches user expectations;
 * on UTC-only hosting it will roll over at midnight UTC. Track via the
 * `usingServerTimezone` flag in the returned payload.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const todayOrdersRows = await db
    .select({
      total: orders.totalPence,
      status: orders.status,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)));

  const todayOrderCount = todayOrdersRows.length;
  const NON_REVENUE = new Set(["cancelled", "rejected", "pending_payment"]);
  const todayRevenuePence = todayOrdersRows.reduce(
    (sum, r) => (NON_REVENUE.has(r.status) ? sum : sum + r.total),
    0,
  );

  const todayBookingsCountRows = await db
    .select({ count: drizzleSql<number>`count(*)::int` })
    .from(tableBookings)
    .where(eq(tableBookings.date, ymd(start)));
  const todayBookingCount = todayBookingsCountRows[0]?.count ?? 0;

  const pendingBookingsCountRows = await db
    .select({ count: drizzleSql<number>`count(*)::int` })
    .from(tableBookings)
    .where(eq(tableBookings.status, "pending"));
  const pendingBookingsCount = pendingBookingsCountRows[0]?.count ?? 0;

  const activeRows = await db
    .select({ count: drizzleSql<number>`count(*)::int` })
    .from(menuItems)
    .where(eq(menuItems.available, true));
  const inactiveRows = await db
    .select({ count: drizzleSql<number>`count(*)::int` })
    .from(menuItems)
    .where(eq(menuItems.available, false));
  const activeMenuItemsCount = activeRows[0]?.count ?? 0;
  const unavailableMenuItemsCount = inactiveRows[0]?.count ?? 0;

  const latestOrders = (await getAdminOrders()).slice(0, 5);
  const latestBookings = (await getAdminBookings()).slice(0, 5);

  return {
    todayOrderCount,
    todayBookingCount,
    todayRevenuePence,
    pendingBookingsCount,
    activeMenuItemsCount,
    unavailableMenuItemsCount,
    latestOrders,
    latestBookings,
    generatedAt: new Date().toISOString(),
    usingServerTimezone: true,
  };
}

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Re-export unused symbols to satisfy the import shape if needed elsewhere.
void inArray;
void ne;
