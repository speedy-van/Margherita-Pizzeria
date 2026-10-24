import assert from "node:assert/strict";
import test from "node:test";
import {
  PENDING_CHECKOUT_STORAGE_KEY, cartFingerprint, clearPendingCheckout, createPendingCheckout,
  isPaidCheckout, isClosedCheckout, loadPendingCheckout, parsePendingCheckout, savePendingCheckout,
} from "./pending-checkout.ts";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const cart = [{ item: { id: firstId, pricePence: 1050 }, quantity: 2 }, { item: { id: secondId, pricePence: 300 }, quantity: 1 }];
const response = { orderId: firstId, reference: "MG-100", paymentRequired: true, checkoutUrl: "https://checkout.stripe.com/c/pay_test" };
const pending = createPendingCheckout(response, cart);

function memoryStorage() {
  const map = new Map();
  return { map, getItem: async (key) => map.get(key) ?? null, setItem: async (key, value) => { map.set(key, value); }, removeItem: async (key) => { map.delete(key); } };
}

test("cart fingerprint is order independent and sensitive to items, quantity and price", () => {
  assert.equal(cartFingerprint(cart), cartFingerprint([...cart].reverse()));
  assert.notEqual(cartFingerprint(cart), cartFingerprint([{ ...cart[0], quantity: 1 }, cart[1]]));
  assert.notEqual(cartFingerprint(cart), cartFingerprint([{ item: { ...cart[0].item, pricePence: 1100 }, quantity: 2 }, cart[1]]));
  assert.notEqual(cartFingerprint(cart), cartFingerprint([cart[0]]));
});

test("pending storage contains only resume metadata and no unknown contact fields", () => {
  const restored = parsePendingCheckout(JSON.stringify({ ...pending, customerEmail: "private@example.com", deliveryAddress: "private" }));
  assert.deepEqual(Object.keys(restored).sort(), ["version", "orderId", "reference", "checkoutUrl", "cartFingerprint"].sort());
  assert.equal(JSON.stringify(restored).includes("private"), false);
});

test("invalid saved IDs, schemes, credentials, fingerprints and versions are rejected", () => {
  for (const changed of [{ orderId: "bad" }, { checkoutUrl: "http://checkout.stripe.com" }, { checkoutUrl: "javascript:alert(1)" }, { checkoutUrl: "https://user:pass@example.com" }, { cartFingerprint: "[]" }, { cartFingerprint: "bad" }, { version: 2 }]) {
    assert.equal(parsePendingCheckout(JSON.stringify({ ...pending, ...changed })), null);
  }
  assert.equal(parsePendingCheckout("not JSON"), null);
});

test("only the same server-confirmed card order can settle the checkpoint", () => {
  for (const status of ["received", "accepted", "making", "preparing", "ready", "out_for_delivery", "delivered", "completed"]) {
    assert.equal(isPaidCheckout(pending, { id: firstId, paymentMethod: "stripe_card", status }), true);
  }
  for (const status of ["pending_payment", "cancelled", "rejected", "refunded", "unknown"]) {
    assert.equal(isPaidCheckout(pending, { id: firstId, paymentMethod: "stripe_card", status }), false);
  }
  assert.equal(isPaidCheckout(pending, { id: secondId, paymentMethod: "stripe_card", status: "received" }), false);
  assert.equal(isPaidCheckout(pending, { id: firstId, paymentMethod: "cash_on_delivery", status: "received" }), false);
});

test("saved card checkout survives app restart and unrelated settlement cannot remove it", async () => {
  const storage = memoryStorage();
  await savePendingCheckout(pending, storage);
  assert.deepEqual(await loadPendingCheckout(storage), pending);
  await clearPendingCheckout(secondId, storage);
  assert.deepEqual(await loadPendingCheckout(storage), pending);
  await clearPendingCheckout(firstId, storage);
  assert.equal(await loadPendingCheckout(storage), null);
});

test("only a matching definitively closed card order releases an unpaid checkout", () => {
  for (const status of ["cancelled", "rejected", "refunded"]) assert.equal(isClosedCheckout(pending, { id: firstId, paymentMethod: "stripe_card", status }), true);
  for (const status of ["pending_payment", "received", "expired", "unknown"]) assert.equal(isClosedCheckout(pending, { id: firstId, paymentMethod: "stripe_card", status }), false);
  assert.equal(isClosedCheckout(pending, { id: secondId, paymentMethod: "stripe_card", status: "cancelled" }), false);
  assert.equal(isClosedCheckout(pending, { id: firstId, paymentMethod: "cash_on_delivery", status: "cancelled" }), false);
});

test("queued clear cannot erase a newer order checkpoint", async () => {
  const storage = memoryStorage();
  const newer = { ...pending, orderId: secondId };
  await savePendingCheckout(pending, storage);
  await Promise.all([savePendingCheckout(newer, storage), clearPendingCheckout(firstId, storage)]);
  assert.deepEqual(await loadPendingCheckout(storage), newer);
});

test("storage failures propagate so checkout cannot silently lose a pending payment", async () => {
  const storage = memoryStorage();
  storage.setItem = async () => { throw new Error("disk unavailable"); };
  await assert.rejects(savePendingCheckout(pending, storage), /disk unavailable/);
  assert.equal(storage.map.has(PENDING_CHECKOUT_STORAGE_KEY), false);
});
