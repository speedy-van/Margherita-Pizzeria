import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  menuCategories,
  menuItems,
  type MenuItem,
} from "@/lib/db/schema";
import type {
  PublicMenuCategory,
  PublicMenuItem,
  PublicMenuResponse,
} from "@/lib/menu/types";
import type {
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from "@/lib/validations/menu";

/**
 * Drizzle-backed menu queries used by both public GET routes and admin
 * mutation routes.
 */

function safeAllergens(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim() !== "") {
      out.push(entry.trim().toLowerCase());
    }
  }
  return out;
}

function deriveDietaryTags(name: string, description: string | null): string[] {
  const haystack = `${name} ${description ?? ""}`.toLowerCase();
  const tags: string[] = [];

  if (/\bvegetarian\b/.test(haystack)) {
    tags.push("vegetarian");
  }
  if (/\bvegan\b/.test(haystack)) {
    tags.push("vegan");
  }
  if (/\bgluten[- ]free\b/.test(haystack)) {
    tags.push("gluten-free");
  }
  return tags;
}

const HIDDEN_ALLERGENS = new Set(["gluten", "milk"]);

function toPublicItem(row: MenuItem): PublicMenuItem {
  const allergens = safeAllergens(row.allergens);
  return {
    id: row.id,
    categoryId: row.categoryId ?? null,
    name: row.name,
    description: row.description ?? null,
    pricePence: row.pricePence,
    imageUrl: row.imageUrl ?? null,
    available: row.available,
    allergens: allergens.filter((a) => !HIDDEN_ALLERGENS.has(a)),
    dietaryTags: deriveDietaryTags(row.name, row.description ?? null),
  };
}

export async function getPublicMenu(): Promise<PublicMenuResponse> {
  const cats = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.active, true))
    .orderBy(asc(menuCategories.displayOrder), asc(menuCategories.name));

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.available, true))
    .orderBy(asc(menuItems.name));

  const byCategory = new Map<string, PublicMenuItem[]>();
  for (const item of items) {
    if (!item.categoryId) continue;
    const list = byCategory.get(item.categoryId);
    const publicItem = toPublicItem(item);
    if (list) {
      list.push(publicItem);
    } else {
      byCategory.set(item.categoryId, [publicItem]);
    }
  }

  const categories: PublicMenuCategory[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    displayOrder: c.displayOrder,
    active: c.active,
    items: byCategory.get(c.id) ?? [],
  }));

  return {
    categories,
    generatedAt: new Date().toISOString(),
  };
}

export async function createMenuItem(
  input: CreateMenuItemInput,
): Promise<MenuItem> {
  const [row] = await db
    .insert(menuItems)
    .values({
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      pricePence: input.pricePence,
      imageUrl: input.imageUrl,
      available: input.available,
      allergens: input.allergens,
    })
    .returning();
  if (!row) {
    throw new Error("Failed to create menu item");
  }
  return row;
}

export async function updateMenuItem(
  id: string,
  input: UpdateMenuItemInput,
): Promise<MenuItem | null> {
  const updateValues: Partial<typeof menuItems.$inferInsert> = {};
  if (input.categoryId !== undefined) updateValues.categoryId = input.categoryId;
  if (input.name !== undefined) updateValues.name = input.name;
  if (input.description !== undefined) updateValues.description = input.description;
  if (input.pricePence !== undefined) updateValues.pricePence = input.pricePence;
  if (input.imageUrl !== undefined) updateValues.imageUrl = input.imageUrl;
  if (input.available !== undefined) updateValues.available = input.available;
  if (input.allergens !== undefined) updateValues.allergens = input.allergens;

  if (Object.keys(updateValues).length === 0) {
    const [existing] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);
    return existing ?? null;
  }

  const [row] = await db
    .update(menuItems)
    .set(updateValues)
    .where(eq(menuItems.id, id))
    .returning();
  return row ?? null;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const result = await db
    .delete(menuItems)
    .where(eq(menuItems.id, id))
    .returning({ id: menuItems.id });
  return result.length > 0;
}

export async function findMenuItemByCategoryAndName(
  categoryId: string,
  name: string,
): Promise<MenuItem | null> {
  const [row] = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.categoryId, categoryId), eq(menuItems.name, name)))
    .limit(1);
  return row ?? null;
}
