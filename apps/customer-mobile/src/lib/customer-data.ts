import type { CartLine, CustomerSettings, MenuCategory, MenuItem, PublicPromotion } from "../types";

export interface AppMenu {
  categories: MenuCategory[];
  items: MenuItem[];
}

export const MAX_CART_QUANTITY = 20;
export const MAX_CART_LINES = 50;
export const CUSTOMER_STORAGE_KEY = "@margherita/customer-state/v1";
export const CUSTOMER_STATE_VERSION = 1;

/** Contact information is safe to show offline; ordering always starts closed. */
export const DEFAULT_SETTINGS: CustomerSettings = {
  restaurant: {
    name: "Margherita Pizzeria Glasgow",
    shortName: "Margherita",
    tagline: "Sourdough. Hand-stretched. Stone oven.",
    phone: "+44 7746 870341",
    phoneTel: "+447746870341",
    whatsappUrl: "https://wa.me/447746870341",
    email: "hello@margheritapizzeria.co.uk",
    address: "652 Alexandra Parade, Dennistoun, Glasgow, G31 3BU",
    postcode: "G31 3BU",
    latitude: 55.8629933,
    longitude: -4.2115166,
    rating: 5,
    reviewCount: 113,
    tablesCount: 6,
  },
  ordering: {
    acceptingOnlineOrders: false,
    collectionOpen: false,
    deliveryOpen: false,
    busyMode: "normal",
    minDeliveryOrderPence: 1000,
    deliveryFeePence: 449,
    prepTimeMinutes: 25,
    deliveryTimeMinutes: 45,
    deliveryRadiusMiles: 4,
    currency: "GBP",
    locale: "en-GB",
  },
  shopStatus: {
    isOpen: false,
    closesAt: null,
    opensAt: null,
    opensDayLabel: null,
    message: "Checking live opening times…",
  },
  openingHours: {},
  pizzaPromotion: null,
};

export const EMPTY_MENU: AppMenu = { categories: [], items: [] };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value);
}

function validPence(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 10_000_000;
}

function positiveNumber(value: unknown, fallback: number, maximum = 1440): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= maximum ? value : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim().slice(0, 80)).filter(Boolean))).slice(0, 30)
    : [];
}

function imagePath(value: unknown): string | null {
  const path = safeString(value);
  if (!path || path.length > 2048) return null;
  return /^https?:\/\//i.test(path) || (path.startsWith("/") && !path.startsWith("//")) ? path : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeMenuItem(value: unknown, fallbackCategoryId?: string): MenuItem | null {
  if (!isRecord(value) || !validIdentifier(value.id) || !validPence(value.pricePence)) return null;
  const name = safeString(value.name).slice(0, 160);
  if (!name) return null;
  return {
    id: value.id,
    categoryId: validIdentifier(value.categoryId) ? value.categoryId : fallbackCategoryId ?? null,
    name,
    description: nullableString(value.description)?.slice(0, 4000) ?? null,
    pricePence: value.pricePence,
    imageUrl: imagePath(value.imageUrl),
    available: value.available === true,
    allergens: stringList(value.allergens),
    dietaryTags: stringList(value.dietaryTags),
  };
}

/** Supports the current nested API and the earlier flat items payload. */
export function normalizeMenu(data: unknown): AppMenu {
  if (!isRecord(data) || !Array.isArray(data.categories)) return EMPTY_MENU;
  const categoriesById = new Map<string, MenuCategory>();
  const itemsById = new Map<string, MenuItem>();
  for (const value of data.categories) {
    if (!isRecord(value) || !validIdentifier(value.id) || !safeString(value.name)) continue;
    const available = (value.active === undefined || value.active === true)
      && (value.available === undefined || value.available === true);
    if (!available || categoriesById.has(value.id)) continue;
    const order = safeNumber(value.displayOrder, safeNumber(value.sortOrder, 0));
    categoriesById.set(value.id, {
      id: value.id,
      name: safeString(value.name).slice(0, 120),
      description: nullableString(value.description),
      imageUrl: imagePath(value.imageUrl),
      sortOrder: order,
      displayOrder: order,
      available: true,
      active: true,
    });
    if (Array.isArray(value.items)) {
      for (const rawItem of value.items) {
        const item = normalizeMenuItem(rawItem, value.id);
        if (item) itemsById.set(item.id, item);
      }
    }
  }
  if (Array.isArray(data.items)) {
    for (const value of data.items) {
      const item = normalizeMenuItem(value);
      if (item) itemsById.set(item.id, item);
    }
  }
  const items = Array.from(itemsById.values()).filter((item) =>
    item.categoryId !== null && categoriesById.has(item.categoryId),
  );
  const categories = Array.from(categoriesById.values())
    .sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0))
    .map((category) => ({ ...category, items: items.filter((item) => item.categoryId === category.id) }));
  return { categories, items };
}

export function isLiveSettingsPayload(data: unknown): boolean {
  if (!isRecord(data) || !isRecord(data.ordering) || !isRecord(data.shopStatus)) return false;
  const ordering = data.ordering;
  return typeof ordering.acceptingOnlineOrders === "boolean"
    && typeof ordering.collectionOpen === "boolean"
    && typeof ordering.deliveryOpen === "boolean"
    && typeof data.shopStatus.isOpen === "boolean"
    && validPence(ordering.deliveryFeePence)
    && validPence(ordering.minDeliveryOrderPence)
    && positiveNumber(ordering.prepTimeMinutes, -1) !== -1
    && positiveNumber(ordering.deliveryTimeMinutes, -1) !== -1
    && positiveNumber(ordering.deliveryRadiusMiles, -1, 100) !== -1;
}

export function normalizePromotion(value: unknown, now = new Date()): PublicPromotion | null {
  if (!isRecord(value) || !validIdentifier(value.id) || value.active !== true) return null;
  const code = safeString(value.code).toUpperCase();
  const title = safeString(value.title);
  if (!code || code.length > 40 || !title || (value.type !== "percentage" && value.type !== "fixed")) return null;
  if (!validPence(value.value) || value.value === 0 || (value.type === "percentage" && value.value > 100)) return null;
  const startsAt = nullableString(value.startsAt);
  const endsAt = nullableString(value.endsAt);
  if ((startsAt && !Number.isFinite(Date.parse(startsAt))) || (endsAt && !Number.isFinite(Date.parse(endsAt)))) return null;
  if (startsAt && Date.parse(startsAt) > now.getTime()) return null;
  if (endsAt && Date.parse(endsAt) <= now.getTime()) return null;
  return {
    id: value.id,
    code,
    title: title.slice(0, 160),
    description: nullableString(value.description),
    type: value.type,
    value: value.value,
    minOrderPence: validPence(value.minOrderPence) ? value.minOrderPence : 0,
    startsAt,
    endsAt,
    active: true,
    appliesToDelivery: value.appliesToDelivery === true,
    appliesToCollection: value.appliesToCollection === true,
  };
}

export function closeOrdering(
  settings: CustomerSettings,
  message = "Live ordering is unavailable. Refresh or call the restaurant.",
): CustomerSettings {
  return {
    ...settings,
    ordering: { ...settings.ordering, acceptingOnlineOrders: false, collectionOpen: false, deliveryOpen: false },
    shopStatus: { isOpen: false, closesAt: null, opensAt: null, opensDayLabel: null, message },
    pizzaPromotion: null,
  };
}

export function normalizeSettings(data: unknown): CustomerSettings {
  if (!isRecord(data)) return closeOrdering(DEFAULT_SETTINGS);
  const restaurant = isRecord(data.restaurant) ? data.restaurant : {};
  const ordering = isRecord(data.ordering) ? data.ordering : {};
  const status = isRecord(data.shopStatus) ? data.shopStatus : {};
  const defaults = DEFAULT_SETTINGS.restaurant;
  const settings: CustomerSettings = {
    restaurant: {
      name: safeString(restaurant.name, defaults.name),
      shortName: safeString(restaurant.shortName, defaults.shortName),
      tagline: safeString(restaurant.tagline, defaults.tagline),
      phone: safeString(restaurant.phone, defaults.phone),
      phoneTel: safeString(restaurant.phoneTel, defaults.phoneTel),
      whatsappUrl: safeString(restaurant.whatsappUrl, defaults.whatsappUrl),
      email: safeString(restaurant.email, defaults.email),
      address: safeString(restaurant.address, defaults.address),
      postcode: safeString(restaurant.postcode, defaults.postcode),
      latitude: Math.max(-90, Math.min(90, safeNumber(restaurant.latitude, defaults.latitude))),
      longitude: Math.max(-180, Math.min(180, safeNumber(restaurant.longitude, defaults.longitude))),
      rating: Math.max(0, Math.min(5, safeNumber(restaurant.rating, defaults.rating))),
      reviewCount: Math.max(0, Math.trunc(safeNumber(restaurant.reviewCount, defaults.reviewCount))),
      tablesCount: Math.max(0, Math.trunc(safeNumber(restaurant.tablesCount, defaults.tablesCount))),
    },
    ordering: {
      acceptingOnlineOrders: ordering.acceptingOnlineOrders === true,
      collectionOpen: ordering.collectionOpen === true,
      deliveryOpen: ordering.deliveryOpen === true,
      busyMode: ordering.busyMode === "busy" || ordering.busyMode === "very_busy" ? ordering.busyMode : "normal",
      minDeliveryOrderPence: validPence(ordering.minDeliveryOrderPence) ? ordering.minDeliveryOrderPence : DEFAULT_SETTINGS.ordering.minDeliveryOrderPence,
      deliveryFeePence: validPence(ordering.deliveryFeePence) ? ordering.deliveryFeePence : DEFAULT_SETTINGS.ordering.deliveryFeePence,
      prepTimeMinutes: positiveNumber(ordering.prepTimeMinutes, 25),
      deliveryTimeMinutes: positiveNumber(ordering.deliveryTimeMinutes, 45),
      deliveryRadiusMiles: positiveNumber(ordering.deliveryRadiusMiles, 4, 100),
      currency: "GBP",
      locale: "en-GB",
    },
    shopStatus: {
      isOpen: status.isOpen === true,
      closesAt: nullableString(status.closesAt),
      opensAt: nullableString(status.opensAt),
      opensDayLabel: nullableString(status.opensDayLabel),
      message: safeString(status.message, status.isOpen === true ? "Open now for online ordering." : "Online ordering is currently closed."),
    },
    openingHours: isRecord(data.openingHours) ? data.openingHours : {},
    pizzaPromotion: normalizePromotion(data.pizzaPromotion),
  };
  return isLiveSettingsPayload(data) ? settings : closeOrdering(settings);
}

export function canOrder(settings: CustomerSettings): boolean {
  return settings.shopStatus.isOpen && settings.ordering.acceptingOnlineOrders
    && (settings.ordering.collectionOpen || settings.ordering.deliveryOpen);
}

export function cartSubtotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.item.pricePence * line.quantity, 0);
}

export function reconcileCart(lines: readonly CartLine[], menuItems: readonly MenuItem[]): CartLine[] {
  const liveItems = new Map(menuItems.map((item) => [item.id, item]));
  return lines.flatMap((line) => {
    const item = liveItems.get(line.item.id);
    return item?.available ? [{ item, quantity: line.quantity }] : [];
  });
}

export function setCartItemQuantity(lines: readonly CartLine[], item: MenuItem, quantity: number): CartLine[] {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) return [...lines];
  const nextQuantity = Math.max(0, Math.min(MAX_CART_QUANTITY, quantity));
  const existing = lines.find((line) => line.item.id === item.id);
  if (nextQuantity === 0) return lines.filter((line) => line.item.id !== item.id);
  if (!item.available || (!existing && lines.length >= MAX_CART_LINES)) return [...lines];
  if (!existing) return [...lines, { item, quantity: nextQuantity }];
  return lines.map((line) => line.item.id === item.id ? { item, quantity: nextQuantity } : line);
}

export interface SavedCustomerState {
  cart: CartLine[];
  lastOrderId: string | null;
}

export function validOrderId(value: unknown): value is string {
  return validIdentifier(value);
}

export function readSavedCustomerState(raw: string | null): SavedCustomerState {
  const empty: SavedCustomerState = { cart: [], lastOrderId: null };
  if (!raw || raw.length > 1_000_000) return empty;
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; } catch { return empty; }
  if (!isRecord(parsed) || parsed.version !== CUSTOMER_STATE_VERSION || !Array.isArray(parsed.cart)) return empty;
  const lines = new Map<string, CartLine>();
  for (const value of parsed.cart.slice(0, MAX_CART_LINES)) {
    if (!isRecord(value) || typeof value.quantity !== "number" || !Number.isInteger(value.quantity)
      || value.quantity < 1 || value.quantity > MAX_CART_QUANTITY) continue;
    const item = normalizeMenuItem(value.item);
    if (!item || !item.available) continue;
    const quantity = Math.min(MAX_CART_QUANTITY, (lines.get(item.id)?.quantity ?? 0) + value.quantity);
    lines.set(item.id, { item, quantity });
  }
  return { cart: Array.from(lines.values()), lastOrderId: validOrderId(parsed.lastOrderId) ? parsed.lastOrderId : null };
}

export function serializeCustomerState(state: SavedCustomerState): string {
  return JSON.stringify({ version: CUSTOMER_STATE_VERSION, cart: state.cart, lastOrderId: state.lastOrderId });
}

export function money(pence: number): string {
  const amount = Math.max(0, Number.isFinite(pence) ? pence : 0) / 100;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function orderAttemptKey(): string {
  return `customer.${Date.now()}.${Math.random().toString(36).slice(2, 12)}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Waiting for payment", received: "Received", accepted: "Accepted",
  making: "In the kitchen", preparing: "Preparing", ready: "Ready to collect",
  out_for_delivery: "Out for delivery", delivered: "Delivered", completed: "Completed",
  cancelled: "Cancelled", rejected: "Unable to accept", refunded: "Refunded",
};

export function statusLabel(status: string | null | undefined): string {
  return status ? STATUS_LABELS[status] ?? status.replace(/_/g, " ") : "Waiting";
}

export function todayIso(offsetDays = 0, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  const offset = Number.isInteger(offsetDays) ? offsetDays : 0;
  return new Date(Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day")) + offset))
    .toISOString().slice(0, 10);
}
