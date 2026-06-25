import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
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
import { Banner, PrimaryButton, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { ScreenLayout } from "@/components/ScreenLayout";
import { Card, EmptyState } from "@/components/ui";
import { palette, shadow } from "@/format";

type BusyMode = AdminSettings["busyMode"];

const BUSY_MODES: Array<{ value: BusyMode; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "busy", label: "Busy" },
  { value: "very_busy", label: "Very busy" },
];

export function SettingsScreen(): JSX.Element {
  const { data, error, loading, reload } = useApiGet<AdminSettings>(
    "/api/admin/settings",
  );
  const dialog = useDialog();

  const [acceptingOnlineOrders, setAcceptingOnlineOrders] = useState(true);
  const [collectionOpen, setCollectionOpen] = useState(true);
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [busyMode, setBusyMode] = useState<BusyMode>("normal");
  const [customerMessage, setCustomerMessage] = useState("");
  const [minDeliveryText, setMinDeliveryText] = useState("");
  const [deliveryFeeText, setDeliveryFeeText] = useState("");
  const [prepText, setPrepText] = useState("");
  const [deliveryTimeText, setDeliveryTimeText] = useState("");
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositText, setDepositText] = useState("");
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    if (!data) return;
    setAcceptingOnlineOrders(data.acceptingOnlineOrders);
    setCollectionOpen(data.collectionOpen);
    setDeliveryOpen(data.deliveryOpen);
    setBusyMode(data.busyMode);
    setCustomerMessage(data.customerMessage);
    setMinDeliveryText((data.minDeliveryOrderPence / 100).toFixed(2));
    setDeliveryFeeText((data.deliveryFeePence / 100).toFixed(2));
    setPrepText(String(data.prepTimeMinutes));
    setDeliveryTimeText(String(data.deliveryTimeMinutes));
    setDepositEnabled(data.depositEnabled);
    setDepositText((data.depositAmountPence / 100).toFixed(2));
    setHours(data.openingHours);
  }, [data]);

  useEffect(() => {
    if (!savedAt) return;
    const id = setTimeout(() => setSavedAt(null), 3000);
    return () => clearTimeout(id);
  }, [savedAt]);

  const parseMoney = (value: string): number => {
    const parsed = Number.parseFloat(value || "0");
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.round(parsed * 100));
  };

  const parseMinutes = (value: string): number =>
    Math.max(0, Number.parseInt(value || "0", 10) || 0);

  const save = async (): Promise<void> => {
    if (!hours || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const body: AdminSettings = {
      acceptingOnlineOrders,
      collectionOpen,
      deliveryOpen,
      busyMode,
      customerMessage: customerMessage.trim(),
      minDeliveryOrderPence: parseMoney(minDeliveryText),
      deliveryFeePence: parseMoney(deliveryFeeText),
      prepTimeMinutes: parseMinutes(prepText),
      deliveryTimeMinutes: parseMinutes(deliveryTimeText),
      depositEnabled,
      depositAmountPence: parseMoney(depositText),
      openingHours: hours,
    };
    const res = await apiCall<AdminSettings>({
      method: "PUT",
      path: "/api/admin/settings",
      body,
    });
    savingRef.current = false;
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

  const handleAcceptingToggle = async (next: boolean): Promise<void> => {
    if (next) {
      setAcceptingOnlineOrders(true);
      return;
    }
    const ok = await dialog.confirm({
      title: "Pause online orders?",
      message:
        "Customers will not be able to place public online orders until this is turned back on.",
      confirmLabel: "Pause orders",
      cancelLabel: "Keep accepting",
      destructive: true,
    });
    if (ok) setAcceptingOnlineOrders(false);
  };

  const updateDay = (
    day: (typeof WEEKDAYS)[number],
    patch: Partial<OpeningHoursDay>,
  ): void => {
    if (!hours) return;
    setHours({ ...hours, [day]: { ...hours[day], ...patch } });
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

  if (!data) {
    return (
      <ScreenLayout>
        <EmptyState message="No settings found" />
        <SecondaryButton
          label="Reload settings"
          onPress={() => void reload()}
          style={styles.retryButton}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      refreshing={loading}
      onRefresh={() => void reload()}
      keyboardShouldPersistTaps="handled"
    >
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {savedAt ? <Banner tone="success">Settings saved</Banner> : null}

      <Section title="Store controls">
        <ToggleRow
          label="Accepting online orders"
          value={acceptingOnlineOrders}
          onValueChange={(value) => void handleAcceptingToggle(value)}
        />
        <ToggleRow
          label="Collection open"
          value={collectionOpen}
          onValueChange={setCollectionOpen}
        />
        <ToggleRow
          label="Delivery open"
          value={deliveryOpen}
          onValueChange={setDeliveryOpen}
        />
        <Text style={styles.label}>Busy mode</Text>
        <View style={styles.segmented}>
          {BUSY_MODES.map((mode) => {
            const active = mode.value === busyMode;
            return (
              <Pressable
                key={mode.value}
                onPress={() => setBusyMode(mode.value)}
                style={({ pressed }) => [
                  styles.segment,
                  active && styles.segmentActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Field
          label="Default collection prep minutes"
          value={prepText}
          onChange={setPrepText}
          keyboardType="number-pad"
        />
        <Field
          label="Default delivery prep minutes"
          value={deliveryTimeText}
          onChange={setDeliveryTimeText}
          keyboardType="number-pad"
        />
        <Field
          label="Customer message"
          value={customerMessage}
          onChange={setCustomerMessage}
          placeholder="Shown when ordering is paused or busy"
          multiline
        />
      </Section>

      <Section title="Delivery">
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
      </Section>

      <Section title="Bookings">
        <ToggleRow
          label="Require deposit per cover"
          value={depositEnabled}
          onValueChange={setDepositEnabled}
        />
        {depositEnabled ? (
          <Field
            label="Deposit per cover (£)"
            value={depositText}
            onChange={setDepositText}
            keyboardType="decimal-pad"
          />
        ) : null}
      </Section>

      <Section title="Opening hours">
        {hours
          ? WEEKDAYS.map((day) => {
              const entry = hours[day];
              return (
                <View key={day} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>{day}</Text>
                    <View style={styles.dayToggle}>
                      <Switch
                        value={!entry.closed}
                        onValueChange={(value) => updateDay(day, { closed: !value })}
                      />
                      <Text
                        style={[
                          styles.dayState,
                          {
                            color: entry.closed ? palette.danger : palette.success,
                          },
                        ]}
                      >
                        {entry.closed ? "Closed" : "Open"}
                      </Text>
                    </View>
                  </View>
                  {!entry.closed ? (
                    <View style={styles.timeRow}>
                      <View style={styles.timeField}>
                        <Text style={styles.timeLabel}>Open</Text>
                        <TextInput
                          value={entry.open}
                          onChangeText={(value) => updateDay(day, { open: value })}
                          style={styles.input}
                          placeholder="09:00"
                          placeholderTextColor={palette.textMuted}
                        />
                      </View>
                      <View style={styles.timeField}>
                        <Text style={styles.timeLabel}>Close</Text>
                        <TextInput
                          value={entry.close}
                          onChangeText={(value) => updateDay(day, { close: value })}
                          style={styles.input}
                          placeholder="22:00"
                          placeholderTextColor={palette.textMuted}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          : null}
      </Section>

      <PrimaryButton
        label="Save settings"
        busy={saving}
        disabled={saving}
        onPress={() => void save()}
        style={styles.saveButton}
      />
    </ScreenLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </Card>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}): JSX.Element {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  placeholder?: string;
  multiline?: boolean;
}): JSX.Element {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </>
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
  sectionCard: { marginBottom: 14 },
  section: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 12,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: palette.text,
    fontWeight: "700",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: palette.surfaceAlt,
    color: palette.text,
    minHeight: 46,
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  rowLabel: { color: palette.text, fontSize: 14, fontWeight: "700", flex: 1 },
  segmented: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  segmentText: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 12,
  },
  segmentTextActive: { color: palette.primaryText },
  pressed: { opacity: 0.7 },
  dayCard: {
    backgroundColor: palette.surfaceAlt,
    padding: 12,
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
    gap: 12,
  },
  dayName: {
    color: palette.text,
    fontWeight: "800",
    textTransform: "capitalize",
    fontSize: 14,
    flex: 1,
  },
  dayToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayState: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  timeRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  timeField: { flex: 1, minWidth: 0 },
  timeLabel: { color: palette.textMuted, fontSize: 12, marginBottom: 4 },
  saveButton: { marginTop: 8 },
});
