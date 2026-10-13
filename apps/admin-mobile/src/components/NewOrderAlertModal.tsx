// Dedicated new-order alert modal.
//
// Why a separate component instead of the generic dialog.show():
//   • Generic dialog uses flexDirection:"column-reverse" for stacked buttons,
//     which renders the last action (Reject) at the visual top — it looks like
//     the red button is floating outside the card.
//   • Generic dialog takes a flat text message; orders need a structured
//     summary (reference, customer, type, total, payment, age).
//   • Reject needs a confirmation step — the generic dialog can't do that
//     inline without nesting dialogs.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiCall } from "@/api/client";
import type { AdminOrderListItem } from "@/api/types";
import { formatMoney, formatRelative, palette, shadow } from "@/format";
import {
  canTransitionOrderStatus,
  inferPaymentStatus,
} from "@/lib/order-operations";
import { navigateToOrder } from "@/navigation/ref";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "alert" | "confirming-reject" | "loading";

type Props = {
  order: AdminOrderListItem;
  /** Called after any action completes or dismiss is pressed. The caller is
   *  responsible for stopping the alert sound and clearing the order state. */
  onClose: () => void;
  refresh: () => Promise<void>;
};

// ─── SummaryRow ───────────────────────────────────────────────────────────────

type SummaryRowProps = { label: string; value: string; bold?: boolean };

function SummaryRow({ label, value, bold = false }: SummaryRowProps) {
  return (
    <View style={sr.row}>
      <Text style={sr.label} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[sr.value, bold && sr.valueBold]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}

const sr = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  label: {
    fontSize: 13,
    color: palette.textMuted,
    flex: 1,
    marginRight: 8,
  },
  value: {
    fontSize: 13,
    color: palette.text,
    flex: 2,
    textAlign: "right",
  },
  valueBold: {
    fontWeight: "700",
    fontSize: 14,
    color: palette.text,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function NewOrderAlertModal({
  order,
  onClose,
  refresh,
}: Props): JSX.Element {
  const [phase, setPhase] = useState<Phase>("alert");
  const insets = useSafeAreaInsets();

  // Spring entrance animation — same curve as the generic dialog.
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0.88);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 180,
        mass: 0.7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const loading = phase === "loading";

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleAccept = useCallback(() => {
    if (loading) return;
    setPhase("loading");
    void (async () => {
      try {
        await apiCall({
          method: "POST",
          path: `/api/admin/orders/${order.id}/status`,
          body: { status: "making" },
        });
        await refresh();
      } finally {
        onClose();
      }
    })();
  }, [loading, order.id, refresh, onClose]);

  const handleView = useCallback(() => {
    if (loading) return;
    onClose();
    navigateToOrder(order.id);
  }, [loading, order.id, onClose]);

  const handleDismiss = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  const handleRejectPress = useCallback(() => {
    if (loading) return;
    setPhase("confirming-reject");
  }, [loading]);

  const handleRejectCancel = useCallback(() => {
    if (loading) return;
    setPhase("alert");
  }, [loading]);

  const handleRejectConfirmed = useCallback(() => {
    if (loading) return;
    setPhase("loading");
    void (async () => {
      try {
        await apiCall({
          method: "POST",
          path: `/api/admin/orders/${order.id}/status`,
          body: { status: "rejected" },
        });
        await refresh();
      } finally {
        onClose();
      }
    })();
  }, [loading, order.id, refresh, onClose]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const canAccept = canTransitionOrderStatus(order.status, "making");
  const canReject = canTransitionOrderStatus(order.status, "rejected");
  const payment = inferPaymentStatus(order);
  const typeLabel = order.type === "delivery" ? "Delivery" : "Collection";
  const age = formatRelative(order.createdAt);

  // Respect safe area but keep a sensible minimum so the card doesn't hug the
  // status bar or home indicator.
  const ptop = Math.max(insets.top + 8, 24);
  const pbottom = Math.max(insets.bottom + 8, 24);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={loading ? undefined : handleDismiss}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { paddingTop: ptop, paddingBottom: pbottom }]}>
        {/* Pressable backdrop behind the card — does NOT wrap the card so
            the card never intercepts this touch. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessible={false}
        />

        <Animated.View
          style={[styles.card, { opacity, transform: [{ scale }] }]}
        >
          {/* ── Header ───────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.iconChip}>
              <Text style={styles.iconText}>🛎️</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                New {typeLabel.toLowerCase()} order
              </Text>
              {order.reference ? (
                <Text style={styles.reference}>{order.reference}</Text>
              ) : null}
            </View>
          </View>

          {/* ── Order summary ─────────────────────────────────────────── */}
          <View style={styles.summary}>
            <SummaryRow label="Customer" value={order.customerName} />
            <SummaryRow label="Type" value={typeLabel} />
            <SummaryRow
              label="Items"
              value={`${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`}
            />
            <SummaryRow
              label="Total"
              value={formatMoney(order.totalPence)}
              bold
            />
            <SummaryRow label="Payment" value={payment.label} />
            <SummaryRow label="Placed" value={age} />
          </View>

          {/* ── Actions ──────────────────────────────────────────────── */}
          {phase === "confirming-reject" ? (
            // Reject confirmation replaces the action buttons.
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Reject this order?</Text>
              <Text style={styles.confirmMsg}>This cannot be undone.</Text>
              <View style={styles.confirmRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnGhost,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleRejectCancel}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnGhostText}>Keep order</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnDestructive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleRejectConfirmed}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnWhiteText}>
                    {loading ? "Rejecting…" : "Reject order"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // Normal action stack — intentional top-to-bottom order:
            //   1. Accept  (green, most important)
            //   2. View    (neutral secondary)
            //   3. Reject  (red, inside card, requires confirmation)
            //   4. Dismiss (low-emphasis ghost)
            <View style={styles.actions}>
              {canAccept ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnAccept,
                    loading && styles.btnDisabled,
                    pressed && !loading && styles.btnPressed,
                  ]}
                  onPress={handleAccept}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnWhiteText}>
                    {loading ? "Accepting…" : "✓  Accept order"}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnSecondary,
                  loading && styles.btnDisabled,
                  pressed && !loading && styles.btnPressed,
                ]}
                onPress={handleView}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.btnGhostText}>View order →</Text>
              </Pressable>

              {canReject ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnReject,
                    loading && styles.btnDisabled,
                    pressed && !loading && styles.btnPressed,
                  ]}
                  onPress={handleRejectPress}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnWhiteText}>Reject</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnDismiss,
                  loading && styles.btnDisabled,
                  pressed && !loading && styles.btnPressed,
                ]}
                onPress={handleDismiss}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.btnDismissText}>Dismiss</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Full-screen backdrop dims everything behind the card.
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  // Card: 90% width, max 420px, all content inside.
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    // Subtle shadow — no glow/neon.
    ...shadow,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  // Header row: icon chip + title/reference.
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.successBg,
    alignItems: "center",
    justifyContent: "center",
    // Prevent the chip from shrinking when title is long.
    flexShrink: 0,
  },
  iconText: { fontSize: 22 },
  headerText: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: palette.text,
    lineHeight: 22,
  },
  reference: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.textMuted,
    marginTop: 2,
  },
  // Summary table.
  summary: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    marginBottom: 18,
  },
  // Normal action stack — column, not column-reverse. Buttons fill full width.
  actions: {
    gap: 9,
  },
  // Reject confirmation area.
  confirmBox: {
    backgroundColor: palette.dangerBg,
    borderRadius: 12,
    padding: 16,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.dangerFg,
    textAlign: "center",
    marginBottom: 4,
  },
  confirmMsg: {
    fontSize: 13,
    color: palette.dangerFg,
    textAlign: "center",
    marginBottom: 14,
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
  },
  // Shared button base — no flex:1 in column mode; use alignSelf:stretch (default).
  btn: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.8 },
  // Accept: green, most prominent.
  btnAccept: {
    backgroundColor: palette.success,
  },
  // View order: neutral bordered secondary.
  btnSecondary: {
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  // Reject: red, inside the card, opens confirmation.
  btnReject: {
    backgroundColor: palette.danger,
  },
  // Dismiss: very low emphasis, outline only.
  btnDismiss: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.border,
  },
  // Confirm-row buttons use flex:1 because they are in a row (horizontal).
  btnGhost: {
    flex: 1,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  btnDestructive: {
    flex: 1,
    backgroundColor: palette.danger,
  },
  // Text styles.
  btnWhiteText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  btnGhostText: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 15,
  },
  btnDismissText: {
    color: palette.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
});
