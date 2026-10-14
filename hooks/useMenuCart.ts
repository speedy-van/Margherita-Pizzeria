"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CART_LIMITS,
  type AddToCartInput,
  type CartItem,
  type CartState,
  type PublicMenuItem,
} from "@/lib/menu/types";

const STORAGE_KEY = "margherita-menu-cart-v1";

interface UseMenuCartReturn {
  items: CartItem[];
  addItem: (input: AddToCartInput, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  increase: (menuItemId: string) => void;
  decrease: (menuItemId: string) => void;
  clear: () => void;
  reconcileWithMenu: (menuItems: PublicMenuItem[]) => void;
  totalQuantity: number;
  subtotalPence: number;
  isHydrated: boolean;
}

function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return CART_LIMITS.minPerItem;
  const rounded = Math.trunc(q);
  if (rounded < CART_LIMITS.minPerItem) return CART_LIMITS.minPerItem;
  if (rounded > CART_LIMITS.maxPerItem) return CART_LIMITS.maxPerItem;
  return rounded;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((entry) => typeof entry === "string");
}

function sanitizeItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.menuItemId !== "string" ||
    typeof r.name !== "string" ||
    typeof r.quantity !== "number" ||
    typeof r.unitPricePence !== "number" ||
    typeof r.totalPence !== "number"
  ) {
    return null;
  }
  if (
    !Number.isInteger(r.unitPricePence) ||
    r.unitPricePence <= 0 ||
    r.unitPricePence > 100000
  ) {
    return null;
  }
  const allergens = isStringArray(r.allergens) ? r.allergens : [];
  const imageUrl = typeof r.imageUrl === "string" ? r.imageUrl : null;
  const quantity = clampQuantity(r.quantity);
  return {
    menuItemId: r.menuItemId,
    name: r.name,
    quantity,
    unitPricePence: Math.trunc(r.unitPricePence),
    totalPence: Math.trunc(r.unitPricePence) * quantity,
    allergens,
    imageUrl,
  };
}

function readFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return [];
    const state = parsed as Partial<CartState>;
    if (!Array.isArray(state.items)) return [];
    const out: CartItem[] = [];
    for (const entry of state.items) {
      const sane = sanitizeItem(entry);
      if (sane) out.push(sane);
    }
    return out;
  } catch {
    return [];
  }
}

function writeToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CartState = { items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private-mode failures are non-fatal.
  }
}

export function useMenuCart(): UseMenuCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const initial = readFromStorage();
    setItems(initial);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only persist after hydration has completed AND a render has run with
    // the loaded state. Using the `isHydrated` state (captured per-render)
    // instead of a ref prevents a spurious write of the initial empty array
    // that would otherwise wipe localStorage — most visibly under React
    // StrictMode's fake-mount/unmount cycle in development, which would
    // leave the next route (e.g. /order) seeing an empty cart.
    if (!isHydrated) return;
    writeToStorage(items);
  }, [items, isHydrated]);

  const addItem = useCallback(
    (input: AddToCartInput, quantity: number = 1) => {
      const qty = clampQuantity(quantity);
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.menuItemId === input.menuItemId);
        if (idx >= 0) {
          const existing = prev[idx];
          if (!existing) return prev;
          const newQty = clampQuantity(existing.quantity + qty);
          const next = prev.slice();
          next[idx] = {
            ...existing,
            quantity: newQty,
            totalPence: existing.unitPricePence * newQty,
          };
          return next;
        }
        return [
          ...prev,
          {
            menuItemId: input.menuItemId,
            name: input.name,
            quantity: qty,
            unitPricePence: input.unitPricePence,
            totalPence: input.unitPricePence * qty,
            allergens: input.allergens,
            imageUrl: input.imageUrl,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const increase = useCallback((menuItemId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.menuItemId !== menuItemId) return i;
        const newQty = clampQuantity(i.quantity + 1);
        return { ...i, quantity: newQty, totalPence: i.unitPricePence * newQty };
      }),
    );
  }, []);

  const decrease = useCallback((menuItemId: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.menuItemId === menuItemId);
      if (idx < 0) return prev;
      const existing = prev[idx];
      if (!existing) return prev;
      if (existing.quantity <= CART_LIMITS.minPerItem) {
        return prev.filter((i) => i.menuItemId !== menuItemId);
      }
      const newQty = existing.quantity - 1;
      const next = prev.slice();
      next[idx] = {
        ...existing,
        quantity: newQty,
        totalPence: existing.unitPricePence * newQty,
      };
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const reconcileWithMenu = useCallback((menuItems: PublicMenuItem[]) => {
    if (!menuItems.length) return;
    const liveById = new Map(menuItems.map((item) => [item.id, item]));
    setItems((prev) => {
      let changed = false;
      const next: CartItem[] = [];
      for (const item of prev) {
        const live = liveById.get(item.menuItemId);
        if (!live || !live.available) {
          changed = true;
          continue;
        }
        const reconciled: CartItem = {
          menuItemId: live.id,
          name: live.name,
          quantity: item.quantity,
          unitPricePence: live.pricePence,
          totalPence: live.pricePence * item.quantity,
          allergens: live.allergens,
          imageUrl: live.imageUrl,
        };
        if (
          item.name !== reconciled.name ||
          item.unitPricePence !== reconciled.unitPricePence ||
          item.totalPence !== reconciled.totalPence ||
          item.imageUrl !== reconciled.imageUrl
        ) {
          changed = true;
        }
        next.push(reconciled);
      }
      return changed ? next : prev;
    });
  }, []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );
  const subtotalPence = useMemo(
    () => items.reduce((sum, i) => sum + i.totalPence, 0),
    [items],
  );

  return {
    items,
    addItem,
    removeItem,
    increase,
    decrease,
    clear,
    reconcileWithMenu,
    totalQuantity,
    subtotalPence,
    isHydrated,
  };
}
