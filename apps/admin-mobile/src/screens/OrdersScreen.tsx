import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { AdminOrderListItem, OrderStatus } from "@/api/types";
import { useApiGet } from "@/api/useApiGet";
import { Banner, SecondaryButton } from "@/components/controls";
import { ScreenLayout, useScreenBottomPadding } from "@/components/ScreenLayout";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { useBadges } from "@/hooks/useBadges";
import { usePolling } from "@/hooks/usePolling";
import { dayBucket, formatDateTime, palette, shadow } from "@/format";
import {
  formatCurrencyGBP,
  formatOrderAge,
  inferPaymentStatus,
  isActiveOrder,
  isLateOrder,
  isTestOrderHeuristic,
  ORDER_STATUS_SHORT_LABELS,
} from "@/lib/order-operations";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "OrdersHome">;

type FilterKey = "active" | "all" | OrderStatus;
type SortKey = "newest" | "oldest" | "highest_total";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "active", label: "Active" },
  { key: "all", label: "All" },
  { key: "received", label: "Received" },
  { key: "making", label: "Making" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "rejected", label: "Rejected" },
];

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "highest_total", label: "Highest total" },
];

const SUMMARY_STATS: Array<{ key: FilterKey; label: string; color: string }> = [
  { key: "active", label: "Active", color: palette.primary },
  { key: "received", label: "Received", color: palette.info },
  { key: "making", label: "Making", color: palette.warning },
  { key: "ready", label: "Ready", color: palette.success },
  { key: "out_for_delivery", label: "Out", color: palette.accent },
];

function SkeletonLine({ width }: { width: `${number}%` }): JSX.Element {
  return <View style={[skeletonStyles.line, { width }]} />;
}

function SkeletonCard(): JSX.Element {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[skeletonStyles.card, { opacity }]}>
      <View style={skeletonStyles.row}>
        <SkeletonLine width="36%" />
        <SkeletonLine width="24%" />
      </View>
      <SkeletonLine width="72%" />
      <View style={skeletonStyles.row}>
        <SkeletonLine width="30%" />
        <SkeletonLine width="32%" />
      </View>
    </Animated.View>
  );
}

export function OrdersScreen({ navigation }: Props): JSX.Element {
  const [filter, setFilter] = useState<FilterKey>("active");
  const [sort, setSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const openingOrderRef = useRef<string | null>(null);
  const bottomPadding = useScreenBottomPadding(20);

  const { data, error, loading, reload } = useApiGet<AdminOrderListItem[]>(
    "/api/admin/orders",
  );
  const { refresh: refreshBadges } = useBadges();

  const doRefresh = useCallback(async () => {
    await reload();
    await refreshBadges();
    setLastUpdated(new Date());
  }, [reload, refreshBadges]);

  const openOrder = useCallback(
    (id: string) => {
      if (openingOrderRef.current) return;
      openingOrderRef.current = id;
      navigation.navigate("OrderDetail", { id });
      setTimeout(() => {
        openingOrderRef.current = null;
      }, 800);
    },
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  usePolling(
    useCallback(async () => {
      await doRefresh();
    }, [doRefresh]),
    20_000,
  );

  const list = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: list.length,
      active: list.filter(isActiveOrder).length,
    };
    for (const status of [
      "received",
      "making",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "rejected",
    ] as const satisfies readonly OrderStatus[]) {
      map[status] = list.filter((order) => order.status === status).length;
    }
    return map;
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byFilter = list.filter((order) => {
      if (filter === "all") return true;
      if (filter === "active") return isActiveOrder(order);
      return order.status === filter;
    });
    const byQuery = q
      ? byFilter.filter((order) =>
          [
            order.reference,
            order.customerName,
            order.customerPhone,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q)),
        )
      : byFilter;
    return [...byQuery].sort((a, b) => {
      if (sort === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      if (sort === "highest_total") return b.totalPence - a.totalPence;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [filter, list, query, sort]);

  const sections = useMemo(() => {
    const buckets: Record<"Today" | "Yesterday" | "Older", AdminOrderListItem[]> = {
      Today: [],
      Yesterday: [],
      Older: [],
    };
    for (const order of filtered) buckets[dayBucket(order.createdAt)].push(order);
    return (["Today", "Yesterday", "Older"] as const)
      .filter((key) => buckets[key].length > 0)
      .map((key) => ({ title: key, data: buckets[key] }));
  }, [filtered]);

  const selectedFilterLabel =
    FILTERS.find((item) => item.key === filter)?.label ?? "Orders";
  const isFirstLoad = loading && !data;
  const isPullRefreshing = loading && Boolean(data);
  const hasSearch = query.trim().length > 0;

  if (isFirstLoad) {
    return (
      <ScreenLayout
        scroll={false}
        header={
          <OrdersHeader
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
            sort={sort}
            onSortChange={setSort}
            counts={counts}
            lastUpdated={lastUpdated}
            onRefresh={() => void doRefresh()}
            refreshing={loading}
            error={null}
          />
        }
      >
        <View style={styles.skeletonList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
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
          onPress={() => void doRefresh()}
          style={styles.retryButton}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      scroll={false}
      header={
        <OrdersHeader
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          counts={counts}
          lastUpdated={lastUpdated}
          onRefresh={() => void doRefresh()}
          refreshing={loading}
          error={error}
        />
      }
    >
      <SectionList
        sections={sections}
        keyExtractor={(order) => order.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPadding },
        ]}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={() => void doRefresh()}
            tintColor={palette.primary}
          />
        }
        ListEmptyComponent={
          list.length === 0 ? (
            <EmptyState message="No active orders yet. New orders will appear here automatically." />
          ) : (
            <EmptyOrdersState
              filterLabel={selectedFilterLabel}
              hasSearch={hasSearch}
              onClear={() => {
                setQuery("");
                setFilter("active");
              }}
            />
          )
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => openOrder(item.id)} />
        )}
      />
    </ScreenLayout>
  );
}

function OrdersHeader({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  counts,
  lastUpdated,
  onRefresh,
  refreshing,
  error,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filter: FilterKey;
  onFilterChange: (value: FilterKey) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  counts: Record<string, number>;
  lastUpdated: Date;
  onRefresh: () => void;
  refreshing: boolean;
  error: string | null;
}): JSX.Element {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.subheader}>
        <Text style={styles.subheaderText}>
          Updated {formatOrderAge(lastUpdated)}
        </Text>
        <Pressable
          onPress={onRefresh}
          disabled={refreshing}
          style={({ pressed }) => [
            styles.refreshBtn,
            (pressed || refreshing) && styles.pressed,
          ]}
          hitSlop={8}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <Ionicons name="refresh" size={14} color={palette.primary} />
          )}
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner tone="danger">{error}</Banner>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={palette.textMuted} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search ref, customer, phone"
          placeholderTextColor={palette.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {query.trim() ? (
          <Pressable
            onPress={() => onQueryChange("")}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={palette.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryStrip}
      >
        {SUMMARY_STATS.map((item) => {
          const selected = filter === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onFilterChange(item.key)}
              style={({ pressed }) => [
                styles.summaryChip,
                selected && {
                  borderColor: item.color,
                  backgroundColor: `${item.color}14`,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.summaryCount,
                  { color: selected ? item.color : palette.text },
                ]}
              >
                {counts[item.key] ?? 0}
              </Text>
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        {FILTERS.map((item) => (
          <Chip
            key={item.key}
            label={item.label}
            count={counts[item.key] ?? 0}
            active={item.key === filter}
            onPress={() => onFilterChange(item.key)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortStrip}
      >
        {SORTS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => onSortChange(item.key)}
            style={({ pressed }) => [
              styles.sortChip,
              sort === item.key && styles.sortChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.sortText,
                sort === item.key && styles.sortTextActive,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
      {count > 0 ? (
        <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
          <Text
            style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}
            numberOfLines={1}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function PaymentBadge({ order }: { order: AdminOrderListItem }): JSX.Element {
  const payment = inferPaymentStatus(order);
  const tone =
    payment.tone === "paid"
      ? { bg: palette.successBg, fg: palette.success }
      : payment.tone === "cash"
        ? { bg: palette.infoBg, fg: palette.info }
        : payment.tone === "unpaid"
          ? { bg: palette.warningBg, fg: palette.warning }
          : { bg: palette.surfaceAlt, fg: palette.textMuted };
  return (
    <View style={[styles.paymentBadge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.paymentText, { color: tone.fg }]} numberOfLines={1}>
        {payment.shortLabel}
      </Text>
    </View>
  );
}

function WarningBadge({ label }: { label: string }): JSX.Element {
  return (
    <View style={styles.warningBadge}>
      <Text style={styles.warningText}>{label}</Text>
    </View>
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: AdminOrderListItem;
  onPress: () => void;
}): JSX.Element {
  const late = isLateOrder(order);
  const test = isTestOrderHeuristic(order);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.card, late && styles.lateCard]}>
        <View style={styles.cardTop}>
          <View style={styles.flexText}>
            <Text style={styles.cardRef} numberOfLines={1}>
              {order.reference ?? order.id.slice(0, 8)}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {order.customerName || "Customer"} · {order.type}
            </Text>
          </View>
          <Text style={styles.cardAmount}>{formatCurrencyGBP(order.totalPence)}</Text>
        </View>

        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>
            {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
            {formatOrderAge(order.createdAt)} · {formatDateTime(order.createdAt)}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <StatusBadge status={order.status} />
          <PaymentBadge order={order} />
          {late ? <WarningBadge label="Late" /> : null}
          {test ? <WarningBadge label="Test" /> : null}
        </View>

        <Text style={styles.nextHint} numberOfLines={1}>
          {ORDER_STATUS_SHORT_LABELS[order.status]}
        </Text>
      </Card>
    </Pressable>
  );
}

function EmptyOrdersState({
  filterLabel,
  hasSearch,
  onClear,
}: {
  filterLabel: string;
  hasSearch: boolean;
  onClear: () => void;
}): JSX.Element {
  return (
    <View style={styles.emptyWrap}>
      <EmptyState
        message={
          hasSearch
            ? "No orders match that search."
            : filterLabel === "Active"
              ? "No active orders right now."
              : `No ${filterLabel.toLowerCase()} orders.`
        }
      />
      <SecondaryButton
        label="Show active"
        onPress={onClear}
        style={styles.emptyButton}
      />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 10,
    gap: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  line: { height: 12, backgroundColor: palette.border, borderRadius: 6 },
});

const styles = StyleSheet.create({
  headerWrap: {
    paddingTop: 8,
    backgroundColor: palette.surface,
  },
  subheader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  subheaderText: { fontSize: 12, color: palette.textMuted },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  refreshBtnText: { fontSize: 12, fontWeight: "700", color: palette.primary },
  bannerWrap: { paddingHorizontal: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceAlt,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: palette.text,
    fontSize: 14,
    paddingVertical: 9,
  },
  summaryStrip: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  summaryChip: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    ...shadow,
  },
  summaryCount: { fontSize: 20, fontWeight: "900" },
  summaryLabel: {
    fontSize: 10,
    color: palette.textMuted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0,
    marginTop: 2,
  },
  filterStrip: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  sortStrip: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
    minWidth: 86,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { color: palette.text, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: palette.primaryText },
  chipBadge: {
    backgroundColor: palette.bg,
    borderRadius: 999,
    minWidth: 24,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chipBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  chipBadgeText: { color: palette.text, fontSize: 10, fontWeight: "900" },
  chipBadgeTextActive: { color: palette.primaryText },
  sortChip: {
    minHeight: 34,
    minWidth: 104,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sortChipActive: { borderColor: palette.primary, backgroundColor: palette.primary },
  sortText: { color: palette.textMuted, fontSize: 11, fontWeight: "800" },
  sortTextActive: { color: palette.primaryText },
  list: { paddingHorizontal: 12, paddingTop: 10 },
  skeletonList: { padding: 12 },
  retryButton: { alignSelf: "flex-start", marginTop: 12 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 6,
  },
  card: { marginBottom: 10, gap: 8 },
  lateCard: { borderColor: palette.warning },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  flexText: { flex: 1, minWidth: 0 },
  cardRef: { fontWeight: "900", color: palette.text, fontSize: 16 },
  cardSub: { color: palette.textMuted, fontSize: 13, marginTop: 2 },
  cardAmount: {
    fontWeight: "900",
    color: palette.text,
    fontSize: 15,
    textAlign: "right",
  },
  cardMetaRow: { flexDirection: "row", alignItems: "center" },
  cardMeta: { color: palette.textMuted, fontSize: 11 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  paymentText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  warningBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: palette.warningBg,
  },
  warningText: {
    color: palette.warning,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextHint: { color: palette.textMuted, fontSize: 11, fontWeight: "700" },
  emptyWrap: { paddingHorizontal: 12, paddingTop: 40, gap: 12 },
  emptyButton: { alignSelf: "center" },
  pressed: { opacity: 0.7 },
});
