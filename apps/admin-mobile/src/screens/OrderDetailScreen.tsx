import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiCall } from "@/api/client";
import { useApiGet } from "@/api/useApiGet";
import {
  ADMIN_ORDER_STATUSES,
  type AdminOrderDetail,
  type OrderStatus,
} from "@/api/types";
import { Banner, ContactActions, PrimaryButton, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { Card, StatusBadge } from "@/components/ui";
import { useBadges } from "@/hooks/useBadges";
import { formatRelative, formatMoney, palette } from "@/format";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "OrderDetail">;

/** Natural forward-flow next status for an order. */
function nextStatus(current: OrderStatus, type: "delivery" | "collection"): OrderStatus | null {
  switch (current) {
    case "pending_payment":
      return "received";
    case "received":
      return "making";
    case "making":
      return "ready";
    case "ready":
      return type === "delivery" ? "out_for_delivery" : "delivered";
    case "out_for_delivery":
      return "delivered";
    default:
      return null;
  }
}

function statusLabel(s: OrderStatus): string {
  return s.replace(/_/g, " ");
}

export function OrderDetailScreen({ route, navigation }: Props): JSX.Element {
  const { id } = route.params;
  const { data, error, loading, reload } = useApiGet<AdminOrderDetail>(
    `/api/admin/orders/${id}`,
    [id],
  );
  const [saving, setSaving] = useState<OrderStatus | null>(null);
  const { refresh: refreshBadges } = useBadges();
  const dialog = useDialog();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const updateStatus = async (next: OrderStatus): Promise<void> => {
    setSaving(next);
    const res = await apiCall({
      method: "POST",
      path: `/api/admin/orders/${id}/status`,
      body: { status: next },
    });
    setSaving(null);
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't update status",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    await reload();
    void refreshBadges();
  };

  const confirmAndUpdate = async (
    next: OrderStatus,
    verb: string,
  ): Promise<void> => {
    const destructive = next === "cancelled" || next === "rejected";
    const ok = await dialog.confirm({
      title: `${verb} this order?`,
      confirmLabel: verb,
      destructive,
    });
    if (ok) void updateStatus(next);
  };

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: palette.dangerFg }}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  const next = nextStatus(data.status, data.type);
  const isTerminal =
    data.status === "delivered" ||
    data.status === "cancelled" ||
    data.status === "rejected";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ref}>
              {data.reference ?? data.id.slice(0, 8)}
            </Text>
            <Text style={styles.muted}>
              {formatRelative(data.createdAt)} · {data.type}
            </Text>
          </View>
          <StatusBadge status={data.status} />
        </View>
        <Text style={styles.payment}>
          {data.paymentMethod === "stripe_card" ? "💳 Paid by card" : "💵 Cash on delivery"}
        </Text>
        {data.estimatedTime ? (
          <Text style={styles.muted}>ETA: {data.estimatedTime}</Text>
        ) : null}
      </Card>

      {!isTerminal && next ? (
        <PrimaryButton
          label={`Advance to ${statusLabel(next)}`}
          icon="➡️"
          busy={saving === next}
          onPress={() => void updateStatus(next)}
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {isTerminal ? (
        <Banner tone={data.status === "delivered" ? "success" : "warning"}>
          This order is {statusLabel(data.status)}.
        </Banner>
      ) : null}

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.section}>Customer</Text>
        <Text style={styles.name}>{data.customerName}</Text>
        <Text style={styles.muted}>{data.customerPhone}</Text>
        <Text style={styles.muted}>{data.customerEmail}</Text>
        {data.address ? (
          <Text style={[styles.muted, { marginTop: 6 }]}>{data.address}</Text>
        ) : null}
        <ContactActions
          phone={data.customerPhone}
          email={data.customerEmail}
          address={data.address ?? null}
        />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.section}>Items</Text>
        {data.items.map((item, i) => (
          <View
            key={`${item.menuItemId}-${i}`}
            style={[styles.itemRow, i > 0 && styles.itemRowBorder]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>
                {item.quantity}× {item.name}
              </Text>
              {item.allergens.length > 0 ? (
                <Text style={styles.allergens}>
                  ⚠️ {item.allergens.join(", ")}
                </Text>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>
              {formatMoney(item.totalPence)}
            </Text>
          </View>
        ))}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Row label="Subtotal" value={formatMoney(data.subtotalPence)} />
        <Row label="Delivery" value={formatMoney(data.deliveryFeePence)} />
        {data.discountPence > 0 ? (
          <Row
            label={`Discount${data.discountCode ? ` (${data.discountCode})` : ""}`}
            value={`-${formatMoney(data.discountPence)}`}
          />
        ) : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatMoney(data.totalPence)}</Text>
        </View>
      </Card>

      {!isTerminal ? (
        <Card>
          <Text style={styles.section}>Other actions</Text>
          <View style={styles.actionsCol}>
            {ADMIN_ORDER_STATUSES.filter(
              (s) => s !== data.status && s !== next,
            ).map((s) => {
              const isDanger = s === "cancelled" || s === "rejected";
              return (
                <SecondaryButton
                  key={s}
                  label={`Mark as ${statusLabel(s)}`}
                  busy={saving === s}
                  tone={isDanger ? "danger" : "default"}
                  onPress={() =>
                    isDanger
                      ? confirmAndUpdate(s, s === "cancelled" ? "Cancel" : "Reject")
                      : void updateStatus(s)
                  }
                  style={{ marginBottom: 8 }}
                />
              );
            })}
          </View>
        </Card>
      ) : null}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.kv}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: palette.bg },
  container: { padding: 12 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ref: { fontSize: 20, fontWeight: "800", color: palette.text },
  muted: { color: palette.textMuted, fontSize: 13 },
  name: { color: palette.text, fontWeight: "600", fontSize: 15 },
  payment: { color: palette.text, marginTop: 6, fontWeight: "500" },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  kv: { color: palette.text, fontWeight: "500" },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  itemRow: { flexDirection: "row", paddingVertical: 10 },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: palette.border },
  itemName: { color: palette.text, fontWeight: "500", fontSize: 15 },
  itemPrice: { color: palette.text, fontWeight: "600" },
  allergens: { color: palette.warning, fontSize: 12, marginTop: 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  totalLabel: { fontWeight: "800", color: palette.text, fontSize: 17 },
  totalValue: { fontWeight: "800", color: palette.text, fontSize: 17 },
  actionsCol: { gap: 0 },
});
