import { and, eq, gte, lt, sql as drizzleSql } from "drizzle-orm";

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
import type { OrderStatus } from "@/types/database";

const RECENT_DASHBOARD_LIMIT = 20;
const BADGE_EVENT_LIMIT = 20;
const ACTIVE_ORDER_STATUSES = [
  "received",
  "making",
  "ready",
  "out_for_delivery",
] as const satisfies readonly OrderStatus[];

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

  const [todayOrderStats] = await db
    .select({
      todayOrderCount: drizzleSql<number>`count(*)::int`,
      todayRevenuePence: drizzleSql<number>`
        coalesce(
          sum(
            case
              when ${orders.status} not in ('cancelled', 'rejected', 'pending_payment')
              then ${orders.totalPence}
              else 0
            end
          ),
          0
        )::int
      `,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)));

  const todayOrderCount = todayOrderStats?.todayOrderCount ?? 0;
  const todayRevenuePence = todayOrderStats?.todayRevenuePence ?? 0;

  const [bookingStats] = await db
    .select({
      todayBookingCount: drizzleSql<number>`
        count(*) filter (where ${tableBookings.date} = ${ymd(start)})::int
      `,
      pendingBookingsCount: drizzleSql<number>`
        count(*) filter (where ${tableBookings.status} = 'pending')::int
      `,
    })
    .from(tableBookings);
  const todayBookingCount = bookingStats?.todayBookingCount ?? 0;
  const pendingBookingsCount = bookingStats?.pendingBookingsCount ?? 0;

  const [menuStats] = await db
    .select({
      activeMenuItemsCount: drizzleSql<number>`
        count(*) filter (where ${menuItems.available} = true)::int
      `,
      unavailableMenuItemsCount: drizzleSql<number>`
        count(*) filter (where ${menuItems.available} = false)::int
      `,
    })
    .from(menuItems);
  const activeMenuItemsCount = menuStats?.activeMenuItemsCount ?? 0;
  const unavailableMenuItemsCount = menuStats?.unavailableMenuItemsCount ?? 0;

  const [latestOrders, latestBookings] = await Promise.all([
    getAdminOrders({
      excludeStatuses: ["pending_payment"],
      limit: RECENT_DASHBOARD_LIMIT,
    }),
    getAdminBookings({ limit: RECENT_DASHBOARD_LIMIT }),
  ]);

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

/**
 * Lightweight authenticated dashboard shape for the badge/alert owner.
 * It preserves the existing response envelope and field names, but only
 * includes bounded event rows needed for badge counts and alert identity.
 */
export async function getAdminDashboardBadges(): Promise<AdminDashboardStats> {
  const [pendingBookingsRow] = await db
    .select({ count: drizzleSql<number>`count(*)::int` })
    .from(tableBookings)
    .where(eq(tableBookings.status, "pending"));

  const [latestOrders, latestBookings] = await Promise.all([
    getAdminOrders({
      statuses: ACTIVE_ORDER_STATUSES,
      limit: BADGE_EVENT_LIMIT,
    }),
    getAdminBookings({
      statuses: ["pending"],
      limit: BADGE_EVENT_LIMIT,
    }),
  ]);

  return {
    todayOrderCount: 0,
    todayBookingCount: 0,
    todayRevenuePence: 0,
    pendingBookingsCount: pendingBookingsRow?.count ?? 0,
    activeMenuItemsCount: 0,
    unavailableMenuItemsCount: 0,
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
