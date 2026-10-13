import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiCall } from "@/api/client";
import { useApiGet } from "@/api/useApiGet";
import {
  ADMIN_BOOKING_STATUSES,
  type AdminBookingDetail,
} from "@/api/types";
import {
  Banner,
  ContactActions,
  PrimaryButton,
  SecondaryButton,
} from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { Card, StatusBadge } from "@/components/ui";
import { useBadges } from "@/hooks/useBadges";
import { formatRelative, palette } from "@/format";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "BookingDetail">;

type BookingStatusAction = (typeof ADMIN_BOOKING_STATUSES)[number];

export function BookingDetailScreen({ route }: Props): JSX.Element {
  const { id } = route.params;
  const { data, error, loading, reload } = useApiGet<AdminBookingDetail>(
    `/api/admin/bookings/${id}`,
    [id],
  );
  const [saving, setSaving] = useState<BookingStatusAction | null>(null);
  const { refresh: refreshBadges } = useBadges();
  const dialog = useDialog();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const updateStatus = async (next: BookingStatusAction): Promise<void> => {
    setSaving(next);
    const res = await apiCall({
      method: "POST",
      path: `/api/admin/bookings/${id}/status`,
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
    void refreshBadges({ force: true });
  };

  const confirm = async (
    next: BookingStatusAction,
    verb: string,
  ): Promise<void> => {
    const destructive = next === "rejected" || next === "cancelled";
    const ok = await dialog.confirm({
      title: `${verb} this booking?`,
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

  const isPending = data.status === "pending";
  const isTerminal =
    data.status === "cancelled" ||
    data.status === "rejected" ||
    data.status === "completed";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ref}>
              {data.reference ?? data.id.slice(0, 8)}
            </Text>
            <Text style={styles.muted}>
              Created {formatRelative(data.createdAt)}
            </Text>
          </View>
          <StatusBadge status={data.status} />
        </View>
        <Text style={styles.big}>
          {data.date} · {data.timeSlot}
        </Text>
        <Text style={styles.kv}>
          <Text style={styles.k}>Covers: </Text>
          {data.covers}
        </Text>
        {data.tableId ? (
          <Text style={styles.kv}>
            <Text style={styles.k}>Table: </Text>
            {data.tableId}
          </Text>
        ) : null}
        <Text style={styles.kv}>
          <Text style={styles.k}>Deposit: </Text>
          {data.depositPaid ? "✅ Paid" : "—"}
        </Text>
      </Card>

      {isPending ? (
        <View style={{ gap: 8, marginBottom: 12 }}>
          <PrimaryButton
            label="Accept booking"
            icon="✅"
            busy={saving === "confirmed"}
            onPress={() => void updateStatus("confirmed")}
          />
          <SecondaryButton
            label="Reject booking"
            icon="✖️"
            tone="danger"
            busy={saving === "rejected"}
            onPress={() => confirm("rejected", "Reject")}
          />
        </View>
      ) : null}

      {isTerminal ? (
        <Banner tone={data.status === "completed" ? "success" : "warning"}>
          This booking is {data.status}.
        </Banner>
      ) : null}

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.section}>Customer</Text>
        <Text style={styles.name}>{data.customerName}</Text>
        <Text style={styles.muted}>{data.customerPhone}</Text>
        <Text style={styles.muted}>{data.customerEmail}</Text>
        <ContactActions
          phone={data.customerPhone}
          email={data.customerEmail}
        />
      </Card>

      {!isPending && !isTerminal ? (
        <Card>
          <Text style={styles.section}>Other actions</Text>
          {ADMIN_BOOKING_STATUSES.filter((s) => s !== data.status).map((s) => {
            const isDanger = s === "cancelled" || s === "rejected";
            const verb = s === "completed" ? "Complete" : s === "cancelled" ? "Cancel" : s === "rejected" ? "Reject" : "Confirm";
            return (
              <SecondaryButton
                key={s}
                label={`Mark ${s}`}
                tone={isDanger ? "danger" : "default"}
                busy={saving === s}
                onPress={() =>
                  isDanger ? confirm(s, verb) : void updateStatus(s)
                }
                style={{ marginBottom: 8 }}
              />
            );
          })}
        </Card>
      ) : null}

      <View style={{ height: 32 }} />
    </ScrollView>
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
  ref: { fontSize: 16, fontWeight: "700", color: palette.text },
  big: { fontSize: 24, fontWeight: "800", color: palette.text, marginTop: 10 },
  muted: { color: palette.textMuted, fontSize: 13 },
  name: { color: palette.text, fontWeight: "600", fontSize: 15 },
  section: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  kv: { color: palette.text, marginTop: 6 },
  k: { color: palette.textMuted, fontWeight: "600" },
});
