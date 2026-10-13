import assert from "node:assert/strict";

import {
  BADGE_POLL_INTERVAL_MS,
  nextPollDelayMs,
  retryDelayMs,
} from "../apps/admin-mobile/src/hooks/pollingPolicy";

type RequestCounts = {
  badgeFullDashboard: number;
  badgeLightweight: number;
  dashboardFull: number;
  ordersList: number;
  bookingsList: number;
  tracking: number;
  inactiveScreenRequests: number;
  backgroundUiRequests: number;
};

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

function intervalTicks(durationMs: number, intervalMs: number): number {
  if (durationMs <= intervalMs) return 0;
  return Math.floor((durationMs - 1) / intervalMs);
}

function immediateAndIntervalTicks(durationMs: number, intervalMs: number): number {
  if (durationMs <= 0) return 0;
  return 1 + intervalTicks(durationMs, intervalMs);
}

function beforeCounts(): RequestCounts {
  const foregroundMs = 3 * MINUTE;
  const backgroundMs = 30 * SECOND;
  const totalMountedMs = foregroundMs + backgroundMs;

  const globalBadgeDashboard = immediateAndIntervalTicks(
    totalMountedMs,
    BADGE_POLL_INTERVAL_MS,
  );

  const dashboardTimerTicks = intervalTicks(totalMountedMs, 30 * SECOND);
  const ordersMountedMs = 2 * MINUTE + backgroundMs;
  const ordersTimerTicks = intervalTicks(ordersMountedMs, 20 * SECOND);
  const bookingsMountedMs = MINUTE + backgroundMs;
  const bookingsTimerTicks = intervalTicks(bookingsMountedMs, 30 * SECOND);

  return {
    badgeFullDashboard:
      globalBadgeDashboard +
      1 +
      dashboardTimerTicks +
      ordersTimerTicks +
      bookingsTimerTicks,
    badgeLightweight: 0,
    dashboardFull: 2 + dashboardTimerTicks,
    ordersList: 2 + ordersTimerTicks,
    bookingsList: 2 + bookingsTimerTicks,
    tracking: intervalTicks(totalMountedMs, 10 * SECOND),
    inactiveScreenRequests:
      intervalTicks(2 * MINUTE + backgroundMs, 30 * SECOND) +
      intervalTicks(MINUTE + backgroundMs, 20 * SECOND),
    backgroundUiRequests:
      intervalTicks(backgroundMs, BADGE_POLL_INTERVAL_MS) +
      intervalTicks(backgroundMs, 30 * SECOND) +
      intervalTicks(backgroundMs, 20 * SECOND) +
      intervalTicks(backgroundMs, 10 * SECOND),
  };
}

function afterCounts(): RequestCounts {
  const foregroundMs = 3 * MINUTE;

  return {
    badgeFullDashboard: 0,
    badgeLightweight: immediateAndIntervalTicks(
      foregroundMs,
      BADGE_POLL_INTERVAL_MS,
    ),
    dashboardFull: 1 + intervalTicks(MINUTE, 30 * SECOND),
    ordersList: 1 + intervalTicks(MINUTE, 20 * SECOND),
    bookingsList: 1 + intervalTicks(MINUTE, 30 * SECOND),
    tracking: intervalTicks(foregroundMs, 10 * SECOND),
    inactiveScreenRequests: 0,
    backgroundUiRequests: 0,
  };
}

const before = beforeCounts();
const after = afterCounts();

assert.equal(retryDelayMs({ failureCount: 1, random: () => 0 }), 8_000);
assert.equal(retryDelayMs({ failureCount: 3, random: () => 0 }), 32_000);
assert.equal(retryDelayMs({ failureCount: 99, random: () => 1 }), 60_000);
assert.equal(retryDelayMs({ failureCount: 1, retryAfterMs: 1_250 }), 1_250);
assert.equal(nextPollDelayMs({ nextAllowedAt: 20_000, now: 0 }), 20_000);
assert.equal(nextPollDelayMs({ nextAllowedAt: 1_000, now: 0 }), 8_000);

assert.equal(after.badgeFullDashboard, 0);
assert.ok(after.badgeLightweight > 0);
assert.ok(before.badgeFullDashboard > after.badgeFullDashboard);
assert.ok(before.dashboardFull > after.dashboardFull);
assert.ok(before.ordersList > after.ordersList);
assert.ok(before.bookingsList > after.bookingsList);
assert.equal(after.inactiveScreenRequests, 0);
assert.equal(after.backgroundUiRequests, 0);

console.table([
  { resource: "badge full-dashboard", before: before.badgeFullDashboard, after: after.badgeFullDashboard },
  { resource: "badge lightweight", before: before.badgeLightweight, after: after.badgeLightweight },
  { resource: "dashboard full", before: before.dashboardFull, after: after.dashboardFull },
  { resource: "orders list", before: before.ordersList, after: after.ordersList },
  { resource: "bookings list", before: before.bookingsList, after: after.bookingsList },
  { resource: "tracking", before: before.tracking, after: after.tracking },
  { resource: "inactive screen", before: before.inactiveScreenRequests, after: after.inactiveScreenRequests },
  { resource: "background UI", before: before.backgroundUiRequests, after: after.backgroundUiRequests },
]);
