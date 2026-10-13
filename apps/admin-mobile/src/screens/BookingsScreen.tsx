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
import type { AdminBookingListItem, BookingStatus } from "@/api/types";
import { Banner } from "@/components/controls";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { usePolling } from "@/hooks/usePolling";
import { palette } from "@/format";
import { useLanguage } from "@/i18n/LanguageContext";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "BookingsHome">;

const FILTERS: Array<{ key: "all" | BookingStatus; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "rejected", label: "Rejected" },
];

export function BookingsScreen({ navigation }: Props): JSX.Element {
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["key"]>("pending");
  const { relativeTime, t } = useLanguage();
  const { data, error, loading, reload } = useApiGet<AdminBookingListItem[]>(
    "/api/admin/bookings",
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  usePolling(
    useCallback(async () => {
      await reload();
    }, [reload]),
    30_000,
  );

  const list = data ?? [];

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: list.length };
    for (const s of [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "rejected",
    ] as BookingStatus[]) {
      map[s] = list.filter((b) => b.status === s).length;
    }
    return map;
  }, [list]);

  const filtered = useMemo<AdminBookingListItem[]>(() => {
    if (filter === "all") return list;
    return list.filter((b) => b.status === filter);
  }, [list, filter]);

  // Group bookings by date (the reservation date, not createdAt).
  const sections = useMemo(() => {
    const map = new Map<string, AdminBookingListItem[]>();
    for (const b of filtered) {
      const key = b.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([title, data]) => ({ title, data }));
  }, [filtered]);

  return (
    <View style={styles.wrap}>
      <View style={styles.filtersBar}>
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
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {t(f.label)}
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
                      numberOfLines={1}
                    >
                      {n}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

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
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <EmptyState message={t("No bookings for this filter")} />
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
                navigation.navigate("BookingDetail", { id: item.id })
              }
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Card style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={styles.title}>
                    {item.timeSlot} · {item.covers}{" "}
                    {t(item.covers === 1 ? "cover" : "covers")}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.sub}>{item.customerName}</Text>
                <Text style={styles.meta}>
                  {t("Booked")} {relativeTime(item.createdAt)}
                </Text>
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
  filtersBar: {
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  filters: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  chipTextActive: { color: palette.primaryText },
  chipBadge: {
    backgroundColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 7,
    height: 18,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chipBadgeActive: { backgroundColor: "rgba(255,255,255,0.28)" },
  chipBadgeText: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
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
    alignItems: "center",
    marginBottom: 6,
  },
  title: { fontWeight: "700", color: palette.text, fontSize: 15 },
  sub: { color: palette.text, fontWeight: "500" },
  meta: { color: palette.textMuted, fontSize: 11, marginTop: 4 },
});
