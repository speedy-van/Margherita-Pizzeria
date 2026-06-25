import { inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { menuItems, settings } from "@/lib/db/schema";
import { siteConfig } from "@/lib/config/site";
import type {
  OrderDraftCartItem,
  OrderMode,
  OrderPricingBreakdown,
  ValidatedOrderItem,
} from "@/lib/orders/types";

export interface OrderSettings {
  acceptingOnlineOrders: boolean;
  collectionOpen: boolean;
  deliveryOpen: boolean;
  busyMode: "normal" | "busy" | "very_busy";
  minDeliveryOrderPence: number;
  deliveryFeePence: number;
  prepTimeMinutes: number;
  deliveryTimeMinutes: number;
  customerMessage: string;
}

const SETTING_KEYS = {
  ACCEPTING_ONLINE_ORDERS: "accepting_online_orders",
  COLLECTION_OPEN: "collection_open",
  DELIVERY_OPEN: "delivery_open",
  BUSY_MODE: "busy_mode",
  MIN_DELIVERY_ORDER_PENCE: "min_delivery_order_pence",
  DELIVERY_FEE_PENCE: "delivery_fee_pence",
  PREP_TIME_MINUTES: "prep_time_minutes",
  DELIVERY_TIME_MINUTES: "delivery_time_minutes",
  CUSTOMER_MESSAGE: "customer_message",
} as const;

const DEFAULT_PREP_TIME_MINUTES = 25;
const DEFAULT_DELIVERY_TIME_MINUTES = 45;

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

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function toBusyMode(value: unknown): "normal" | "busy" | "very_busy" {
  return value === "busy" || value === "very_busy" ? value : "normal";
}

function toMessage(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function getOrderSettings(): Promise<OrderSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(
      inArray(settings.key, [
        SETTING_KEYS.ACCEPTING_ONLINE_ORDERS,
        SETTING_KEYS.COLLECTION_OPEN,
        SETTING_KEYS.DELIVERY_OPEN,
        SETTING_KEYS.BUSY_MODE,
        SETTING_KEYS.MIN_DELIVERY_ORDER_PENCE,
        SETTING_KEYS.DELIVERY_FEE_PENCE,
        SETTING_KEYS.PREP_TIME_MINUTES,
        SETTING_KEYS.DELIVERY_TIME_MINUTES,
        SETTING_KEYS.CUSTOMER_MESSAGE,
      ]),
    );

  const map = new Map<string, unknown>();
  for (const row of rows) {
    map.set(row.key, row.value);
  }

  return {
    acceptingOnlineOrders: toBool(
      map.get(SETTING_KEYS.ACCEPTING_ONLINE_ORDERS),
      true,
    ),
    collectionOpen: toBool(map.get(SETTING_KEYS.COLLECTION_OPEN), true),
    deliveryOpen: toBool(map.get(SETTING_KEYS.DELIVERY_OPEN), true),
    busyMode: toBusyMode(map.get(SETTING_KEYS.BUSY_MODE)),
    minDeliveryOrderPence: toPositiveInt(
      map.get(SETTING_KEYS.MIN_DELIVERY_ORDER_PENCE),
      siteConfig.defaultMinDeliveryOrderPence,
    ),
    deliveryFeePence: toPositiveInt(
      map.get(SETTING_KEYS.DELIVERY_FEE_PENCE),
      siteConfig.defaultDeliveryFeePence,
    ),
    prepTimeMinutes: toPositiveInt(
      map.get(SETTING_KEYS.PREP_TIME_MINUTES),
      DEFAULT_PREP_TIME_MINUTES,
    ),
    deliveryTimeMinutes: toPositiveInt(
      map.get(SETTING_KEYS.DELIVERY_TIME_MINUTES),
      DEFAULT_DELIVERY_TIME_MINUTES,
    ),
    customerMessage: toMessage(map.get(SETTING_KEYS.CUSTOMER_MESSAGE)),
  };
}

export type ValidateCartResult =
  | { ok: true; items: ValidatedOrderItem[] }
  | { ok: false; code: string; message: string; fields?: Record<string, string> };

/**
 * Validate cart against the DB, merge duplicates safely, and produce
 * authoritative line items priced from the DB (never the client).
 */
export async function validateAndPriceCart(
  cartItems: OrderDraftCartItem[],
): Promise<ValidateCartResult> {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      ok: false,
      code: "EMPTY_CART",
      message: "Your cart is empty.",
    };
  }

  // Merge duplicates by menuItemId, summing quantities (clamped).
  const merged = new Map<string, number>();
  for (const entry of cartItems) {
    if (!entry || typeof entry.menuItemId !== "string") continue;
    const qty = Number(entry.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return {
        ok: false,
        code: "INVALID_QUANTITY",
        message: "One of the items has an invalid quantity.",
      };
    }
    const existing = merged.get(entry.menuItemId) ?? 0;
    const next = Math.min(20, existing + qty);
    merged.set(entry.menuItemId, next);
  }

  const ids = Array.from(merged.keys());
  if (ids.length === 0) {
    return {
      ok: false,
      code: "EMPTY_CART",
      message: "Your cart is empty.",
    };
  }

  const rows = await db
    .select()
    .from(menuItems)
    .where(inArray(menuItems.id, ids));

  const byId = new Map(rows.map((r) => [r.id, r] as const));

  const validated: ValidatedOrderItem[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) {
      return {
        ok: false,
        code: "ITEM_NOT_FOUND",
        message: "One of the items in your cart is no longer on the menu. Please remove it and try again.",
      };
    }
    if (!row.available) {
      return {
        ok: false,
        code: "ITEM_UNAVAILABLE",
        message: `Sorry — “${row.name}” is currently unavailable.`,
      };
    }
    const qty = merged.get(id) ?? 0;
    const unit = row.pricePence;
    const allergens = Array.isArray(row.allergens) ? row.allergens : [];
    validated.push({
      menuItemId: row.id,
      name: row.name,
      quantity: qty,
      unitPricePence: unit,
      totalPence: unit * qty,
      allergens,
    });
  }

  return { ok: true, items: validated };
}

export interface CalculatePricingArgs {
  items: ValidatedOrderItem[];
  orderType: OrderMode;
  settings: OrderSettings;
  discount?: {
    code: string;
    discountPence: number;
  } | null;
}

export function calculateOrderPricing({
  items,
  orderType,
  settings: cfg,
  discount,
}: CalculatePricingArgs): OrderPricingBreakdown {
  const subtotalPence = items.reduce(
    (sum, i) => sum + i.unitPricePence * i.quantity,
    0,
  );

  const meetsMinimumDelivery =
    orderType !== "delivery" || subtotalPence >= cfg.minDeliveryOrderPence;

  const deliveryFeePence = orderType === "delivery" ? cfg.deliveryFeePence : 0;

  const discountPence = Math.max(
    0,
    Math.min(subtotalPence, discount?.discountPence ?? 0),
  );
  const totalPence = subtotalPence + deliveryFeePence - discountPence;

  return {
    subtotalPence,
    deliveryFeePence,
    discountPence,
    discountCode: discount && discountPence > 0 ? discount.code : null,
    totalPence,
    minDeliveryOrderPence: cfg.minDeliveryOrderPence,
    meetsMinimumDelivery,
  };
}
