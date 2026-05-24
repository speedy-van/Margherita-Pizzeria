import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApiGet } from "@/api/useApiGet";
import type { AdminOrderListItem, OrderStatus } from "@/api/types";
import { Banner } from "@/components/controls";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { useBadges } from "@/hooks/useBadges";
import { usePolling } from "@/hooks/usePolling";
import { dayBucket, formatRelative, formatMoney, palette } from "@/format";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "OrdersHome">;

const FILTERS: Array<{ key: "all" | "active" | OrderStatus; label: string }> = [
  { key: "active", label: "Active" },
  { key: "all", label: "All" },
  { key: "received", label: "Received" },
  { key: "making", label: "Making" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  "received",
  "making",
  "ready",
  "out_for_delivery",
];

export function OrdersScreen({ navigation }: Props): JSX.Element {
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["key"]>("active");
  const { data, error, loading, reload } = useApiGet<AdminOrderListItem[]>(
    "/api/admin/orders",
  );
  const { refresh: refreshBadges } = useBadges();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  usePolling(
    useCallback(async () => {
      await reload();
      await refreshBadges();
    }, [reload, refreshBadges]),
    20_000,
  );

  const list = data ?? [];
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: list.length,
      active: list.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    };
    for (const s of [
      "received",
      "making",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ] as OrderStatus[]) {
      map[s] = list.filter((o) => o.status === s).length;
    }
    return map;
  }, [list]);

  const filtered = useMemo<AdminOrderListItem[]>(() => {
    if (filter === "all") return list;
    if (filter === "active")
      return list.filter((o) => ACTIVE_STATUSES.includes(o.status));
    return list.filter((o) => o.status === filter);
  }, [list, filter]);

  const sections = useMemo(() => {
    const buckets: Record<"Today" | "Yesterday" | "Older", AdminOrderListItem[]> = {
      Today: [],
      Yesterday: [],
      Older: [],
    };
    for (const o of filtered) buckets[dayBucket(o.createdAt)].push(o);
    return (["Today", "Yesterday", "Older"] as const)
      .filter((k) => buckets[k].length > 0)
      .map((k) => ({ title: k, data: buckets[k] }));
  }, [filtered]);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const n = counts[f.key] ?? 0;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
              {n > 0 ? (
                <View
                  style={[
                    styles.chipBadge,
                    active && styles.chipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipBadgeText,
                      active && styles.chipBadgeTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <View style={{ paddingHorizontal: 12 }}>
          <Banner tone="danger">{error}</Banner>
        </View>
      ) : null}

      {loading && !data ? (
        <ActivityIndicator color={palette.primary} style={{ marginTop: 32 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <EmptyState message="No orders for this filter" />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void reload()}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate("OrderDetail", { id: item.id })
              }
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Card style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={styles.title}>
                    {item.reference ?? item.id.slice(0, 8)}
                  </Text>
                  <Text style={styles.amount}>
                    {formatMoney(item.totalPence)}
                  </Text>
                </View>
                <Text style={styles.sub}>
                  {item.customerName} · {item.type} · {item.itemCount} item
                  {item.itemCount === 1 ? "" : "s"}
                </Text>
                <View style={styles.rowBottom}>
                  <Text style={styles.meta}>
                    {formatRelative(item.createdAt)}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.bg },
  filters: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipText: { color: palette.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: palette.primaryText },
  chipBadge: {
    backgroundColor: palette.bg,
    borderRadius: 999,
    paddingHorizontal: 6,
    minWidth: 18,
    alignItems: "center",
  },
  chipBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  chipBadgeText: { color: palette.text, fontSize: 11, fontWeight: "700" },
  chipBadgeTextActive: { color: palette.primaryText },
  list: { padding: 12, paddingBottom: 32, gap: 8 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  card: { marginBottom: 8 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowBottom: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontWeight: "700", color: palette.text, fontSize: 15 },
  amount: { fontWeight: "700", color: palette.text },
  sub: { color: palette.textMuted },
  meta: { color: palette.textMuted, fontSize: 11 },
});
