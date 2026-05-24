import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { OrderItemSnapshot } from "@/types/database";

/* ─────────────────────────── Enums ─────────────────────────── */

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);

export const orderTypeEnum = pgEnum("order_type", ["delivery", "collection"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "received",
  "making",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe_card",
  "cash_on_delivery",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
]);

export const slotTypeEnum = pgEnum("slot_type", ["collection", "booking"]);

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const adminDevicePlatformEnum = pgEnum("admin_device_platform", [
  "android",
  "ios",
  "web",
]);

/* ─────────────────────────── Users ─────────────────────────── */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: userRoleEnum("role").notNull().default("staff"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPw: text("hashed_pw"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Menu ─────────────────────────── */

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => menuCategories.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  pricePence: integer("price_pence").notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  allergens: jsonb("allergens")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Orders ─────────────────────────── */

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 16 }).unique(),
  type: orderTypeEnum("type").notNull(),
  status: orderStatusEnum("status").notNull().default("received"),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
  address: text("address"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  items: jsonb("items").$type<OrderItemSnapshot[]>().notNull(),
  subtotalPence: integer("subtotal_pence").notNull(),
  deliveryFeePence: integer("delivery_fee_pence").notNull().default(0),
  discountCode: varchar("discount_code", { length: 40 }),
  discountPence: integer("discount_pence").notNull().default(0),
  totalPence: integer("total_pence").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  stripeSessionId: text("stripe_session_id").unique(),
  estimatedTime: text("estimated_time"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderTracking = pgTable("order_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  driverLat: numeric("driver_lat", { precision: 10, scale: 7 }).notNull(),
  driverLng: numeric("driver_lng", { precision: 10, scale: 7 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Tables & Bookings ─────────────────────────── */

export const tables = pgTable("tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("number").notNull().unique(),
  maxCovers: integer("max_covers").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tableBookings = pgTable("table_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 16 }).unique(),
  tableId: uuid("table_id").references(() => tables.id, {
    onDelete: "set null",
  }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  timeSlot: varchar("time_slot", { length: 5 }).notNull(), // HH:mm
  covers: integer("covers").notNull(),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  status: bookingStatusEnum("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Time slots ─────────────────────────── */

export const timeSlots = pgTable(
  "time_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: slotTypeEnum("type").notNull(),
    time: varchar("time", { length: 5 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    typeTimeIdx: uniqueIndex("time_slots_type_time_idx").on(
      table.type,
      table.time,
    ),
  }),
);

/* ─────────────────────────── Settings ─────────────────────────── */

export const settings = pgTable("settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Images ─────────────────────────── */

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 120 }).notNull(),
  url: text("url").notNull(),
  section: varchar("section", { length: 80 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── FCM tokens ─────────────────────────── */

export const fcmTokens = pgTable("fcm_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  deviceId: varchar("device_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Admin devices (per-user FCM) ─────────────────────────── */

export const adminDevices = pgTable("admin_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fcmToken: text("fcm_token").notNull().unique(),
  platform: adminDevicePlatformEnum("platform").notNull().default("android"),
  deviceLabel: varchar("device_label", { length: 160 }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Discounts ─────────────────────────── */

export const discounts = pgTable("discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  type: discountTypeEnum("type").notNull(),
  // For percentage: 1..100. For fixed: pence (integer).
  value: integer("value").notNull(),
  minOrderPence: integer("min_order_pence").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  appliesToDelivery: boolean("applies_to_delivery").notNull().default(true),
  appliesToCollection: boolean("applies_to_collection").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Password reset tokens ─────────────────────────── */

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ─────────────────────────── Inferred types ─────────────────────────── */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderTracking = typeof orderTracking.$inferSelect;
export type NewOrderTracking = typeof orderTracking.$inferInsert;

export type TableRow = typeof tables.$inferSelect;
export type NewTableRow = typeof tables.$inferInsert;

export type TableBooking = typeof tableBookings.$inferSelect;
export type NewTableBooking = typeof tableBookings.$inferInsert;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type NewTimeSlot = typeof timeSlots.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type ImageRow = typeof images.$inferSelect;
export type NewImageRow = typeof images.$inferInsert;

export type FcmToken = typeof fcmTokens.$inferSelect;
export type NewFcmToken = typeof fcmTokens.$inferInsert;

export type AdminDevice = typeof adminDevices.$inferSelect;
export type NewAdminDevice = typeof adminDevices.$inferInsert;

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export type { OrderItemSnapshot } from "@/types/database";
