import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { getJson, money } from "../api";
import { Button, Card, Field, Icon, ScreenHeader } from "../components/ui";
import { statusLabel } from "../lib/customer-data";
import { useCustomerApp } from "../state/CustomerContext";
import { colors, radii, spacing, typography } from "../theme";
import type { OrderTrack, PublicOrder } from "../types";
import { cartFingerprint, clearPendingCheckout, isClosedCheckout, isPaidCheckout, loadPendingCheckout, type PendingCheckout } from "./pending-checkout";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TERMINAL_STATUSES = new Set(["delivered", "completed", "cancelled", "rejected", "refunded"]);

function trackingId(value: string): string | null {
  const trimmed = value.trim();
  if (UUID_RE.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    const match = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (match) return match[0];
  }
  return null;
}

function timeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{1,2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
}

function progressIndex(status: string, delivery: boolean): number {
  if (status === "delivered" || status === "completed") return 3;
  if (status === "out_for_delivery" || (!delivery && status === "ready")) return 2;
  if (status === "making" || status === "preparing" || (delivery && status === "ready")) return 1;
  if (status === "received" || status === "accepted") return 0;
  return -1;
}

export function TrackScreen() {
  const { lastOrderId, settings, cart, clearCart } = useCustomerApp();
  const [input, setInput] = useState(lastOrderId ?? "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [summary, setSummary] = useState<PublicOrder | null>(null);
  const [tracking, setTracking] = useState<OrderTrack | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const request = useRef(0);
  const mounted = useRef(true);
  const currentlyLoading = useRef<string | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const latestCart = useRef(cart);
  const clearLatestCart = useRef(clearCart);
  latestCart.current = cart;
  clearLatestCart.current = clearCart;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current += 1; requestController.current?.abort(); };
  }, []);

  const reconcileCheckout = useCallback(async (order: PublicOrder, requestId: number) => {
    try {
      const pending = await loadPendingCheckout(AsyncStorage);
      if (!mounted.current || requestId !== request.current) return;
      if (!pending || order.id !== pending.orderId) {
        setPendingCheckout(null);
        return;
      }
      if (isPaidCheckout(pending, order)) {
        const removed = await clearPendingCheckout(pending.orderId, AsyncStorage);
        if (!mounted.current) return;
        if (removed) {
          // Compare after the storage operation: the customer may have changed
          // their bag while the server or device storage was responding.
          if (cartFingerprint(latestCart.current) === pending.cartFingerprint) clearLatestCart.current();
          setPendingCheckout((current) => current?.orderId === pending.orderId ? null : current);
        }
        return;
      }
      if (isClosedCheckout(pending, order)) {
        const removed = await clearPendingCheckout(pending.orderId, AsyncStorage);
        if (mounted.current && removed) setPendingCheckout((current) => current?.orderId === pending.orderId ? null : current);
        // A closed order releases checkout without consuming the customer's bag.
        return;
      }
      setPendingCheckout(order.status === "pending_payment" && order.paymentMethod === "stripe_card" ? pending : null);
    } catch {
      if (mounted.current && requestId === request.current) {
        setError((current) => current || "Your saved payment details couldn't be updated. Refresh to try again.");
      }
    }
  }, []);

  const loadOrder = useCallback(async (id: string, quiet = false) => {
    if (quiet && currentlyLoading.current) return;
    const requestId = ++request.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    currentlyLoading.current = id;
    if (quiet) setRefreshing(true);
    else {
      setBusy(true);
      setActiveId((current) => current === id ? current : null);
      setSummary((current) => current?.id === id ? current : null);
      setTracking((current) => current?.orderId === id ? current : null);
      setPendingCheckout((current) => current?.orderId === id ? current : null);
    }
    setError(null);
    const encodedId = encodeURIComponent(id);
    const results = await Promise.allSettled([
      getJson<PublicOrder>(`/api/orders/${encodedId}`, { signal: controller.signal }),
      getJson<OrderTrack>(`/api/orders/${encodedId}/track`, { signal: controller.signal }),
    ]);
    if (!mounted.current || requestId !== request.current) return;
    const [orderResult, trackResult] = results;
    if (orderResult.status === "fulfilled" || trackResult.status === "fulfilled") {
      if (orderResult.status === "fulfilled") setSummary(orderResult.value);
      if (trackResult.status === "fulfilled") setTracking(trackResult.value);
      else setTracking(null);
      setActiveId(id);
      setLastChecked(new Date().toISOString());
      if (orderResult.status === "rejected" || trackResult.status === "rejected") {
        setError("Some order details couldn't refresh. Your latest available information is shown below.");
      }
      // Only the authoritative order summary can prove that Stripe payment
      // completed. Tracking updates alone never clear a saved bag.
      if (orderResult.status === "fulfilled") await reconcileCheckout(orderResult.value, requestId);
    } else {
      const cause: unknown = orderResult.reason;
      setError(cause instanceof Error ? cause.message : "We couldn't find that order. Check the ID and try again.");
    }
    if (!mounted.current || requestId !== request.current) return;
    currentlyLoading.current = null;
    requestController.current = null;
    setBusy(false);
    setRefreshing(false);
  }, [reconcileCheckout]);

  useEffect(() => {
    if (!lastOrderId || !UUID_RE.test(lastOrderId)) return;
    setInput(lastOrderId);
    void loadOrder(lastOrderId);
  }, [lastOrderId, loadOrder]);

  const status = tracking?.status ?? summary?.status ?? "";
  const isTerminal = TERMINAL_STATUSES.has(status);
  useEffect(() => {
    if (!activeId || isTerminal) return;
    const refreshOrder = () => {
      if (AppState.currentState === "active") void loadOrder(activeId, true);
    };
    const interval = setInterval(refreshOrder, 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadOrder(activeId, true);
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [activeId, isTerminal, loadOrder]);

  const trackOrder = () => {
    const value = input.trim() || lastOrderId || "";
    const id = trackingId(value);
    if (!id) {
      setError("Paste the order ID or tracking link from your order confirmation.");
      return;
    }
    setInput(id);
    void loadOrder(id);
  };

  const hasOrder = summary !== null || tracking !== null;
  const isDelivery = (tracking?.type ?? summary?.type) === "delivery";
  const stage = progressIndex(status, isDelivery);
  const eta = timeLabel(tracking?.estimatedTime ?? summary?.estimatedTime);
  const reference = summary?.reference || tracking?.reference || "Your order";
  const cancelled = status === "cancelled" || status === "rejected" || status === "refunded";
  const steps = [
    { title: "Order received", detail: "Your order has reached Margherita." },
    { title: "In the kitchen", detail: "Freshly prepared and stone baked." },
    { title: isDelivery ? "On the way" : "Ready to collect", detail: isDelivery ? "Your driver is bringing it over." : "Come and see us at Alexandra Parade." },
    { title: isDelivery ? "Delivered" : "Collected", detail: "Time to enjoy. Buon appetito!" },
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader eyebrow="FROM OUR OVEN TO YOU" title="Follow your order." description="Keep an eye on your pizza, from the kitchen to your first slice." />
      <Card>
        <Field label="Order ID or tracking link" value={input} onChangeText={setInput} placeholder="Paste from your confirmation"
          autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={trackOrder} maxLength={2048} />
        <Button label="Track my order" icon="search-outline" onPress={trackOrder} loading={busy} disabled={busy} />
        {lastOrderId && activeId !== lastOrderId ? (
          <Pressable accessibilityRole="button" disabled={busy} accessibilityLabel="Track your most recent order"
            onPress={() => { setInput(lastOrderId); void loadOrder(lastOrderId); }}
            style={({ pressed }) => [styles.recentOrder, pressed && styles.pressed]}>
            <View style={styles.recentIcon}><Icon name="receipt-outline" size={21} /></View>
            <View style={styles.flex}><Text style={styles.label}>Your most recent order</Text><Text numberOfLines={1} style={styles.small}>Saved on this device</Text></View>
            <Icon name="arrow-forward" size={20} />
          </Pressable>
        ) : null}
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      </Card>

      {hasOrder ? (
        <>
          <View accessibilityLiveRegion="polite" style={[styles.statusHero, cancelled && styles.statusHeroCancelled]}>
            <View style={styles.statusTop}><Text style={styles.eyebrow}>{isDelivery ? "DELIVERY" : "COLLECTION"}</Text><Text selectable style={styles.reference}>{reference}</Text></View>
            <Text style={styles.statusTitle}>{isDelivery && status === "ready" ? "Fresh from the oven" : statusLabel(status)}</Text>
            <Text style={styles.body}>{tracking?.message || "The kitchen will update your order here as it progresses."}</Text>
            {eta && !isTerminal && status !== "pending_payment" ? (
              <View style={styles.eta}><Text style={styles.etaLabel}>{isDelivery ? "Estimated arrival" : "Estimated collection"}</Text><Text style={styles.etaTime}>{eta}</Text></View>
            ) : null}
            <View style={styles.updateRow}>
              <View style={styles.liveDot} />
              <Text style={styles.updateText}>{refreshing ? "Updating…" : lastChecked ? `Checked at ${timeLabel(lastChecked)}` : "Live order updates"}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Refresh order status" disabled={busy || refreshing}
                onPress={() => { if (activeId) void loadOrder(activeId, true); }} hitSlop={8}
                style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}><Text style={styles.refreshText}>Refresh ↻</Text></Pressable>
            </View>
          </View>

          {status === "pending_payment" && pendingCheckout && pendingCheckout.orderId === summary?.id ? (
            <Card>
              <Text style={styles.sectionTitle}>Finish your payment</Text>
              <Text style={styles.body}>Your secure payment link is saved on this device. Your bag stays here until payment is confirmed.</Text>
              <Button label="Continue to secure payment" icon="lock-closed-outline" onPress={() => {
                void Linking.openURL(pendingCheckout.checkoutUrl)
                  .catch(() => setError("The payment page couldn't open. Please try again."));
              }} />
            </Card>
          ) : null}

          {!cancelled ? (
            <Card>
              <Text style={styles.sectionTitle}>Your order’s journey</Text>
              {steps.map((step, index) => {
                const complete = index < stage;
                const current = index === stage;
                return (
                  <View key={step.title} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={[styles.timelineDot, (complete || current) && styles.timelineDotActive]}><Text style={[styles.timelineNumber, (complete || current) && styles.timelineNumberActive]}>{complete ? "✓" : index + 1}</Text></View>
                      {index < steps.length - 1 ? <View style={[styles.timelineLine, complete && styles.timelineLineActive]} /> : null}
                    </View>
                    <View style={[styles.timelineCopy, index === steps.length - 1 && styles.timelineCopyLast]}>
                      <Text style={[styles.timelineTitle, (complete || current) && styles.timelineTitleActive]}>{step.title}</Text>
                      {current || (index === 3 && stage === 3) ? <Text style={styles.small}>{step.detail}</Text> : null}
                      {current ? <Text style={styles.currentLabel}>CURRENT STATUS</Text> : null}
                    </View>
                  </View>
                );
              })}
              {status === "pending_payment" ? <Text style={styles.small}>Your order is waiting for payment. Kitchen preparation starts after payment is confirmed.</Text> : null}
              {!isTerminal ? <Text style={styles.small}>Updates refresh automatically while the app is open.</Text> : null}
            </Card>
          ) : null}

          {tracking?.canTrackDriver && tracking.driverLocation ? (
            <Card>
              <Text style={styles.sectionTitle}>Your driver is on the way</Text>
              <Text style={styles.body}>View the driver’s latest shared location on the map.</Text>
              <Button label="View driver location" variant="secondary" onPress={() => {
                const location = tracking.driverLocation;
                if (location) void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`)
                  .catch(() => setError("The map couldn't open. Please try again."));
              }} />
            </Card>
          ) : null}

          {summary ? (
            <Card>
              <Text style={styles.sectionTitle}>In your order</Text>
              {summary.items.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.itemRow}>
                  <View style={styles.quantity}><Text style={styles.quantityText}>{item.quantity}</Text></View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{money(item.totalPence)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.totalRow}><Text style={styles.muted}>Subtotal</Text><Text style={styles.amount}>{money(summary.subtotalPence)}</Text></View>
              {summary.discountPence > 0 ? <View style={styles.totalRow}><Text style={styles.muted}>Discount{summary.discountCode ? ` · ${summary.discountCode}` : ""}</Text><Text style={styles.saving}>−{money(summary.discountPence)}</Text></View> : null}
              <View style={styles.totalRow}><Text style={styles.muted}>{isDelivery ? "Delivery" : "Collection"}</Text><Text style={styles.amount}>{summary.deliveryFeePence > 0 ? money(summary.deliveryFeePence) : "Free"}</Text></View>
              <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalAmount}>{money(summary.totalPence)}</Text></View>
              <View style={styles.divider} />
              <Text style={styles.label}>{isDelivery ? "Delivering to" : "Collect from"}</Text>
              <Text style={styles.body}>{isDelivery ? summary.address || "Your delivery address" : settings.restaurant.address}</Text>
              <Text style={styles.small}>{summary.paymentMethod === "cash_on_delivery" ? "Payment by cash" : "Payment by card"}</Text>
            </Card>
          ) : null}
          <Button label="Need a hand? Call us" icon="call-outline" variant="secondary" onPress={() => {
            void Linking.openURL(`tel:${settings.restaurant.phoneTel}`).catch(() => setError(`Please call ${settings.restaurant.phone}.`));
          }} />
        </>
      ) : !busy ? (
        <View style={styles.empty}>
          <View style={styles.emptyMark}><Icon name="receipt-outline" size={30} /></View>
          <Text style={styles.emptyTitle}>Something delicious is coming.</Text>
          <Text style={styles.emptyBody}>Your order updates will appear here. Find your order ID or tracking link in your confirmation email.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.xl },
  eyebrow: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 1.6 },
  body: { color: colors.text, fontFamily: typography.body, fontSize: 14, lineHeight: 22 },
  sectionTitle: { color: colors.text, fontFamily: typography.semibold, fontSize: 17, marginBottom: spacing.xs },
  label: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  small: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 18 },
  muted: { color: colors.textMuted, fontFamily: typography.body, fontSize: 13 },
  flex: { flex: 1, gap: spacing.xs },
  recentOrder: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  recentIcon: { width: 40, height: 40, backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7 },
  error: { color: colors.danger, fontFamily: typography.medium, fontSize: 13, lineHeight: 20 },
  statusHero: { padding: spacing.xl, backgroundColor: colors.surfaceMuted, borderRadius: radii.lg, gap: spacing.md },
  statusHeroCancelled: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  statusTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  reference: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11, flexShrink: 1, textAlign: "right" },
  statusTitle: { color: colors.text, fontFamily: typography.heading, fontSize: 29, lineHeight: 36 },
  eta: { paddingTop: spacing.sm, gap: spacing.xs },
  etaLabel: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 12 },
  etaTime: { color: colors.text, fontFamily: typography.semibold, fontSize: 31 },
  updateRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  liveDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: colors.success },
  updateText: { color: colors.textMuted, fontFamily: typography.body, fontSize: 10, flex: 1 },
  refreshButton: { minHeight: 36, justifyContent: "center", paddingLeft: spacing.sm },
  refreshText: { color: colors.text, fontFamily: typography.semibold, fontSize: 11 },
  timelineRow: { flexDirection: "row", gap: spacing.md },
  timelineRail: { width: 32, alignItems: "center" },
  timelineDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  timelineDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineNumber: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 12 },
  timelineNumberActive: { color: colors.text },
  timelineLine: { width: 1, backgroundColor: colors.border, flex: 1, minHeight: 14, marginVertical: spacing.xs },
  timelineLineActive: { backgroundColor: colors.primary },
  timelineCopy: { flex: 1, minHeight: 52, paddingTop: 5, paddingBottom: spacing.lg, gap: spacing.xs },
  timelineCopyLast: { minHeight: 32, paddingBottom: 0 },
  timelineTitle: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 13 },
  timelineTitleActive: { color: colors.text, fontFamily: typography.semibold },
  currentLabel: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 8, letterSpacing: 1.2, marginTop: spacing.xs },
  itemRow: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingVertical: spacing.xs },
  quantity: { backgroundColor: colors.surfaceMuted, borderRadius: radii.sm, minWidth: 30, minHeight: 30, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xs },
  quantityText: { color: colors.text, fontFamily: typography.medium, fontSize: 12 },
  itemName: { color: colors.text, fontFamily: typography.medium, fontSize: 13, lineHeight: 19, flex: 1 },
  itemPrice: { color: colors.text, fontFamily: typography.semibold, fontSize: 12 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  amount: { color: colors.text, fontFamily: typography.medium, fontSize: 13 },
  saving: { color: colors.success, fontFamily: typography.semibold, fontSize: 13 },
  totalLabel: { color: colors.text, fontFamily: typography.semibold, fontSize: 15 },
  totalAmount: { color: colors.text, fontFamily: typography.semibold, fontSize: 21 },
  empty: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, alignItems: "center", gap: spacing.md },
  emptyMark: { height: 66, width: 66, borderRadius: 33, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  emptyTitle: { color: colors.text, fontFamily: typography.heading, fontSize: 25, lineHeight: 32, textAlign: "center" },
  emptyBody: { color: colors.textMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 21, textAlign: "center" },
});
