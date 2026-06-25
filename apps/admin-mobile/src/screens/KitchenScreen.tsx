import { useCallback, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiCall } from "@/api/client";
import type { AdminOrderDetail, AdminOrderListItem, OrderItemSnapshot, OrderStatus } from "@/api/types";
import { useApiGet } from "@/api/useApiGet";
import { Banner, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { ScreenLayout, useScreenBottomPadding } from "@/components/ScreenLayout";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { formatDateTime, palette } from "@/format";
import {
  canTransitionOrderStatus,
  formatOrderAge,
  isKitchenOrder,
  isLateOrder,
} from "@/lib/order-operations";
import { printKitchenTicket } from "@/lib/order-printing";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "KitchenHome">;

type BusyState =
  | { kind: "status"; orderId: string; status: OrderStatus }
  | { kind: "print"; orderId: string }
  | null;

export function KitchenScreen({ navigation }: Props): JSX.Element {
  const { data, error, loading, reload } =
    useApiGet<AdminOrderListItem[]>("/api/admin/orders");
  const dialog = useDialog();
  const [busy, setBusy] = useState<BusyState>(null);
  const busyRef = useRef<BusyState>(null);
  const bottomPadding = useScreenBottomPadding(20);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const orders = useMemo(
    () => (data ?? []).filter(isKitchenOrder),
    [data],
  );

  const updateStatus = async (
    order: AdminOrderListItem,
    status: OrderStatus,
  ): Promise<void> => {
    if (busyRef.current) return;
    if (!canTransitionOrderStatus(order.status, status)) return;
    const state: BusyState = { kind: "status", orderId: order.id, status };
    busyRef.current = state;
    setBusy(state);
    try {
      const result = await apiCall<AdminOrderDetail>({
        method: "POST",
        path: `/api/admin/orders/${order.id}/status`,
        body: { status },
      });
      if (!result.ok) {
        await dialog.alert({
          title: "Couldn't update order",
          message: result.message,
          tone: "danger",
        });
        return;
      }
      await reload();
    } finally {
      busyRef.current = null;
      setBusy(null);
    }
  };

  const printTicket = async (order: AdminOrderListItem): Promise<void> => {
    if (busyRef.current) return;
    const state: BusyState = { kind: "print", orderId: order.id };
    busyRef.current = state;
    setBusy(state);
    try {
      const result = await apiCall<AdminOrderDetail>({
        path: `/api/admin/orders/${order.id}`,
      });
      if (!result.ok) throw new Error(result.message);
      await printKitchenTicket(result.data);
    } catch (err: unknown) {
      await dialog.alert({
        title: "Print failed",
        message: err instanceof Error ? err.message : String(err),
        tone: "danger",
      });
    } finally {
      busyRef.current = null;
      setBusy(null);
    }
  };

  if (loading && !data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!data && error) {
    return (
      <ScreenLayout>
        <Banner tone="danger">{error}</Banner>
        <SecondaryButton
          label="Try again"
          onPress={() => void reload()}
          style={styles.retryButton}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false}>
      {error ? (
        <View style={styles.bannerWrap}>
          <Banner tone="danger">{error}</Banner>
        </View>
      ) : null}
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading && Boolean(data)}
            onRefresh={() => void reload()}
            tintColor={palette.primary}
          />
        }
        ListEmptyComponent={<EmptyState message="No kitchen orders." />}
        renderItem={({ item }) => (
          <KitchenOrderCard
            order={item}
            busy={busy}
            onOpen={() => navigation.navigate("OrderDetail", { id: item.id })}
            onStart={() => void updateStatus(item, "making")}
            onReady={() => void updateStatus(item, "ready")}
            onPrint={() => void printTicket(item)}
          />
        )}
      />
    </ScreenLayout>
  );
}

function itemMetaLines(item: OrderItemSnapshot): string[] {
  const raw = item as unknown as Record<string, unknown>;
  const lines: string[] = [];
  const notes = raw.notes ?? raw.note;
  if (typeof notes === "string" && notes.trim()) lines.push(`Note: ${notes.trim()}`);
  for (const key of ["modifiers", "options"]) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      lines.push(value.trim());
    } else if (Array.isArray(value)) {
      const entries = value
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && "name" in entry) {
            return String((entry as { name?: unknown }).name ?? "");
          }
          return "";
        })
        .filter(Boolean);
      if (entries.length > 0) lines.push(entries.join(", "));
    }
  }
  return lines;
}

function groupedItems(items: OrderItemSnapshot[]): OrderItemSnapshot[] {
  const byName = new Map<string, OrderItemSnapshot>();
  for (const item of items) {
    const key = `${item.name}::${itemMetaLines(item).join("|")}`;
    const existing = byName.get(key);
    if (existing) {
      byName.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      byName.set(key, item);
    }
  }
  return Array.from(byName.values());
}

function KitchenOrderCard({
  order,
  busy,
  onOpen,
  onStart,
  onReady,
  onPrint,
}: {
  order: AdminOrderListItem;
  busy: BusyState;
  onOpen: () => void;
  onStart: () => void;
  onReady: () => void;
  onPrint: () => void;
}): JSX.Element {
  const late = isLateOrder(order);
  const canStart = canTransitionOrderStatus(order.status, "making");
  const canReady = canTransitionOrderStatus(order.status, "ready");
  const items = groupedItems(order.items);

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.card, late && styles.lateCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.flexText}>
            <Text style={styles.ref}>{order.reference ?? order.id.slice(0, 8)}</Text>
            <Text style={styles.meta}>
              {order.type} · {formatOrderAge(order.createdAt)} ·{" "}
              {formatDateTime(order.createdAt)}
            </Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {late ? (
          <View style={styles.lateRow}>
            <Ionicons name="time-outline" size={14} color={palette.warning} />
            <Text style={styles.lateText}>Late</Text>
          </View>
        ) : null}

        <View style={styles.items}>
          {items.length === 0 ? (
            <Text style={styles.meta}>No items on this order.</Text>
          ) : (
            items.map((item, index) => (
              <View
                key={`${item.menuItemId}-${index}`}
                style={[styles.itemRow, index > 0 && styles.itemBorder]}
              >
                <Text style={styles.itemName}>
                  {item.quantity} x {item.name}
                </Text>
                {itemMetaLines(item).map((line) => (
                  <Text key={line} style={styles.itemMeta}>
                    {line}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={styles.actions}>
          {canStart ? (
            <SecondaryButton
              label="Start making"
              busy={
                busy?.kind === "status" &&
                busy.orderId === order.id &&
                busy.status === "making"
              }
              disabled={busy !== null}
              onPress={onStart}
              style={styles.actionButton}
            />
          ) : null}
          {canReady ? (
            <SecondaryButton
              label="Mark ready"
              tone="success"
              busy={
                busy?.kind === "status" &&
                busy.orderId === order.id &&
                busy.status === "ready"
              }
              disabled={busy !== null}
              onPress={onReady}
              style={styles.actionButton}
            />
          ) : null}
          <SecondaryButton
            label="Print ticket"
            busy={busy?.kind === "print" && busy.orderId === order.id}
            disabled={busy !== null}
            onPress={onPrint}
            style={styles.actionButton}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  retryButton: { alignSelf: "flex-start", marginTop: 12 },
  bannerWrap: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 12, paddingTop: 14 },
  card: { marginBottom: 12, gap: 12 },
  lateCard: { borderColor: palette.warning },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  flexText: { flex: 1, minWidth: 0 },
  ref: { color: palette.text, fontSize: 22, fontWeight: "900" },
  meta: { color: palette.textMuted, fontSize: 13, lineHeight: 19 },
  lateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lateText: { color: palette.warning, fontSize: 12, fontWeight: "900" },
  items: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 4,
  },
  itemRow: { paddingVertical: 10 },
  itemBorder: { borderTopWidth: 1, borderTopColor: palette.border },
  itemName: { color: palette.text, fontWeight: "900", fontSize: 18 },
  itemMeta: { color: palette.textMuted, fontSize: 13, marginTop: 3 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: "31%",
    minWidth: 112,
  },
  pressed: { opacity: 0.7 },
});
