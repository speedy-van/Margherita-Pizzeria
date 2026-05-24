import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { orderTracking, orders, type Order } from "@/lib/db/schema";
import {
  buildTrackingMessage,
  canTrackDriverForStatus,
  isTerminalTrackingStatus,
} from "@/lib/tracking/public-summary";
import type {
  PublicTrackingSummary,
  TrackingCoordinates,
} from "@/lib/tracking/types";

function parseNumeric(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface LatestTrackingRow {
  driverLat: string;
  driverLng: string;
  updatedAt: Date;
}

async function getLatestTracking(orderId: string): Promise<LatestTrackingRow | null> {
  const [row] = await db
    .select({
      driverLat: orderTracking.driverLat,
      driverLng: orderTracking.driverLng,
      updatedAt: orderTracking.updatedAt,
    })
    .from(orderTracking)
    .where(eq(orderTracking.orderId, orderId))
    .orderBy(desc(orderTracking.updatedAt))
    .limit(1);
  return row ?? null;
}

function buildSummary(
  order: Order,
  tracking: LatestTrackingRow | null,
): PublicTrackingSummary {
  const isDelivery = order.type === "delivery";
  const destLat = parseNumeric(order.lat);
  const destLng = parseNumeric(order.lng);

  let driverLocation: PublicTrackingSummary["driverLocation"] = null;
  if (isDelivery && tracking) {
    const dLat = parseNumeric(tracking.driverLat);
    const dLng = parseNumeric(tracking.driverLng);
    if (dLat !== null && dLng !== null) {
      driverLocation = {
        lat: dLat,
        lng: dLng,
        updatedAt: tracking.updatedAt.toISOString(),
      };
    }
  }

  const canTrack = canTrackDriverForStatus(order.status, order.type);
  const message = buildTrackingMessage(
    order.status,
    order.type,
    driverLocation !== null,
  );

  return {
    orderId: order.id,
    reference: order.reference ?? null,
    type: order.type,
    status: order.status,
    estimatedTime: order.estimatedTime ?? null,
    destination: {
      hasDeliveryAddress: isDelivery && order.address !== null,
      lat: isDelivery ? destLat : null,
      lng: isDelivery ? destLng : null,
    },
    driverLocation,
    lastUpdatedAt: order.updatedAt.toISOString(),
    canTrackDriver: canTrack,
    message,
  };
}

export async function getPublicTrackingSummary(
  orderId: string,
): Promise<PublicTrackingSummary | null> {
  if (!orderId) return null;
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order) return null;

    const tracking =
      order.type === "delivery" ? await getLatestTracking(order.id) : null;
    return buildSummary(order, tracking);
  } catch (err: unknown) {
    console.error("[tracking] getPublicTrackingSummary failed:", err);
    return null;
  }
}

export type UpdateDriverLocationResult =
  | { ok: true; summary: PublicTrackingSummary }
  | {
      ok: false;
      code: "ORDER_NOT_FOUND" | "TRACKING_NOT_ALLOWED";
      message: string;
    };

export async function updateDriverLocation(
  orderId: string,
  coords: TrackingCoordinates,
): Promise<UpdateDriverLocationResult> {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order) {
      return {
        ok: false,
        code: "ORDER_NOT_FOUND",
        message: "Order not found.",
      };
    }

    if (order.type !== "delivery") {
      return {
        ok: false,
        code: "TRACKING_NOT_ALLOWED",
        message: "Driver tracking is not available for collection orders.",
      };
    }

    if (isTerminalTrackingStatus(order.status)) {
      return {
        ok: false,
        code: "TRACKING_NOT_ALLOWED",
        message: "This order is no longer active.",
      };
    }

    await db.insert(orderTracking).values({
      orderId: order.id,
      driverLat: String(coords.lat),
      driverLng: String(coords.lng),
    });

    const tracking = await getLatestTracking(order.id);
    return { ok: true, summary: buildSummary(order, tracking) };
  } catch (err: unknown) {
    console.error("[tracking] updateDriverLocation failed:", err);
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      message: "We couldn't update the driver location.",
    };
  }
}
