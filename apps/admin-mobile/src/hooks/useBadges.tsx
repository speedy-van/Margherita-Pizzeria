import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";

import { apiCall, getToken } from "@/api/client";
import { isDemoToken } from "@/api/demo";
import type { AdminDashboardStats, AdminOrderListItem } from "@/api/types";
import { useSession } from "@/auth/SessionContext";
import { useDialog } from "@/components/dialog";
import { NewOrderAlertModal } from "@/components/NewOrderAlertModal";
import {
  armAlertSoundOnFirstGesture,
  ensureBrowserNotificationPermission,
  preloadAlertSound,
  showBrowserNotification,
  startAlertSound,
  stopAlertSound,
} from "@/hooks/alerts";
import {
  formatCurrencyGBP,
  isActiveOrder,
} from "@/lib/order-operations";
import { navigateToBooking, navigateToOrder } from "@/navigation/ref";
import {
  BADGE_POLL_INTERVAL_MS,
  nextPollDelayMs,
  retryDelayMs,
} from "./pollingPolicy";

type Badges = {
  activeOrders: number;
  pendingBookings: number;
  refresh: (options?: { force?: boolean }) => Promise<void>;
};

const BadgesContext = createContext<Badges>({
  activeOrders: 0,
  pendingBookings: 0,
  refresh: async () => undefined,
});

// Keep the existing foreground alert target, but use the lightweight badge
// view so recurring alert checks do not fetch the full dashboard payload.
const ALERTED_ORDER_IDS_KEY = "margherita-admin.alerted-order-ids.v3";
const MAX_STORED_ALERT_IDS = 120;

function isActiveAppState(state: AppStateStatus): boolean {
  return state === "active";
}

async function loadStoredOrderIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(ALERTED_ORDER_IDS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

async function persistOrderIds(ids: Set<string>): Promise<void> {
  const trimmed = Array.from(ids).slice(-MAX_STORED_ALERT_IDS);
  try {
    await AsyncStorage.setItem(ALERTED_ORDER_IDS_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore storage failures; alerts still work in memory */
  }
}

export function BadgesProvider({ children }: { children: ReactNode }): JSX.Element {
  const { status, user } = useSession();
  const dialog = useDialog();
  const [activeOrders, setActiveOrders] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [appActive, setAppActive] = useState(() =>
    isActiveAppState(AppState.currentState),
  );
  const [alertOrder, setAlertOrder] = useState<AdminOrderListItem | null>(null);
  const alertOrderRef = useRef<AdminOrderListItem | null>(null);
  const alertQueue = useRef<AdminOrderListItem[]>([]);
  const queuedOrderIds = useRef<Set<string>>(new Set());

  const inflight = useRef(false);
  const pendingRefresh = useRef(false);
  const failureCount = useRef(0);
  const nextAllowedAt = useRef(0);
  const stoppedAfterAuthFailure = useRef(false);
  const statusRef = useRef(status);
  const appActiveRef = useRef(appActive);
  const sessionKey = status === "signed-in"
    ? `${user?.id ?? "unknown"}:${getToken() ?? "dev-bypass"}`
    : "signed-out";
  const sessionKeyRef = useRef(sessionKey);
  // Track IDs we've already shown the owner. We seed these from the FIRST
  // successful poll after sign-in so existing orders/bookings don't trigger
  // a flood of "new order" alerts on launch.
  const seenOrderIds = useRef<Set<string> | null>(null);
  const seenBookingIds = useRef<Set<string> | null>(null);
  const demoAlertShown = useRef(false);

  useEffect(() => {
    alertOrderRef.current = alertOrder;
  }, [alertOrder]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      setAppActive(isActiveAppState(nextState));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    statusRef.current = status;
    appActiveRef.current = appActive;
    sessionKeyRef.current = sessionKey;
  }, [appActive, sessionKey, status]);

  const showOrderAlert = useCallback((order: AdminOrderListItem): void => {
    const notifTitle = `New ${order.type} order`;
    const notifBody = `${order.reference ?? order.id.slice(0, 8)} · ${order.customerName} · ${formatCurrencyGBP(order.totalPence)}`;
    void startAlertSound();
    showBrowserNotification(notifTitle, notifBody);
    alertOrderRef.current = order;
    setAlertOrder(order);
  }, []);

  const enqueueOrderAlerts = useCallback((orders: AdminOrderListItem[]): void => {
    const fresh = orders.filter((order) => {
      if (alertOrderRef.current?.id === order.id) return false;
      if (queuedOrderIds.current.has(order.id)) return false;
      queuedOrderIds.current.add(order.id);
      return true;
    });
    if (fresh.length === 0) return;

    if (alertOrderRef.current) {
      alertQueue.current.push(...fresh);
      return;
    }

    const [first, ...rest] = fresh;
    if (!first) return;
    alertQueue.current.push(...rest);
    showOrderAlert(first);
  }, [showOrderAlert]);

  const closeOrderAlert = useCallback((): void => {
    stopAlertSound();
    if (alertOrderRef.current) {
      queuedOrderIds.current.delete(alertOrderRef.current.id);
    }
    const next = alertQueue.current.shift() ?? null;
    if (next) {
      queuedOrderIds.current.delete(next.id);
      showOrderAlert(next);
      return;
    }
    alertOrderRef.current = null;
    setAlertOrder(null);
  }, [showOrderAlert]);

  const refresh = useCallback(async (options: { force?: boolean } = {}) => {
    if (status !== "signed-in") return;
    if (!options.force && !appActiveRef.current) return;
    if (stoppedAfterAuthFailure.current) return;

    const now = Date.now();
    if (!options.force && nextAllowedAt.current > now) return;

    if (inflight.current) {
      pendingRefresh.current = true;
      return;
    }

    const requestSessionKey = sessionKeyRef.current;
    inflight.current = true;
    try {
      const res = await apiCall<AdminDashboardStats>({
        path: "/api/admin/dashboard?view=badges",
      });
      if (
        sessionKeyRef.current !== requestSessionKey ||
        statusRef.current !== "signed-in" ||
        !appActiveRef.current
      ) {
        return;
      }

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          stoppedAfterAuthFailure.current = true;
          return;
        }
        failureCount.current += 1;
        nextAllowedAt.current =
          Date.now() +
          retryDelayMs({
            failureCount: failureCount.current,
            retryAfterMs: res.status === 429 ? res.retryAfterMs : undefined,
          });
        return;
      }

      failureCount.current = 0;
      nextAllowedAt.current = 0;

      const active = res.data.latestOrders.filter(isActiveOrder).length;
      setActiveOrders(active);
      setPendingBookings(res.data.pendingBookingsCount ?? 0);

      if (isDemoToken(getToken()) && !demoAlertShown.current) {
        const demoOrder = res.data.latestOrders.find((order) => order.id === "demo-order-1001")
          ?? res.data.latestOrders[0];
        if (demoOrder) {
          demoAlertShown.current = true;
          const title = "Demo new delivery order";
          const body = `${demoOrder.customerName} · ${demoOrder.itemCount} items · ${formatCurrencyGBP(
            demoOrder.totalPence,
          )}`;
          void startAlertSound();
          showBrowserNotification(title, body);
          void dialog.show({
            title,
            message:
              `${body}\n\nThis is a safe Apple Review demo popup. It does not create or change a real order.`,
            tone: "success",
            playSound: false,
            dismissOnBackdrop: false,
            onClose: () => stopAlertSound(),
            actions: [
              { label: "Dismiss", tone: "secondary" },
              {
                label: "View demo order",
                tone: "primary",
                onPress: () => navigateToOrder(demoOrder.id),
              },
            ],
          });
        }
      }

      // --- New-item detection ----------------------------------------------
      const receivedOrders = res.data.latestOrders.filter(
        (order) => order.status === "received",
      );
      const incomingBookingIds = new Set(
        res.data.latestBookings.map((b) => b.id),
      );

      if (seenOrderIds.current === null) {
        seenOrderIds.current = await loadStoredOrderIds();
        if (
          sessionKeyRef.current !== requestSessionKey ||
          statusRef.current !== "signed-in" ||
          !appActiveRef.current
        ) {
          return;
        }
      }
      const newOrders = receivedOrders.filter(
        (o) => !seenOrderIds.current!.has(o.id),
      );
      if (newOrders.length > 0) {
        for (const order of newOrders) seenOrderIds.current.add(order.id);
        void persistOrderIds(seenOrderIds.current);
        enqueueOrderAlerts(newOrders);
      }

      if (seenBookingIds.current === null) {
        seenBookingIds.current = incomingBookingIds;
      } else {
        const newBookings = res.data.latestBookings.filter(
          (b) =>
            !seenBookingIds.current!.has(b.id) && b.status === "pending",
        );
        for (const id of incomingBookingIds) seenBookingIds.current.add(id);
        if (newBookings.length > 0) {
          const first = newBookings[0]!;
          const title =
            newBookings.length === 1
              ? "New booking request"
              : `${newBookings.length} new bookings`;
          const body = `${first.customerName} · ${first.covers} cover${
            first.covers === 1 ? "" : "s"
          } · ${first.date} ${first.timeSlot}`;
          void startAlertSound();
          showBrowserNotification(title, body);
          void dialog.show({
            title,
            message: body,
            tone: "info",
            playSound: false,
            dismissOnBackdrop: false,
            onClose: () => stopAlertSound(),
            actions: [
              { label: "Dismiss", tone: "secondary" },
              {
                label: "View booking",
                tone: "primary",
                onPress: () => navigateToBooking(first.id),
              },
            ],
          });
        }
      }
    } finally {
      inflight.current = false;
      if (
        pendingRefresh.current &&
        statusRef.current === "signed-in" &&
        appActiveRef.current
      ) {
        pendingRefresh.current = false;
        void refresh({ force: true });
      } else {
        pendingRefresh.current = false;
      }
    }
  }, [status, dialog, enqueueOrderAlerts]);

  useEffect(() => {
    if (status !== "signed-in") {
      setActiveOrders(0);
      setPendingBookings(0);
      seenOrderIds.current = null;
      seenBookingIds.current = null;
      demoAlertShown.current = false;
      alertQueue.current = [];
      queuedOrderIds.current.clear();
      alertOrderRef.current = null;
      setAlertOrder(null);
      failureCount.current = 0;
      nextAllowedAt.current = 0;
      pendingRefresh.current = false;
      stoppedAfterAuthFailure.current = false;
      stopAlertSound();
      return;
    }
    stoppedAfterAuthFailure.current = false;
    failureCount.current = 0;
    nextAllowedAt.current = 0;
    // Best-effort: request OS notification permission once signed in, and
    // start downloading the mp3 so the first alert plays instantly.
    void ensureBrowserNotificationPermission();
    preloadAlertSound();
    // Returning users (persisted token or dev bypass) skip the Login tap,
    // so we never get a user gesture to unlock audio. Arm a one-shot
    // listener that primes on the first click/keypress anywhere.
    armAlertSoundOnFirstGesture();
  }, [status]);

  useEffect(() => {
    if (status !== "signed-in" || !appActive || stoppedAfterAuthFailure.current) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (delayMs: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        void refresh().finally(() => {
          if (cancelled) return;
          schedule(nextPollDelayMs({ nextAllowedAt: nextAllowedAt.current }));
        });
      }, delayMs);
    };

    void refresh({ force: true });
    schedule(BADGE_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [appActive, refresh, status]);

  const value = useMemo<Badges>(
    () => ({ activeOrders, pendingBookings, refresh }),
    [activeOrders, pendingBookings, refresh],
  );

  return (
    <BadgesContext.Provider value={value}>
      {children}
      {alertOrder !== null ? (
        <NewOrderAlertModal
          order={alertOrder}
          onClose={closeOrderAlert}
          refresh={() => refresh({ force: true })}
        />
      ) : null}
    </BadgesContext.Provider>
  );
}



export function useBadges(): Badges {
  return useContext(BadgesContext);
}
