import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApiGet } from "@/api/useApiGet";
import type {
  AdminBookingListItem,
  AdminDashboardStats,
  AdminOrderListItem,
} from "@/api/types";
import { useSession } from "@/auth/SessionContext";
import { ScreenLayout } from "@/components/ScreenLayout";
import {
  Card,
  EmptyState,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { Banner, PrimaryButton, SecondaryButton } from "@/components/controls";
import { usePolling } from "@/hooks/usePolling";
import { formatRelative, palette, shadow } from "@/format";
import { formatCurrencyGBP, isActiveOrder } from "@/lib/order-operations";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "DashboardHome">;

export function DashboardScreen({ navigation }: Props): JSX.Element {
  const { user } = useSession();
  const { data, error, loading, reload } = useApiGet<AdminDashboardStats>(
    "/api/admin/dashboard",
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

  const greetingName = user?.email?.split("@")[0] ?? "there";
  const activeOrders = (data?.latestOrders ?? []).filter(isActiveOrder);
  const pendingCount = data?.pendingBookingsCount ?? 0;

  return (
    <ScreenLayout
      refreshing={loading}
      onRefresh={() => void reload()}
      contentContainerStyle={styles.container}
    >
      <View style={styles.hello}>
        <Text style={styles.helloTitle}>
          {greetTime()}, {greetingName}
        </Text>
        <Text style={styles.helloSub}>Here is what is happening today</Text>
      </View>

      {error ? <Banner tone="danger">{error}</Banner> : null}

      {data ? (
        <>
          {activeOrders.length > 0 || pendingCount > 0 ? (
            <View style={styles.attention}>
              <Text style={styles.attentionTitle}>Needs your attention</Text>
              <View style={styles.attentionRow}>
                {activeOrders.length > 0 ? (
                  <PrimaryButton
                    label={`${activeOrders.length} active order${activeOrders.length === 1 ? "" : "s"}`}
                    onPress={() => navigation.getParent()?.navigate("Orders")}
                    style={styles.attentionBtn}
                  />
                ) : null}
                {pendingCount > 0 ? (
                  <PrimaryButton
                    label={`${pendingCount} pending booking${pendingCount === 1 ? "" : "s"}`}
                    onPress={() => navigation.getParent()?.navigate("Bookings")}
                    style={styles.attentionBtn}
                  />
                ) : null}
              </View>
            </View>
          ) : (
            <Banner tone="success">All caught up - no pending actions</Banner>
          )}

          <Text style={styles.heading}>Today</Text>
          <View style={styles.grid}>
            <StatCard label="Orders" value={data.todayOrderCount} />
            <StatCard
              label="Revenue"
              value={formatCurrencyGBP(data.todayRevenuePence)}
              tone="good"
            />
          </View>
          <View style={[styles.grid, { marginTop: 10 }]}>
            <StatCard
              label="Bookings"
              value={data.todayBookingCount}
            />
            <StatCard
              label="Pending"
              value={data.pendingBookingsCount}
              tone={data.pendingBookingsCount > 0 ? "warn" : "default"}
            />
          </View>
          <View style={[styles.grid, { marginTop: 10 }]}>
            <StatCard
              label="Menu live"
              value={data.activeMenuItemsCount}
            />
            <StatCard
              label="Unavailable"
              value={data.unavailableMenuItemsCount}
              tone={data.unavailableMenuItemsCount > 0 ? "warn" : "default"}
            />
          </View>

          <SectionHeader title="Latest orders" />
          {data.latestOrders.length === 0 ? (
            <EmptyState message="No orders yet" />
          ) : (
            data.latestOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onPress={() => navigation.navigate("OrderDetail", { id: order.id })}
              />
            ))
          )}

          <SectionHeader title="Latest bookings" />
          {data.latestBookings.length === 0 ? (
            <EmptyState message="No bookings yet" />
          ) : (
            data.latestBookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                onPress={() =>
                  navigation.navigate("BookingDetail", { id: booking.id })
                }
              />
            ))
          )}

          <Text style={styles.generated}>
            Updated {formatRelative(data.generatedAt)}
          </Text>
        </>
      ) : null}
    </ScreenLayout>
  );
}

function greetTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function OrderRow({
  order,
  onPress,
}: {
  order: AdminOrderListItem;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.6 }}
    >
      <Card style={styles.rowCard}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle}>
            {order.reference ?? order.id.slice(0, 8)}
          </Text>
          <Text style={styles.rowAmount}>{formatCurrencyGBP(order.totalPence)}</Text>
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowSub}>
            {order.customerName} · {order.type}
          </Text>
          <StatusBadge status={order.status} />
        </View>
      </Card>
    </Pressable>
  );
}

function BookingRow({
  booking,
  onPress,
}: {
  booking: AdminBookingListItem;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.6 }}
    >
      <Card style={styles.rowCard}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle}>
            {booking.date} · {booking.timeSlot}
          </Text>
          <Text style={styles.rowAmount}>{booking.covers} covers</Text>
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowSub}>{booking.customerName}</Text>
          <StatusBadge status={booking.status} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  hello: { marginBottom: 18 },
  helloTitle: { fontSize: 22, fontWeight: "800", color: palette.text },
  helloSub: { color: palette.textMuted, marginTop: 2 },
  attention: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    marginBottom: 16,
    ...shadow,
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 12,
  },
  attentionRow: { gap: 10 },
  attentionBtn: { width: "100%", minHeight: 54 },
  heading: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 16,
  },
  grid: { flexDirection: "row", gap: 10 },
  rowCard: { marginBottom: 8 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "700", color: palette.text },
  rowAmount: { fontSize: 14, fontWeight: "700", color: palette.text },
  rowMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  rowSub: { fontSize: 12, color: palette.textMuted, flexShrink: 1 },
  generated: {
    marginTop: 16,
    fontSize: 11,
    color: palette.textMuted,
    textAlign: "center",
  },
  retryButton: { alignSelf: "flex-start", marginTop: 12 },
});
