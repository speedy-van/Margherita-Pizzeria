import { and, asc, desc, eq, inArray, notInArray, type SQL } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  images,
  menuCategories,
  menuItems,
  orders,
  settings,
  tableBookings,
  tables,
  timeSlots,
  type ImageRow,
  type MenuCategory,
  type MenuItem,
  type Order,
  type TableBooking,
  type TableRow,
  type TimeSlot,
} from "@/lib/db/schema";
import type {
  AdminBookingDetail,
  AdminBookingListItem,
  AdminImage,
  AdminMenuCategory,
  AdminMenuItem,
  AdminMenuPayload,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminSettings,
  AdminTable,
  AdminTimeSlot,
} from "@/lib/admin/types";
import {
  validateAdminBookingStatusInput,
  validateAdminOrderStatusInput,
  type AdminSettingsUpdateInput,
  type AdminCreateImageInput,
  type AdminUpdateImageInput,
  type AdminUpdateTableInput,
  type AdminUpdateTimeSlotInput,
  type AdminTimeSlotInput,
  type CreateMenuCategoryInput,
  type UpdateMenuCategoryInput,
} from "@/lib/admin/validation";
import type {
  BookingStatus,
  OrderItemSnapshot,
  OrderStatus,
  OpeningHours,
} from "@/types/database";
import {
  validateCreateMenuItemInput,
  validateUpdateMenuItemInput,
  type CreateMenuItemInput,
  type UpdateMenuItemInput,
} from "@/lib/validations/menu";
import { coerceOpeningHours } from "@/lib/utils/shop-hours";
import {
  createMenuItem as createMenuItemQuery,
  deleteMenuItem as deleteMenuItemQuery,
  updateMenuItem as updateMenuItemQuery,
} from "@/lib/menu/queries";

// AdminSettingsUpdateInput is imported from validation.

/* ─────────────── Orders ─────────────── */

type OrderListRow = Pick<
  Order,
  | "id"
  | "reference"
  | "type"
  | "status"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "totalPence"
  | "paymentMethod"
  | "items"
  | "createdAt"
  | "updatedAt"
>;

type AdminOrderListOptions = {
  limit?: number;
  statuses?: readonly OrderStatus[];
  excludeStatuses?: readonly OrderStatus[];
};

function boundedLimit(limit: number | undefined): number | undefined {
  if (limit == null) return undefined;
  if (!Number.isFinite(limit)) return undefined;
  return Math.max(0, Math.trunc(limit));
}

function toOrderListItem(row: OrderListRow): AdminOrderListItem {
  const items = Array.isArray(row.items) ? row.items : [];
  const itemCount = items.reduce(
    (sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0),
    0,
  );
  return {
    id: row.id,
    reference: row.reference ?? null,
    type: row.type,
    status: row.status,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    totalPence: row.totalPence,
    paymentMethod: row.paymentMethod,
    itemCount,
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toOrderDetail(row: Order): AdminOrderDetail {
  const base = toOrderListItem(row);
  const items: OrderItemSnapshot[] = Array.isArray(row.items) ? row.items : [];
  return {
    ...base,
    address: row.address ?? null,
    subtotalPence: row.subtotalPence,
    deliveryFeePence: row.deliveryFeePence,
    discountPence: row.discountPence,
    discountCode: row.discountCode ?? null,
    items,
    estimatedTime: row.estimatedTime ?? null,
  };
}

export async function getAdminOrders(
  options: AdminOrderListOptions = {},
): Promise<AdminOrderListItem[]> {
  const filters: SQL[] = [];
  if (options.statuses?.length) {
    filters.push(inArray(orders.status, [...options.statuses]));
  }
  if (options.excludeStatuses?.length) {
    filters.push(notInArray(orders.status, [...options.excludeStatuses]));
  }

  let query = db
    .select({
      id: orders.id,
      reference: orders.reference,
      type: orders.type,
      status: orders.status,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      totalPence: orders.totalPence,
      paymentMethod: orders.paymentMethod,
      items: orders.items,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .$dynamic();

  if (filters.length > 0) {
    query = query.where(and(...filters));
  }

  query = query.orderBy(desc(orders.createdAt), desc(orders.id));
  const limit = boundedLimit(options.limit);
  if (limit != null) {
    query = query.limit(limit);
  }

  const rows = await query;
  return rows.map(toOrderListItem);
}

export async function getAdminOrderDetail(
  id: string,
): Promise<AdminOrderDetail | null> {
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row) return null;
  return toOrderDetail(row);
}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<AdminOrderDetail | null> {
  const [row] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return row ? toOrderDetail(row) : null;
}

export { validateAdminOrderStatusInput };

/* ─────────────── Bookings ─────────────── */

type BookingListRow = Pick<
  TableBooking,
  | "id"
  | "reference"
  | "date"
  | "timeSlot"
  | "covers"
  | "status"
  | "depositPaid"
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "createdAt"
  | "updatedAt"
>;

type AdminBookingListOptions = {
  limit?: number;
  statuses?: readonly BookingStatus[];
};

function toBookingListItem(row: BookingListRow): AdminBookingListItem {
  return {
    id: row.id,
    reference: row.reference ?? null,
    date: row.date,
    timeSlot: row.timeSlot,
    covers: row.covers,
    status: row.status as BookingStatus,
    depositPaid: row.depositPaid,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toBookingDetail(row: TableBooking): AdminBookingDetail {
  return {
    ...toBookingListItem(row),
    tableId: row.tableId ?? null,
  };
}

export async function getAdminBookings(
  options: AdminBookingListOptions = {},
): Promise<AdminBookingListItem[]> {
  let query = db
    .select({
      id: tableBookings.id,
      reference: tableBookings.reference,
      date: tableBookings.date,
      timeSlot: tableBookings.timeSlot,
      covers: tableBookings.covers,
      status: tableBookings.status,
      depositPaid: tableBookings.depositPaid,
      customerName: tableBookings.customerName,
      customerEmail: tableBookings.customerEmail,
      customerPhone: tableBookings.customerPhone,
      createdAt: tableBookings.createdAt,
      updatedAt: tableBookings.updatedAt,
    })
    .from(tableBookings)
    .$dynamic();

  if (options.statuses?.length) {
    query = query.where(inArray(tableBookings.status, [...options.statuses]));
  }

  query = query.orderBy(desc(tableBookings.createdAt), desc(tableBookings.id));
  const limit = boundedLimit(options.limit);
  if (limit != null) {
    query = query.limit(limit);
  }

  const rows = await query;
  return rows.map(toBookingListItem);
}

export async function getAdminBookingDetail(
  id: string,
): Promise<AdminBookingDetail | null> {
  const [row] = await db
    .select()
    .from(tableBookings)
    .where(eq(tableBookings.id, id))
    .limit(1);
  return row ? toBookingDetail(row) : null;
}

export async function updateAdminBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<AdminBookingDetail | null> {
  const [row] = await db
    .update(tableBookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(tableBookings.id, id))
    .returning();
  return row ? toBookingDetail(row) : null;
}

export { validateAdminBookingStatusInput };

/* ─────────────── Menu ─────────────── */

function toCategory(row: MenuCategory): AdminMenuCategory {
  return {
    id: row.id,
    name: row.name,
    displayOrder: row.displayOrder,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

function toItem(row: MenuItem): AdminMenuItem {
  return {
    id: row.id,
    categoryId: row.categoryId ?? null,
    name: row.name,
    description: row.description ?? null,
    pricePence: row.pricePence,
    imageUrl: row.imageUrl ?? null,
    available: row.available,
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAdminMenu(): Promise<AdminMenuPayload> {
  const cats = await db
    .select()
    .from(menuCategories)
    .orderBy(asc(menuCategories.displayOrder), asc(menuCategories.name));
  const items = await db
    .select()
    .from(menuItems)
    .orderBy(asc(menuItems.name));
  return {
    categories: cats.map(toCategory),
    items: items.map(toItem),
  };
}

export async function createAdminMenuCategory(
  input: CreateMenuCategoryInput,
): Promise<AdminMenuCategory> {
  const [row] = await db
    .insert(menuCategories)
    .values({
      name: input.name,
      displayOrder: input.displayOrder,
      active: input.active,
    })
    .returning();
  if (!row) throw new Error("Failed to create category.");
  return toCategory(row);
}

export async function updateAdminMenuCategory(
  id: string,
  input: UpdateMenuCategoryInput,
): Promise<AdminMenuCategory | null> {
  const set: Partial<typeof menuCategories.$inferInsert> = {};
  if (typeof input.name === "string") set.name = input.name;
  if (typeof input.displayOrder === "number") set.displayOrder = input.displayOrder;
  if (typeof input.active === "boolean") set.active = input.active;
  if (Object.keys(set).length === 0) {
    const [existing] = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.id, id))
      .limit(1);
    return existing ? toCategory(existing) : null;
  }
  const [row] = await db
    .update(menuCategories)
    .set(set)
    .where(eq(menuCategories.id, id))
    .returning();
  return row ? toCategory(row) : null;
}

export async function createAdminMenuItem(
  input: CreateMenuItemInput,
): Promise<AdminMenuItem> {
  const row = await createMenuItemQuery(input);
  return toItem(row);
}

export async function updateAdminMenuItem(
  id: string,
  input: UpdateMenuItemInput,
): Promise<AdminMenuItem | null> {
  const row = await updateMenuItemQuery(id, input);
  return row ? toItem(row) : null;
}

export async function deleteAdminMenuItem(id: string): Promise<boolean> {
  return deleteMenuItemQuery(id);
}

export { validateCreateMenuItemInput, validateUpdateMenuItemInput };

/* ─────────────── Settings ─────────────── */

const SETTINGS_KEYS = {
  acceptingOnlineOrders: "accepting_online_orders",
  collectionOpen: "collection_open",
  deliveryOpen: "delivery_open",
  busyMode: "busy_mode",
  minDeliveryOrderPence: "min_delivery_order_pence",
  deliveryFeePence: "delivery_fee_pence",
  prepTimeMinutes: "prep_time_minutes",
  deliveryTimeMinutes: "delivery_time_minutes",
  customerMessage: "customer_message",
  depositEnabled: "deposit_enabled",
  depositAmountPence: "deposit_amount_pence",
  openingHours: "opening_hours",
} as const;

type SettingsKey = keyof typeof SETTINGS_KEYS;
type StoredKey = (typeof SETTINGS_KEYS)[SettingsKey];

const ALL_KEYS: StoredKey[] = Object.values(SETTINGS_KEYS);

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function asBusyMode(value: unknown): "normal" | "busy" | "very_busy" {
  return value === "busy" || value === "very_busy" ? value : "normal";
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asOpeningHours(value: unknown): OpeningHours {
  return coerceOpeningHours(value);
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, ALL_KEYS));
  const map = new Map<string, unknown>();
  for (const r of rows) map.set(r.key, r.value);
  return {
    acceptingOnlineOrders: asBool(map.get(SETTINGS_KEYS.acceptingOnlineOrders), true),
    collectionOpen: asBool(map.get(SETTINGS_KEYS.collectionOpen), true),
    deliveryOpen: asBool(map.get(SETTINGS_KEYS.deliveryOpen), true),
    busyMode: asBusyMode(map.get(SETTINGS_KEYS.busyMode)),
    minDeliveryOrderPence: asNumber(map.get(SETTINGS_KEYS.minDeliveryOrderPence), 1000),
    deliveryFeePence: asNumber(map.get(SETTINGS_KEYS.deliveryFeePence), 250),
    prepTimeMinutes: asNumber(map.get(SETTINGS_KEYS.prepTimeMinutes), 25),
    deliveryTimeMinutes: asNumber(map.get(SETTINGS_KEYS.deliveryTimeMinutes), 45),
    customerMessage: asString(map.get(SETTINGS_KEYS.customerMessage)),
    depositEnabled: asBool(map.get(SETTINGS_KEYS.depositEnabled), false),
    depositAmountPence: asNumber(map.get(SETTINGS_KEYS.depositAmountPence), 0),
    openingHours: asOpeningHours(map.get(SETTINGS_KEYS.openingHours)),
  };
}

async function upsertSetting(key: string, value: unknown): Promise<void> {
  const existing = await db
    .select({ key: settings.key })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(settings).values({ key, value });
  } else {
    await db
      .update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, key));
  }
}

export async function updateAdminSettings(
  input: AdminSettingsUpdateInput,
): Promise<AdminSettings> {
  if (typeof input.acceptingOnlineOrders === "boolean")
    await upsertSetting(SETTINGS_KEYS.acceptingOnlineOrders, input.acceptingOnlineOrders);
  if (typeof input.collectionOpen === "boolean")
    await upsertSetting(SETTINGS_KEYS.collectionOpen, input.collectionOpen);
  if (typeof input.deliveryOpen === "boolean")
    await upsertSetting(SETTINGS_KEYS.deliveryOpen, input.deliveryOpen);
  if (typeof input.busyMode === "string")
    await upsertSetting(SETTINGS_KEYS.busyMode, input.busyMode);
  if (typeof input.minDeliveryOrderPence === "number")
    await upsertSetting(SETTINGS_KEYS.minDeliveryOrderPence, input.minDeliveryOrderPence);
  if (typeof input.deliveryFeePence === "number")
    await upsertSetting(SETTINGS_KEYS.deliveryFeePence, input.deliveryFeePence);
  if (typeof input.prepTimeMinutes === "number")
    await upsertSetting(SETTINGS_KEYS.prepTimeMinutes, input.prepTimeMinutes);
  if (typeof input.deliveryTimeMinutes === "number")
    await upsertSetting(SETTINGS_KEYS.deliveryTimeMinutes, input.deliveryTimeMinutes);
  if (typeof input.customerMessage === "string")
    await upsertSetting(SETTINGS_KEYS.customerMessage, input.customerMessage);
  if (typeof input.depositEnabled === "boolean")
    await upsertSetting(SETTINGS_KEYS.depositEnabled, input.depositEnabled);
  if (typeof input.depositAmountPence === "number")
    await upsertSetting(SETTINGS_KEYS.depositAmountPence, input.depositAmountPence);
  if (input.openingHours)
    await upsertSetting(SETTINGS_KEYS.openingHours, input.openingHours);

  return getAdminSettings();
}

/* ─────────────── Time slots ─────────────── */

function toSlot(row: TimeSlot): AdminTimeSlot {
  return {
    id: row.id,
    type: row.type,
    time: row.time,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAdminTimeSlots(): Promise<AdminTimeSlot[]> {
  const rows = await db
    .select()
    .from(timeSlots)
    .orderBy(asc(timeSlots.type), asc(timeSlots.time));
  return rows.map(toSlot);
}

export async function upsertAdminTimeSlot(
  input: AdminTimeSlotInput,
): Promise<AdminTimeSlot> {
  const existing = await db
    .select()
    .from(timeSlots)
    .where(and(eq(timeSlots.type, input.type), eq(timeSlots.time, input.time)))
    .limit(1);
  if (existing.length > 0) {
    const target = existing[0];
    if (!target) throw new Error("Time slot lookup race.");
    const [row] = await db
      .update(timeSlots)
      .set({ active: input.active })
      .where(eq(timeSlots.id, target.id))
      .returning();
    if (!row) throw new Error("Failed to update time slot.");
    return toSlot(row);
  }
  const [row] = await db
    .insert(timeSlots)
    .values({ type: input.type, time: input.time, active: input.active })
    .returning();
  if (!row) throw new Error("Failed to create time slot.");
  return toSlot(row);
}

export async function updateAdminTimeSlot(
  id: string,
  input: AdminUpdateTimeSlotInput,
): Promise<AdminTimeSlot | null> {
  const set: Partial<typeof timeSlots.$inferInsert> = {};
  if (typeof input.active === "boolean") set.active = input.active;
  if (typeof input.time === "string") set.time = input.time;
  if (Object.keys(set).length === 0) {
    const [existing] = await db
      .select()
      .from(timeSlots)
      .where(eq(timeSlots.id, id))
      .limit(1);
    return existing ? toSlot(existing) : null;
  }
  const [row] = await db
    .update(timeSlots)
    .set(set)
    .where(eq(timeSlots.id, id))
    .returning();
  return row ? toSlot(row) : null;
}

export async function deleteAdminTimeSlot(id: string): Promise<boolean> {
  const result = await db
    .delete(timeSlots)
    .where(eq(timeSlots.id, id))
    .returning({ id: timeSlots.id });
  return result.length > 0;
}

/* ─────────────── Tables ─────────────── */

function toTable(row: TableRow): AdminTable {
  return {
    id: row.id,
    number: row.number,
    maxCovers: row.maxCovers,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAdminTables(): Promise<AdminTable[]> {
  const rows = await db.select().from(tables).orderBy(asc(tables.number));
  return rows.map(toTable);
}

export async function updateAdminTable(
  id: string,
  input: AdminUpdateTableInput,
): Promise<AdminTable | null> {
  const set: Partial<typeof tables.$inferInsert> = {};
  if (typeof input.maxCovers === "number") set.maxCovers = input.maxCovers;
  if (typeof input.active === "boolean") set.active = input.active;
  if (Object.keys(set).length === 0) {
    const [existing] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id))
      .limit(1);
    return existing ? toTable(existing) : null;
  }
  const [row] = await db
    .update(tables)
    .set(set)
    .where(eq(tables.id, id))
    .returning();
  return row ? toTable(row) : null;
}

/* ─────────────── Images ─────────────── */

function toImage(row: ImageRow): AdminImage {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    section: row.section,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAdminImages(): Promise<AdminImage[]> {
  const rows = await db
    .select()
    .from(images)
    .orderBy(asc(images.section), asc(images.label));
  return rows.map(toImage);
}

/**
 * Public-facing fetch of images belonging to a named section (e.g. "hero",
 * "showcase", "story"). Returns an empty list on error so callers can
 * gracefully fall back to static content.
 */
export async function getImagesBySection(
  section: string,
): Promise<AdminImage[]> {
  if (!section) return [];
  try {
    const rows = await db
      .select()
      .from(images)
      .where(eq(images.section, section))
      .orderBy(asc(images.label));
    return rows.map(toImage);
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[getImagesBySection] failed:", err);
    return [];
  }
}

export async function updateAdminImage(
  id: string,
  input: AdminUpdateImageInput,
): Promise<AdminImage | null> {
  const set: Partial<typeof images.$inferInsert> = {};
  if (typeof input.label === "string") set.label = input.label;
  if (typeof input.section === "string") set.section = input.section;
  if (typeof input.url === "string") set.url = input.url;
  if (Object.keys(set).length === 0) {
    const [existing] = await db
      .select()
      .from(images)
      .where(eq(images.id, id))
      .limit(1);
    return existing ? toImage(existing) : null;
  }
  set.updatedAt = new Date();
  const [row] = await db
    .update(images)
    .set(set)
    .where(eq(images.id, id))
    .returning();
  return row ? toImage(row) : null;
}

export async function createAdminImage(
  input: AdminCreateImageInput,
): Promise<AdminImage> {
  const [row] = await db
    .insert(images)
    .values({
      label: input.label,
      section: input.section,
      url: input.url ?? "",
    })
    .returning();
  if (!row) throw new Error("Insert returned no row");
  return toImage(row);
}

export async function deleteAdminImage(id: string): Promise<boolean> {
  const result = await db
    .delete(images)
    .where(eq(images.id, id))
    .returning({ id: images.id });
  return result.length > 0;
}
