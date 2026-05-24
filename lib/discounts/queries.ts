import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { discounts, type Discount } from "@/lib/db/schema";

import type {
  AdminDiscount,
  ApplyDiscountInput,
  ApplyDiscountResult,
  PublicDiscount,
} from "./types";

function toPublic(row: Discount): PublicDiscount {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description ?? null,
    type: row.type,
    value: row.value,
    minOrderPence: row.minOrderPence,
    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    active: row.active,
    appliesToDelivery: row.appliesToDelivery,
    appliesToCollection: row.appliesToCollection,
  };
}

function toAdmin(row: Discount): AdminDiscount {
  return {
    ...toPublic(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function calculateDiscountPence(
  discount: Pick<PublicDiscount, "type" | "value">,
  subtotalPence: number,
): number {
  if (subtotalPence <= 0) return 0;
  if (discount.type === "percentage") {
    const pct = Math.max(0, Math.min(100, discount.value));
    return Math.min(subtotalPence, Math.floor((subtotalPence * pct) / 100));
  }
  // fixed
  return Math.max(0, Math.min(subtotalPence, Math.floor(discount.value)));
}

/**
 * Look up a discount by case-insensitive code and validate it for the supplied
 * cart context. Returns a friendly typed result.
 */
export async function applyDiscountByCode(
  input: ApplyDiscountInput,
): Promise<ApplyDiscountResult> {
  const code = input.code.trim().toUpperCase();
  if (!code) {
    return { ok: false, code: "NOT_FOUND", message: "Enter a discount code." };
  }

  const [row] = await db
    .select()
    .from(discounts)
    .where(eq(discounts.code, code))
    .limit(1);
  if (!row) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "We don't recognise that code.",
    };
  }
  if (!row.active) {
    return {
      ok: false,
      code: "INACTIVE",
      message: "This code is no longer active.",
    };
  }
  const now = input.now ?? new Date();
  if (row.startsAt && row.startsAt.getTime() > now.getTime()) {
    return {
      ok: false,
      code: "NOT_STARTED",
      message: "This code is not active yet.",
    };
  }
  if (row.endsAt && row.endsAt.getTime() < now.getTime()) {
    return {
      ok: false,
      code: "EXPIRED",
      message: "This code has expired.",
    };
  }
  if (
    input.orderType === "delivery" ? !row.appliesToDelivery : !row.appliesToCollection
  ) {
    return {
      ok: false,
      code: "WRONG_ORDER_TYPE",
      message:
        input.orderType === "delivery"
          ? "This code doesn't apply to delivery orders."
          : "This code doesn't apply to collection orders.",
    };
  }
  if (input.subtotalPence < row.minOrderPence) {
    return {
      ok: false,
      code: "MIN_ORDER",
      message: `Minimum order for this code is £${(row.minOrderPence / 100).toFixed(2)}.`,
    };
  }
  const pub = toPublic(row);
  const discountPence = calculateDiscountPence(pub, input.subtotalPence);
  return { ok: true, discount: pub, discountPence };
}

export async function listAdminDiscounts(): Promise<AdminDiscount[]> {
  const rows = await db
    .select()
    .from(discounts)
    .orderBy(asc(discounts.code));
  return rows.map(toAdmin);
}

/**
 * Public banner discount: the most recently created currently-active discount.
 * Returns null if none.
 */
export async function getActiveBannerDiscount(): Promise<PublicDiscount | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(discounts)
    .where(
      and(
        eq(discounts.active, true),
        or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
        or(isNull(discounts.endsAt), gt(discounts.endsAt, now)),
      ),
    )
    .orderBy(asc(discounts.code))
    .limit(1);
  if (!rows[0]) return null;
  return toPublic(rows[0]);
}

export async function createDiscount(
  input: Omit<AdminDiscount, "id" | "createdAt" | "updatedAt">,
): Promise<AdminDiscount> {
  const [row] = await db
    .insert(discounts)
    .values({
      code: input.code.trim().toUpperCase(),
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      minOrderPence: input.minOrderPence,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      active: input.active,
      appliesToDelivery: input.appliesToDelivery,
      appliesToCollection: input.appliesToCollection,
    })
    .returning();
  if (!row) throw new Error("Failed to create discount.");
  return toAdmin(row);
}

export async function updateDiscount(
  id: string,
  input: Partial<Omit<AdminDiscount, "id" | "createdAt" | "updatedAt">>,
): Promise<AdminDiscount | null> {
  const set: Partial<typeof discounts.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (typeof input.code === "string") set.code = input.code.trim().toUpperCase();
  if (typeof input.title === "string") set.title = input.title;
  if (typeof input.description === "string" || input.description === null)
    set.description = input.description;
  if (input.type) set.type = input.type;
  if (typeof input.value === "number") set.value = input.value;
  if (typeof input.minOrderPence === "number") set.minOrderPence = input.minOrderPence;
  if (typeof input.active === "boolean") set.active = input.active;
  if (typeof input.appliesToDelivery === "boolean")
    set.appliesToDelivery = input.appliesToDelivery;
  if (typeof input.appliesToCollection === "boolean")
    set.appliesToCollection = input.appliesToCollection;
  if (input.startsAt !== undefined)
    set.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  if (input.endsAt !== undefined)
    set.endsAt = input.endsAt ? new Date(input.endsAt) : null;

  const [row] = await db
    .update(discounts)
    .set(set)
    .where(eq(discounts.id, id))
    .returning();
  return row ? toAdmin(row) : null;
}

export async function deleteDiscount(id: string): Promise<boolean> {
  const result = await db
    .delete(discounts)
    .where(eq(discounts.id, id))
    .returning({ id: discounts.id });
  return result.length > 0;
}

export async function getDiscountById(id: string): Promise<AdminDiscount | null> {
  const [row] = await db
    .select()
    .from(discounts)
    .where(eq(discounts.id, id))
    .limit(1);
  return row ? toAdmin(row) : null;
}
