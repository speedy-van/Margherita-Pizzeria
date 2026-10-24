import type { CartLine, CreateOrderResponse, PublicOrder } from "../types";

export const PENDING_CHECKOUT_STORAGE_KEY = "@margherita/pending-checkout/v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONFIRMED_CARD_STATUSES = new Set(["received", "accepted", "making", "preparing", "ready", "out_for_delivery", "delivered", "completed"]);

export interface PendingCheckout {
  version: 1;
  orderId: string;
  reference: string;
  checkoutUrl: string;
  cartFingerprint: string;
}

export interface CheckoutStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export function cartFingerprint(cart: readonly CartLine[]): string {
  return JSON.stringify(cart.map(({ item, quantity }) => [item.id, quantity, item.pricePence])
    .sort((first, second) => String(first[0]).localeCompare(String(second[0]))));
}

function validFingerprint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 20_000) return false;
  try {
    const entries: unknown = JSON.parse(value);
    return Array.isArray(entries) && entries.length > 0 && entries.length <= 50 && entries.every((entry) =>
      Array.isArray(entry) && entry.length === 3 && typeof entry[0] === "string" && UUID.test(entry[0])
      && Number.isInteger(entry[1]) && entry[1] >= 1 && entry[1] <= 20
      && Number.isSafeInteger(entry[2]) && entry[2] >= 0 && entry[2] <= 10_000_000);
  } catch { return false; }
}

export function parsePendingCheckout(raw: string | null): PendingCheckout | null {
  if (!raw || raw.length > 25_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    if (row.version !== 1 || typeof row.orderId !== "string" || !UUID.test(row.orderId)
      || typeof row.reference !== "string" || row.reference.length > 120
      || typeof row.checkoutUrl !== "string" || row.checkoutUrl.length > 4096
      || !/^https:\/\//i.test(row.checkoutUrl) || !validFingerprint(row.cartFingerprint)) return null;
    const url = new URL(row.checkoutUrl);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;
    // Rebuild the object so no customer details or unknown storage fields survive.
    return { version: 1, orderId: row.orderId, reference: row.reference, checkoutUrl: url.toString(), cartFingerprint: row.cartFingerprint };
  } catch { return null; }
}

export function createPendingCheckout(order: CreateOrderResponse, cart: readonly CartLine[]): PendingCheckout {
  const pending = parsePendingCheckout(JSON.stringify({ version: 1, orderId: order.orderId, reference: order.reference || "", checkoutUrl: order.checkoutUrl, cartFingerprint: cartFingerprint(cart) }));
  if (!order.paymentRequired || !pending) throw new Error("Your payment link could not be saved safely. Please contact the restaurant with your order reference.");
  return pending;
}

export function isPaidCheckout(pending: PendingCheckout, order: PublicOrder): boolean {
  // Public order status advances from pending_payment only after Stripe's
  // server webhook confirms payment. Cancellation is never payment proof.
  return order.id === pending.orderId && order.paymentMethod === "stripe_card" && CONFIRMED_CARD_STATUSES.has(order.status);
}

export function isClosedCheckout(pending: PendingCheckout, order: PublicOrder): boolean {
  return order.id === pending.orderId && order.paymentMethod === "stripe_card"
    && ["cancelled", "rejected", "refunded"].includes(order.status);
}

let storageQueue: Promise<unknown> = Promise.resolve();
function serializeStorage<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.catch(() => undefined).then(operation);
  storageQueue = result;
  return result;
}

export function loadPendingCheckout(storage: CheckoutStorage): Promise<PendingCheckout | null> {
  return serializeStorage(async () => parsePendingCheckout(await storage.getItem(PENDING_CHECKOUT_STORAGE_KEY)));
}

export function savePendingCheckout(pending: PendingCheckout, storage: CheckoutStorage): Promise<void> {
  return serializeStorage(async () => {
    const checked = parsePendingCheckout(JSON.stringify(pending));
    if (!checked) throw new Error("Your payment link could not be saved safely.");
    await storage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(checked));
  });
}

export function clearPendingCheckout(expectedOrderId: string, storage: CheckoutStorage): Promise<boolean> {
  return serializeStorage(async () => {
    const current = parsePendingCheckout(await storage.getItem(PENDING_CHECKOUT_STORAGE_KEY));
    if (current?.orderId !== expectedOrderId) return false;
    await storage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
    return true;
  });
}
