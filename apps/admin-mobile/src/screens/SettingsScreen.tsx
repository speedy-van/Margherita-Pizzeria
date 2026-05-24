import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiCall } from "@/api/client";
import { useApiGet } from "@/api/useApiGet";
import type {
  AdminSettings,
  OpeningHours,
  OpeningHoursDay,
} from "@/api/types";
import { WEEKDAYS } from "@/api/types";
import { Banner, PrimaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { palette, shadow } from "@/format";

export function SettingsScreen(): JSX.Element {
  const { data, error, loading, reload } = useApiGet<AdminSettings>(
    "/api/admin/settings",
  );
  const dialog = useDialog();

  const [minDeliveryText, setMinDeliveryText] = useState("");
  const [deliveryFeeText, setDeliveryFeeText] = useState("");
  const [prepText, setPrepText] = useState("");
  const [deliveryTimeText, setDeliveryTimeText] = useState("");
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositText, setDepositText] = useState("");
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    if (!data) return;
    setMinDeliveryText((data.minDeliveryOrderPence / 100).toFixed(2));
    setDeliveryFeeText((data.deliveryFeePence / 100).toFixed(2));
    setPrepText(String(data.prepTimeMinutes));
    setDeliveryTimeText(String(data.deliveryTimeMinutes));
    setDepositEnabled(data.depositEnabled);
    setDepositText((data.depositAmountPence / 100).toFixed(2));
    setHours(data.openingHours);
  }, [data]);

  const save = async (): Promise<void> => {
    if (!hours) return;
    const body: AdminSettings = {
      minDeliveryOrderPence: Math.round(parseFloat(minDeliveryText || "0") * 100),
      deliveryFeePence: Math.round(parseFloat(deliveryFeeText || "0") * 100),
      prepTimeMinutes: parseInt(prepText || "0", 10),
      deliveryTimeMinutes: parseInt(deliveryTimeText || "0", 10),
      depositEnabled,
      depositAmountPence: Math.round(parseFloat(depositText || "0") * 100),
      openingHours: hours,
    };
    setSaving(true);
    const res = await apiCall({
      method: "PUT",
      path: "/api/admin/settings",
      body,
    });
    setSaving(false);
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't save",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    setSavedAt(Date.now());
    await reload();
  };

  const updateDay = (
    day: (typeof WEEKDAYS)[number],
    patch: Partial<OpeningHoursDay>,
  ): void => {
    if (!hours) return;
    setHours({ ...hours, [day]: { ...hours[day], ...patch } });
  };

  // Auto-clear "saved" banner after 3s.
  useEffect(() => {
    if (!savedAt) return;
    const id = setTimeout(() => setSavedAt(null), 3000);
    return () => clearTimeout(id);
  }, [savedAt]);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {savedAt ? (
        <View style={{ marginBottom: 12 }}>
          <Banner tone="success">Settings saved ✓</Banner>
        </View>
      ) : null}

      <Text style={styles.section}>🚚 Delivery</Text>
      <Field
        label="Minimum delivery order (£)"
        value={minDeliveryText}
        onChange={setMinDeliveryText}
        keyboardType="decimal-pad"
      />
      <Field
        label="Delivery fee (£)"
        value={deliveryFeeText}
        onChange={setDeliveryFeeText}
        keyboardType="decimal-pad"
      />
      <Field
        label="Prep time (minutes)"
        value={prepText}
        onChange={setPrepText}
        keyboardType="number-pad"
      />
      <Field
        label="Delivery time (minutes)"
        value={deliveryTimeText}
        onChange={setDeliveryTimeText}
        keyboardType="number-pad"
      />

      <Text style={styles.section}>📅 Bookings</Text>
      <View style={styles.depositRow}>
        <Switch value={depositEnabled} onValueChange={setDepositEnabled} />
        <Text style={styles.rowLabel}>Require deposit per cover</Text>
      </View>
      {depositEnabled ? (
        <Field
          label="Deposit per cover (£)"
          value={depositText}
          onChange={setDepositText}
          keyboardType="decimal-pad"
        />
      ) : null}

      <Text style={styles.section}>🕒 Opening hours</Text>
      {hours
        ? WEEKDAYS.map((day) => {
            const d = hours[day];
            return (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day}</Text>
                  <View style={styles.dayToggle}>
                    <Switch
                      value={!d.closed}
                      onValueChange={(v) => updateDay(day, { closed: !v })}
                    />
                    <Text
                      style={[
                        styles.dayState,
                        { color: d.closed ? palette.danger : palette.success },
                      ]}
                    >
                      {d.closed ? "Closed" : "Open"}
                    </Text>
                  </View>
                </View>
                {!d.closed ? (
                  <View style={styles.timeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeLabel}>Open</Text>
                      <TextInput
                        value={d.open}
                        onChangeText={(v) => updateDay(day, { open: v })}
                        style={styles.input}
                        placeholder="09:00"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timeLabel}>Close</Text>
                      <TextInput
                        value={d.close}
                        onChangeText={(v) => updateDay(day, { close: v })}
                        style={styles.input}
                        placeholder="22:00"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        : null}

      <PrimaryButton
        label="Save settings"
        icon="💾"
        busy={saving}
        onPress={save}
        style={{ marginTop: 24 }}
      />
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
}): JSX.Element {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
        style={styles.input}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: palette.bg },
  container: { padding: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  section: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.text,
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: palette.text,
    fontWeight: "600",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  depositRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
  },
  rowLabel: { color: palette.text, fontSize: 14, fontWeight: "600" },
  dayCard: {
    backgroundColor: palette.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 8,
    ...shadow,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: {
    color: palette.text,
    fontWeight: "700",
    textTransform: "capitalize",
    fontSize: 15,
  },
  dayToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayState: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  timeRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  timeLabel: { color: palette.textMuted, fontSize: 12, marginBottom: 4 },
});
