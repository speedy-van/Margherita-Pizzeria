import { useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiCall } from "@/api/client";
import { useApiGet } from "@/api/useApiGet";
import type { AdminDiscount, DiscountType } from "@/api/types";
import { PrimaryButton, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { palette, shadow } from "@/format";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "DiscountEdit">;

export function DiscountEditScreen({ route, navigation }: Props): JSX.Element {
  const { id } = route.params;
  const isNew = id === null;
  const { data: list, loading } = useApiGet<AdminDiscount[]>(
    "/api/admin/discounts",
  );
  const existing = useMemo<AdminDiscount | null>(() => {
    if (isNew || !list) return null;
    return list.find((d) => d.id === id) ?? null;
  }, [list, id, isNew]);

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DiscountType>("percentage");
  const [valueText, setValueText] = useState("10");
  const [minOrderText, setMinOrderText] = useState("0");
  const [active, setActive] = useState(true);
  const [appliesToDelivery, setAppliesToDelivery] = useState(true);
  const [appliesToCollection, setAppliesToCollection] = useState(true);
  const [saving, setSaving] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    if (existing) {
      setCode(existing.code);
      setTitle(existing.title);
      setDescription(existing.description ?? "");
      setType(existing.type);
      setValueText(
        existing.type === "fixed"
          ? (existing.value / 100).toFixed(2)
          : String(existing.value),
      );
      setMinOrderText((existing.minOrderPence / 100).toFixed(2));
      setActive(existing.active);
      setAppliesToDelivery(existing.appliesToDelivery);
      setAppliesToCollection(existing.appliesToCollection);
    }
  }, [existing]);

  const save = async (): Promise<void> => {
    const valueNumber = parseFloat(valueText);
    const minOrderNumber = parseFloat(minOrderText || "0");
    if (!code.trim() || !title.trim() || Number.isNaN(valueNumber)) {
      void dialog.alert({
        title: "Check the form",
        message: "Code, title, and value are required.",
        tone: "warning",
      });
      return;
    }
    const body = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || null,
      type,
      value:
        type === "fixed"
          ? Math.round(valueNumber * 100)
          : Math.round(valueNumber),
      minOrderPence: Math.round(minOrderNumber * 100),
      active,
      appliesToDelivery,
      appliesToCollection,
      startsAt: null,
      endsAt: null,
    };
    setSaving(true);
    const res = isNew
      ? await apiCall({ method: "POST", path: "/api/admin/discounts", body })
      : await apiCall({
          method: "PUT",
          path: `/api/admin/discounts/${id}`,
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
    navigation.goBack();
  };

  const remove = async (): Promise<void> => {
    if (isNew || !id) return;
    const ok = await dialog.confirm({
      title: "Delete discount?",
      message: `Remove "${code}"?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await apiCall({
      method: "DELETE",
      path: `/api/admin/discounts/${id}`,
    });
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't delete",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    navigation.goBack();
  };

  if (loading && !isNew && !existing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Code</Text>
      <TextInput
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        style={[styles.input, styles.codeInput]}
        placeholder="WELCOME10"
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Welcome discount"
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.multiline]}
        multiline
        placeholder="Shown to the customer at checkout"
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.chipRow}>
        {(["percentage", "fixed"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.chip, type === t && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, type === t && styles.chipTextActive]}
            >
              {t === "percentage" ? "% Percentage" : "£ Fixed amount"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>
        {type === "percentage" ? "Value (%)" : "Value (£)"}
      </Text>
      <TextInput
        value={valueText}
        onChangeText={setValueText}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Minimum order (£)</Text>
      <TextInput
        value={minOrderText}
        onChangeText={setMinOrderText}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <View style={styles.toggleCard}>
        <ToggleRow
          icon={active ? "✅" : "⏸️"}
          label="Active"
          value={active}
          onChange={setActive}
        />
        <ToggleRow
          icon="🚚"
          label="Applies to delivery"
          value={appliesToDelivery}
          onChange={setAppliesToDelivery}
        />
        <ToggleRow
          icon="🥡"
          label="Applies to collection"
          value={appliesToCollection}
          onChange={setAppliesToCollection}
          last
        />
      </View>

      <PrimaryButton
        label={isNew ? "Create discount" : "Save changes"}
        icon={isNew ? "➕" : "💾"}
        busy={saving}
        onPress={save}
        style={{ marginTop: 24 }}
      />

      {!isNew ? (
        <SecondaryButton
          label="Delete discount"
          icon="🗑️"
          tone="danger"
          onPress={remove}
          style={{ marginTop: 12 }}
        />
      ) : null}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
  last,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}): JSX.Element {
  return (
    <View style={[styles.toggleRow, !last && styles.toggleRowBorder]}>
      <Text style={styles.toggleIcon}>{icon}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
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
  label: {
    marginTop: 16,
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
  codeInput: { letterSpacing: 2, fontWeight: "700", fontSize: 16 },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipText: { color: palette.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: palette.primaryText },
  toggleCard: {
    marginTop: 20,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  toggleIcon: { fontSize: 18 },
  toggleLabel: { flex: 1, color: palette.text, fontSize: 14, fontWeight: "600" },
});
