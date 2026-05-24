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

import { apiCall } from "@/api/client";
import type { AdminDashboardStats } from "@/api/types";
import { useSession } from "@/auth/SessionContext";
import { useDialog } from "@/components/dialog";
import {
  armAlertSoundOnFirstGesture,
  ensureBrowserNotificationPermission,
  preloadAlertSound,
  showBrowserNotification,
  startAlertSound,
  stopAlertSound,
} from "@/hooks/alerts";
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

  const refresh = useCallback(async () => {
    if (status !== "signed-in" || inflight.current) return;
    inflight.current = true;
    const res = await apiCall<AdminDashboardStats>({
      path: "/api/admin/dashboard",
    });
    inflight.current = false;
    if (!res.ok) return;

    const active = res.data.latestOrders.filter((o) =>
      ["received", "making", "ready", "out_for_delivery"].includes(o.status),
    ).length;
    setActiveOrders(active);
    setPendingBookings(res.data.pendingBookingsCount ?? 0);

    // --- New-item detection ----------------------------------------------
    const incomingOrderIds = new Set(res.data.latestOrders.map((o) => o.id));
    const incomingBookingIds = new Set(
      res.data.latestBookings.map((b) => b.id),
    );

    if (seenOrderIds.current === null) {
      seenOrderIds.current = incomingOrderIds;
    } else {
      const newOrders = res.data.latestOrders.filter(
        (o) =>
          !seenOrderIds.current!.has(o.id) &&
          (o.status === "received" || o.status === "pending_payment"),
      );
      for (const id of incomingOrderIds) seenOrderIds.current.add(id);
      if (newOrders.length > 0) {
        const first = newOrders[0]!;
        const title =
          newOrders.length === 1
            ? `New ${first.type} order`
            : `${newOrders.length} new orders`;
        const body =
          newOrders.length === 1
            ? `${first.customerName} · ${first.itemCount} item${
                first.itemCount === 1 ? "" : "s"
              } · £${(first.totalPence / 100).toFixed(2)}`
            : `Latest: ${first.customerName} · £${(
                first.totalPence / 100
              ).toFixed(2)}`;
        // Loop the alert sound until the owner taps a button. The dialog's
        // onClose hook stops it for any exit path (button / Android back).
        void startAlertSound();
        showBrowserNotification(title, body);
        void dialog.show({
          title,
          message: body,
          tone: "success",
          dismissOnBackdrop: false,
          onClose: () => stopAlertSound(),
          actions: [
            { label: "Dismiss", tone: "secondary" },
            {
              label: "View order",
              tone: "primary",
              onPress: () => navigateToOrder(first.id),
            },
          ],
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

export function useBadges(): Badges {
  return useContext(BadgesContext);
}
