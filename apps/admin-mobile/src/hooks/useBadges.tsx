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

import { apiCall, getToken } from "@/api/client";
import { isDemoToken } from "@/api/demo";
import type { AdminDashboardStats, AdminOrderListItem } from "@/api/types";
import { useSession } from "@/auth/SessionContext";
import { useDialog, type DialogAction } from "@/components/dialog";
import {
  armAlertSoundOnFirstGesture,
  ensureBrowserNotificationPermission,
  preloadAlertSound,
  showBrowserNotification,
  startAlertSound,
  stopAlertSound,
} from "@/hooks/alerts";
import {
  canTransitionOrderStatus,
  formatCurrencyGBP,
  inferPaymentStatus,
  isActiveOrder,
  isTestOrderHeuristic,
} from "@/lib/order-operations";
import { navigateToBooking, navigateToOrder } from "@/navigation/ref";

type Badges = {
  activeOrders: number;
  pendingBookings: number;
  refresh: () => Promise<void>;
};

const BadgesContext = createContext<Badges>({
  activeOrders: 0,
  pendingBookings: 0,
  refresh: async () => undefined,
});

// Aggressive polling so the owner sees a new order within a few seconds.
// 30s was way too slow for a live till — switched to 8s. The dashboard
// endpoint is cheap (single query) so this is fine.
const POLL_MS = 8_000;
const ALERTED_ORDER_IDS_KEY = "margherita-admin.alerted-order-ids.v1";
const MAX_STORED_ALERT_IDS = 120;

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
  const { status } = useSession();
  const dialog = useDialog();
  const [activeOrders, setActiveOrders] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);

  const inflight = useRef(false);
  // Track IDs we've already shown the owner. We seed these from the FIRST
  // successful poll after sign-in so existing orders/bookings don't trigger
  // a flood of "new order" alerts on launch.
  const seenOrderIds = useRef<Set<string> | null>(null);
  const seenBookingIds = useRef<Set<string> | null>(null);
  const demoAlertShown = useRef(false);

  const refresh = useCallback(async () => {
    if (status !== "signed-in" || inflight.current) return;
    inflight.current = true;
    const res = await apiCall<AdminDashboardStats>({
      path: "/api/admin/dashboard",
    });
    inflight.current = false;
    if (!res.ok) return;

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
    const incomingOrderIds = new Set(res.data.latestOrders.map((o) => o.id));
    const incomingBookingIds = new Set(
      res.data.latestBookings.map((b) => b.id),
    );

    if (seenOrderIds.current === null) {
      const stored = await loadStoredOrderIds();
      for (const id of incomingOrderIds) stored.add(id);
      seenOrderIds.current = stored;
      void persistOrderIds(stored);
    } else {
      const newOrders = res.data.latestOrders.filter(
        (o) =>
          !seenOrderIds.current!.has(o.id) &&
          o.status === "received",
      );
      for (const id of incomingOrderIds) seenOrderIds.current.add(id);
      void persistOrderIds(seenOrderIds.current);
      const alertableOrders = newOrders.filter(
        (order) => !isTestOrderHeuristic(order),
      );
      if (alertableOrders.length > 0) {
        const first = alertableOrders[0]!;
        const title =
          alertableOrders.length === 1
            ? `New ${first.type} order`
            : `${alertableOrders.length} new orders`;
        const payment = inferPaymentStatus(first);
        const body =
          alertableOrders.length === 1
            ? `${first.reference ?? first.id.slice(0, 8)}\n${first.customerName} · ${first.type}\n${first.itemCount} item${
                first.itemCount === 1 ? "" : "s"
              } · ${formatCurrencyGBP(first.totalPence)}\n${payment.label}`
            : `Latest: ${first.customerName} · ${formatCurrencyGBP(first.totalPence)}`;
        // Loop the alert sound until the owner taps a button. The dialog's
        // onClose hook stops it for any exit path (button / Android back).
        void startAlertSound();
        showBrowserNotification(title, body);
        void dialog.show({
          title,
          message: body,
          tone: "success",
          playSound: false,
          dismissOnBackdrop: false,
          onClose: () => stopAlertSound(),
          actions: buildOrderAlertActions(first, refresh),
        });
      }
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
  }, [status, dialog]);

  useEffect(() => {
    if (status !== "signed-in") {
      setActiveOrders(0);
      setPendingBookings(0);
      seenOrderIds.current = null;
      seenBookingIds.current = null;
      demoAlertShown.current = false;
      stopAlertSound();
      return;
    }
    // Best-effort: request OS notification permission once signed in, and
    // start downloading the mp3 so the first alert plays instantly.
    void ensureBrowserNotificationPermission();
    preloadAlertSound();
    // Returning users (persisted token or dev bypass) skip the Login tap,
    // so we never get a user gesture to unlock audio. Arm a one-shot
    // listener that primes on the first click/keypress anywhere.
    armAlertSoundOnFirstGesture();
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [status, refresh]);

  const value = useMemo<Badges>(
    () => ({ activeOrders, pendingBookings, refresh }),
    [activeOrders, pendingBookings, refresh],
  );

  return (
    <BadgesContext.Provider value={value}>{children}</BadgesContext.Provider>
  );
}

function buildOrderAlertActions(
  order: AdminOrderListItem,
  refresh: () => Promise<void>,
): DialogAction[] {
  const actions: DialogAction[] = [
    { label: "Dismiss", tone: "secondary" as const },
    {
      label: "View order",
      tone: "primary" as const,
      onPress: () => navigateToOrder(order.id),
    },
  ];
  if (canTransitionOrderStatus(order.status, "making")) {
    actions.push({
      label: "Accept",
      tone: "primary" as const,
      onPress: () => {
        void apiCall({
          method: "POST",
          path: `/api/admin/orders/${order.id}/status`,
          body: { status: "making" },
        }).then(() => refresh());
      },
    });
  }
  if (canTransitionOrderStatus(order.status, "rejected")) {
    actions.push({
      label: "Reject",
      tone: "destructive" as const,
      onPress: () => {
        void apiCall({
          method: "POST",
          path: `/api/admin/orders/${order.id}/status`,
          body: { status: "rejected" },
        }).then(() => refresh());
      },
    });
  }
  return actions;
}

export function useBadges(): Badges {
  return useContext(BadgesContext);
}
