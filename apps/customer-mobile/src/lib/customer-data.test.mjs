import assert from "node:assert/strict";
import test from "node:test";

import {
  canOrder,
  cartSubtotal,
  closeOrdering,
  DEFAULT_SETTINGS,
  isLiveSettingsPayload,
  normalizeMenu,
  normalizePromotion,
  normalizeSettings,
  readSavedCustomerState,
  reconcileCart,
  serializeCustomerState,
  setCartItemQuantity,
  todayIso,
} from "./customer-data.ts";

const pizza = {
  id: "pizza-1", categoryId: "classics", name: 'Margherita (12")', description: "Fresh mozzarella",
  pricePence: 968, imageUrl: "/legacy/margherita-real.jpg", available: true, allergens: [], dietaryTags: ["vegetarian"],
};
const drink = { ...pizza, id: "drink-1", categoryId: "drinks", name: "Can", pricePence: 176 };
const openSettings = {
  ...DEFAULT_SETTINGS,
  ordering: { ...DEFAULT_SETTINGS.ordering, acceptingOnlineOrders: true, collectionOpen: true, deliveryOpen: true },
  shopStatus: { ...DEFAULT_SETTINGS.shopStatus, isOpen: true, closesAt: "00:00", message: "Open now" },
};
const promotion = {
  id: "promo-1", code: "PIZZA15", title: "15% off all pizzas", description: null, type: "percentage", value: 15,
  minOrderPence: 0, startsAt: "2026-10-24T00:00:00.000Z", endsAt: "2026-11-24T00:00:00.000Z",
  active: true, appliesToDelivery: true, appliesToCollection: true,
};

test("nested menu assigns category IDs and filters inactive categories and malformed prices", () => {
  const menu = normalizeMenu({ categories: [
    { id: "classics", name: "The Classics", active: true, displayOrder: 20, items: [
      { ...pizza, categoryId: undefined },
      { ...pizza, id: "bad-price", pricePence: -1 },
      { ...pizza, id: "fractional-price", pricePence: 967.5 },
      null,
    ] },
    { id: "drinks", name: "Drinks", active: false, items: [drink] },
  ] });
  assert.equal(menu.categories.length, 1);
  assert.equal(menu.items.length, 1);
  assert.equal(menu.items[0]?.categoryId, "classics");
  assert.equal(menu.categories[0]?.items?.[0]?.name, pizza.name);
  assert.deepEqual(normalizeMenu(null), { categories: [], items: [] });
});

test("flat menu items override older nested snapshots once without orphaned dishes", () => {
  const menu = normalizeMenu({
    categories: [
      { id: "drinks", name: "Drinks", sortOrder: 2 },
      { id: "classics", name: "The Classics", sortOrder: 1, items: [pizza] },
    ],
    items: [{ ...pizza, pricePence: 1000 }, drink, { ...pizza, id: "orphan", categoryId: "missing" }],
  });
  assert.deepEqual(menu.categories.map((category) => category.id), ["classics", "drinks"]);
  assert.equal(menu.items.length, 2);
  assert.equal(menu.items.find((item) => item.id === pizza.id)?.pricePence, 1000);
});

test("missing, incomplete and malformed settings never invent an open restaurant", () => {
  assert.equal(canOrder(DEFAULT_SETTINGS), false);
  for (const input of [null, {}, { ordering: { acceptingOnlineOrders: true }, shopStatus: { isOpen: true } },
    { ...openSettings, ordering: { ...openSettings.ordering, deliveryFeePence: -1 } },
    { ...openSettings, ordering: { ...openSettings.ordering, collectionOpen: "true" } },
  ]) {
    assert.equal(isLiveSettingsPayload(input), false);
    const settings = normalizeSettings(input);
    assert.equal(settings.shopStatus.isOpen, false);
    assert.equal(settings.ordering.acceptingOnlineOrders, false);
    assert.equal(settings.ordering.deliveryOpen, false);
    assert.equal(settings.ordering.collectionOpen, false);
  }
});

test("verified settings retain live prices and flags; network fallback closes them", () => {
  const input = { ...openSettings, ordering: { ...openSettings.ordering, deliveryFeePence: 195, minDeliveryOrderPence: 1200 } };
  assert.equal(isLiveSettingsPayload(input), true);
  const settings = normalizeSettings(input);
  assert.equal(canOrder(settings), true);
  assert.equal(settings.ordering.deliveryFeePence, 195);
  assert.equal(settings.ordering.minDeliveryOrderPence, 1200);
  const unavailable = closeOrdering(settings, "Connection unavailable");
  assert.equal(canOrder(unavailable), false);
  assert.equal(unavailable.shopStatus.message, "Connection unavailable");
  assert.equal(unavailable.pizzaPromotion, null);
  assert.equal(canOrder({ ...settings, shopStatus: { ...settings.shopStatus, isOpen: false } }), false);
});

test("campaign metadata appears only inside its valid interval and expires exactly", () => {
  const start = new Date(promotion.startsAt);
  const end = new Date(promotion.endsAt);
  assert.equal(normalizePromotion(promotion, new Date(start.getTime() - 1)), null);
  assert.equal(normalizePromotion(promotion, start)?.code, "PIZZA15");
  assert.equal(normalizePromotion(promotion, new Date(end.getTime() - 1))?.value, 15);
  assert.equal(normalizePromotion(promotion, end), null);
  assert.equal(normalizePromotion({ ...promotion, active: false }, start), null);
  assert.equal(normalizePromotion({ ...promotion, value: 101 }, start), null);
  assert.equal(normalizePromotion({ ...promotion, endsAt: "bad-date" }, start), null);
});

test("versioned storage validates every snapshot and ignores corrupted or future versions", () => {
  const state = { cart: [{ item: pizza, quantity: 2 }], lastOrderId: "order-123" };
  assert.deepEqual(readSavedCustomerState(serializeCustomerState(state)), state);
  for (const raw of [null, "not-json", "null", "[]", '{"version":2,"cart":[]}', '{"cart":[]}']) {
    assert.deepEqual(readSavedCustomerState(raw), { cart: [], lastOrderId: null });
  }
  const saved = readSavedCustomerState(JSON.stringify({ version: 1, lastOrderId: { id: "bad" }, cart: [
    { item: pizza, quantity: 12 }, { item: pizza, quantity: 15 },
    { item: drink, quantity: 0 }, { item: drink, quantity: 1.5 },
    { item: { ...drink, pricePence: "176" }, quantity: 1 }, null,
  ] }));
  assert.equal(saved.cart.length, 1);
  assert.equal(saved.cart[0]?.quantity, 20);
  assert.equal(saved.lastOrderId, null);
});

test("restored carts adopt live prices and remove unavailable or deleted menu IDs", () => {
  const saved = [{ item: pizza, quantity: 2 }, { item: drink, quantity: 1 }];
  const freshPizza = { ...pizza, name: "Updated pizza", pricePence: 1100 };
  const reconciled = reconcileCart(saved, [freshPizza, { ...drink, available: false }]);
  assert.deepEqual(reconciled, [{ item: freshPizza, quantity: 2 }]);
  assert.equal(cartSubtotal(reconciled), 2200);
  assert.deepEqual(reconcileCart(saved, []), []);
});

test("cart quantity operations clamp to server limits and remove at zero", () => {
  const one = setCartItemQuantity([], pizza, 2);
  assert.equal(cartSubtotal(one), 1936);
  assert.equal(setCartItemQuantity(one, pizza, 99)[0]?.quantity, 20);
  assert.deepEqual(setCartItemQuantity(one, pizza, 0), []);
  assert.deepEqual(setCartItemQuantity(one, pizza, Number.NaN), one);
  assert.deepEqual(setCartItemQuantity(one, { ...drink, available: false }, 1), one);
  const full = Array.from({ length: 50 }, (_, index) => ({ item: { ...pizza, id: `item-${index}` }, quantity: 1 }));
  assert.equal(setCartItemQuantity(full, drink, 1).length, 50);
});

test("booking calendar dates follow Glasgow across midnight and month boundaries", () => {
  assert.equal(todayIso(0, new Date("2026-06-30T23:30:00Z")), "2026-07-01");
  assert.equal(todayIso(1, new Date("2026-10-31T23:30:00Z")), "2026-11-01");
  assert.equal(todayIso(0, new Date("2026-10-31T23:30:00Z")), "2026-10-31");
});
