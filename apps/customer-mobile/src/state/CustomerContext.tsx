import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { getJson } from "../api";
import {
  canOrder,
  cartSubtotal,
  closeOrdering,
  CUSTOMER_STORAGE_KEY,
  DEFAULT_SETTINGS,
  EMPTY_MENU,
  isLiveSettingsPayload,
  isRecord,
  normalizeMenu,
  normalizeSettings,
  readSavedCustomerState,
  reconcileCart,
  serializeCustomerState,
  setCartItemQuantity,
  validOrderId,
  type AppMenu,
} from "../lib/customer-data";
import type { CartLine, CustomerSettings, MenuCategory, MenuItem } from "../types";

export type CustomerRoute = "home" | "menu" | "cart" | "checkout" | "book" | "track";

export interface CustomerAppState {
  route: CustomerRoute;
  navigate: (route: CustomerRoute) => void;
  settings: CustomerSettings;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  cart: CartLine[];
  subtotalPence: number;
  cartQuantity: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (item: MenuItem, quantity?: number) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  lastOrderId: string | null;
  rememberOrder: (orderId: string) => void;
}

const CustomerContext = createContext<CustomerAppState | null>(null);

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<CustomerRoute>("home");
  const [settings, setSettings] = useState<CustomerSettings>(DEFAULT_SETTINGS);
  const [menu, setMenu] = useState<AppMenu>(EMPTY_MENU);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const mounted = useRef(false);
  const lifecycle = useRef(0);
  const requestId = useRef(0);
  const loadedOnce = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const storageUsable = useRef(false);
  const storageError = useRef<string | null>(null);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());

  const refresh = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    requestController.current = controller;
    if (mounted.current) {
      if (loadedOnce.current) setRefreshing(true);
      else setLoading(true);
      setError(storageError.current);
    }
    const run = async () => {
      const [menuResult, settingsResult] = await Promise.allSettled([
        getJson<unknown>("/api/menu", { signal: controller.signal }),
        getJson<unknown>("/api/customer/settings", { signal: controller.signal }),
      ]);
      if (!mounted.current || currentRequest !== requestId.current) return;
      const errors: string[] = [];
      let menuVerified = false;
      if (menuResult.status === "fulfilled" && isRecord(menuResult.value) && Array.isArray(menuResult.value.categories)) {
        const nextMenu = normalizeMenu(menuResult.value);
        setMenu(nextMenu);
        setCart((current) => reconcileCart(current, nextMenu.items));
        menuVerified = nextMenu.categories.length > 0 && nextMenu.items.some((item) => item.available);
        if (!menuVerified) errors.push("The live menu is unavailable. Please refresh or call the restaurant.");
      } else {
        errors.push(menuResult.status === "rejected"
          ? errorMessage(menuResult.reason, "The live menu could not be loaded.")
          : "The live menu could not be read. Please refresh.");
      }
      if (settingsResult.status === "fulfilled" && isLiveSettingsPayload(settingsResult.value)) {
        const nextSettings = normalizeSettings(settingsResult.value);
        setSettings(menuVerified ? nextSettings : closeOrdering(nextSettings));
      } else {
        const message = settingsResult.status === "rejected"
          ? errorMessage(settingsResult.reason, "Live opening times could not be checked.")
          : "Live opening times could not be checked. Please refresh or call the restaurant.";
        errors.push(message);
        setSettings((current) => closeOrdering(current, message));
      }
      if (storageError.current) errors.push(storageError.current);
      setError(Array.from(new Set(errors)).join(" ") || null);
    };
    const promise = run().catch((reason: unknown) => {
      if (!mounted.current || currentRequest !== requestId.current) return;
      const message = errorMessage(reason, "Margherita could not be reached. Please refresh.");
      setError(message);
      setSettings((current) => closeOrdering(current, message));
    }).finally(() => {
      if (currentRequest !== requestId.current) return;
      inFlight.current = null;
      requestController.current = null;
      loadedOnce.current = true;
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    });
    inFlight.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    mounted.current = true;
    const generation = ++lifecycle.current;
    const initialize = async () => {
      try {
        const raw = await AsyncStorage.getItem(CUSTOMER_STORAGE_KEY);
        if (!mounted.current || lifecycle.current !== generation) return;
        const saved = readSavedCustomerState(raw);
        setCart(saved.cart);
        setLastOrderId(saved.lastOrderId);
        storageUsable.current = true;
      } catch {
        if (!mounted.current || lifecycle.current !== generation) return;
        storageError.current = "Your saved bag could not be restored on this device.";
        setError(storageError.current);
      }
      if (!mounted.current || lifecycle.current !== generation) return;
      setHydrated(true);
      await refresh();
    };
    void initialize();
    return () => {
      mounted.current = false;
      lifecycle.current++;
      requestId.current++;
      requestController.current?.abort();
      requestController.current = null;
      inFlight.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    if (!hydrated || !storageUsable.current) return;
    const snapshot = serializeCustomerState({ cart, lastOrderId });
    // Serialize writes so an older basket cannot win a slower storage race.
    storageQueue.current = storageQueue.current.catch(() => undefined)
      .then(() => AsyncStorage.setItem(CUSTOMER_STORAGE_KEY, snapshot))
      .catch(() => {
        storageError.current = "Your bag could not be saved on this device.";
        if (mounted.current) setError((current) => current || storageError.current);
      });
  }, [cart, lastOrderId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active" || AppState.currentState == null) void refresh();
    }, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [hydrated, refresh]);

  const navigate = useCallback((nextRoute: CustomerRoute) => setRoute(nextRoute), []);
  const addItem = useCallback((item: MenuItem, quantity = 1) => {
    if (loading || !canOrder(settings) || !Number.isInteger(quantity) || quantity < 1) return;
    const liveItem = menu.items.find((candidate) => candidate.id === item.id);
    if (!liveItem?.available) return;
    setCart((current) => {
      const existing = current.find((line) => line.item.id === liveItem.id)?.quantity ?? 0;
      return setCartItemQuantity(current, liveItem, existing + quantity);
    });
  }, [loading, settings, menu.items]);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 0) return;
    setCart((current) => {
      const existing = current.find((line) => line.item.id === menuItemId);
      if (!existing) return current;
      if (quantity > existing.quantity && (loading || !canOrder(settings))) return current;
      const item = menu.items.find((candidate) => candidate.id === menuItemId) ?? existing.item;
      return setCartItemQuantity(current, item, quantity);
    });
  }, [loading, settings, menu.items]);

  const removeItem = useCallback((menuItemId: string) => {
    setCart((current) => current.filter((line) => line.item.id !== menuItemId));
  }, []);
  const clearCart = useCallback(() => setCart([]), []);
  const rememberOrder = useCallback((orderId: string) => {
    const id = orderId.trim();
    if (validOrderId(id)) setLastOrderId(id);
  }, []);

  const value = useMemo<CustomerAppState>(() => ({
    route, navigate, settings, categories: menu.categories, menuItems: menu.items,
    cart, subtotalPence: cartSubtotal(cart), cartQuantity: cart.reduce((sum, line) => sum + line.quantity, 0),
    loading, refreshing, error, refresh, addItem, setQuantity, removeItem, clearCart,
    lastOrderId, rememberOrder,
  }), [route, navigate, settings, menu, cart, loading, refreshing, error, refresh, addItem, setQuantity, removeItem, clearCart, lastOrderId, rememberOrder]);

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomerApp(): CustomerAppState {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomerApp must be used inside CustomerProvider.");
  return context;
}
