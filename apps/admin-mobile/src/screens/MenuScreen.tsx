import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { apiCall, getBaseUrl } from "@/api/client";
import { useApiGet } from "@/api/useApiGet";
import type { AdminMenuItem, AdminMenuPayload } from "@/api/types";
import { Banner } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { Card, EmptyState } from "@/components/ui";
import { formatMoney, palette } from "@/format";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "MenuHome">;

type SectionRow =
  | { kind: "header"; id: string; title: string }
  | { kind: "item"; id: string; item: AdminMenuItem }
  | { kind: "addItem"; id: string; categoryId: string | null };

export function MenuScreen({ navigation }: Props): JSX.Element {
  const { data, error, loading, reload } = useApiGet<AdminMenuPayload>(
    "/api/admin/menu",
  );
  const dialog = useDialog();
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const rows = useMemo<SectionRow[]>(() => {
    if (!data) return [];
    const out: SectionRow[] = [];
    const ordered = [...data.categories].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    for (const cat of ordered) {
      out.push({ kind: "header", id: `h-${cat.id}`, title: cat.name });
      const catItems = data.items.filter((i) => i.categoryId === cat.id);
      for (const it of catItems) {
        out.push({ kind: "item", id: it.id, item: it });
      }
      out.push({
        kind: "addItem",
        id: `add-${cat.id}`,
        categoryId: cat.id,
      });
    }
    const uncategorised = data.items.filter((i) => !i.categoryId);
    if (uncategorised.length > 0) {
      out.push({ kind: "header", id: "h-none", title: "Uncategorised" });
      uncategorised.forEach((it) =>
        out.push({ kind: "item", id: it.id, item: it }),
      );
    }
    return out;
  }, [data]);

  const toggleAvailable = async (
    item: AdminMenuItem,
    next: boolean,
  ): Promise<void> => {
    setBusyId(item.id);
    const res = await apiCall({
      method: "PUT",
      path: `/api/admin/menu/items/${item.id}`,
      body: { available: next },
    });
    setBusyId(null);
    if (!res.ok) {
      void dialog.alert({
        title: "Couldn't update",
        message: res.message,
        tone: "danger",
      });
      return;
    }
    await reload();
  };

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {error ? (
        <View style={{ padding: 12 }}>
          <Banner tone="danger">{error}</Banner>
        </View>
      ) : null}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="No menu items yet" />}
        refreshing={loading}
        onRefresh={() => void reload()}
        renderItem={({ item: row }) => {
          if (row.kind === "header") {
            return <Text style={styles.header}>{row.title}</Text>;
          }
          if (row.kind === "addItem") {
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate("MenuItemEdit", {
                    id: null,
                    categoryId: row.categoryId,
                  })
                }
                style={({ pressed }) => [
                  styles.addBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.addBtnText}>+ Add item to this category</Text>
              </Pressable>
            );
          }
          const it = row.item;
          const thumbUri = it.imageUrl
            ? /^https?:\/\//i.test(it.imageUrl)
              ? it.imageUrl
              : `${getBaseUrl()}${it.imageUrl.startsWith("/") ? "" : "/"}${it.imageUrl}`
            : null;
          return (
            <Pressable
              onPress={() => navigation.navigate("MenuItemEdit", { id: it.id })}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Card style={styles.item}>
                {thumbUri ? (
                  <Image source={{ uri: thumbUri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Text style={styles.thumbEmptyText}>No photo</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  {it.description ? (
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {it.description}
                    </Text>
                  ) : null}
                  <Text style={styles.itemPrice}>
                    {formatMoney(it.pricePence)}
                  </Text>
                </View>
                <View style={{ alignItems: "center", minWidth: 60 }}>
                  {busyId === it.id ? (
                    <ActivityIndicator />
                  ) : (
                    <Switch
                      value={it.available}
                      onValueChange={(v) => void toggleAvailable(it, v)}
                    />
                  )}
                  <View
                    style={[
                      styles.livePill,
                      {
                        backgroundColor: it.available
                          ? palette.successBg
                          : palette.surfaceAlt,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.livePillText,
                        {
                          color: it.available
                            ? palette.success
                            : palette.textMuted,
                        },
                      ]}
                    >
                      {it.available ? "● LIVE" : "○ OFF"}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  list: { padding: 12, paddingBottom: 32 },
  header: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  itemName: { fontWeight: "600", color: palette.text, fontSize: 15 },
  itemDesc: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  itemPrice: { color: palette.text, fontWeight: "700", marginTop: 6 },
  switchLabel: { color: palette.textMuted, fontSize: 11, marginTop: 4 },
  livePill: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  livePillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: palette.border,
  },
  thumbEmpty: { alignItems: "center", justifyContent: "center" },
  thumbEmptyText: {
    color: palette.textMuted,
    fontSize: 10,
    textAlign: "center",
  },
  addBtn: {
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.primary,
    backgroundColor: palette.surface,
  },
  addBtnText: { color: palette.primary, fontWeight: "700", fontSize: 14 },
});
