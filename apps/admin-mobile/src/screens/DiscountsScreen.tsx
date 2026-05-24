import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useApiGet } from "@/api/useApiGet";
import type { AdminDiscount } from "@/api/types";
import { Banner, PrimaryButton } from "@/components/controls";
import { Card, EmptyState } from "@/components/ui";
import { formatMoney, palette } from "@/format";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "Discounts">;

export function DiscountsScreen({ navigation }: Props): JSX.Element {
  const { data, error, loading, reload } = useApiGet<AdminDiscount[]>(
    "/api/admin/discounts",
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <PrimaryButton
          label="New discount"
          icon="➕"
          onPress={() => navigation.navigate("DiscountEdit", { id: null })}
        />
      </View>
      {error ? (
        <View style={{ padding: 12 }}>
          <Banner tone="danger">{error}</Banner>
        </View>
      ) : null}
      {loading && !data ? (
        <ActivityIndicator color={palette.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState message="No discounts yet — tap “New discount” to add one." />
          }
          refreshing={loading}
          onRefresh={() => void reload()}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate("DiscountEdit", { id: item.id })
              }
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Card style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={styles.code}>{item.code}</Text>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: item.active
                          ? palette.successBg
                          : palette.surfaceAlt,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: item.active
                            ? palette.success
                            : palette.textMuted,
                        },
                      ]}
                    >
                      {item.active ? "● ACTIVE" : "○ OFF"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>
                  {item.type === "percentage"
                    ? `${item.value}% off`
                    : `${formatMoney(item.value)} off`}
                  {item.minOrderPence > 0
                    ? ` · min ${formatMoney(item.minOrderPence)}`
                    : ""}
                </Text>
                <Text style={styles.meta}>
                  {[
                    item.appliesToDelivery && "🚚 delivery",
                    item.appliesToCollection && "🥡 collection",
                  ]
                    .filter(Boolean)
                    .join("  ·  ") || "no order types selected"}
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
  topBar: { padding: 12 },
  list: { padding: 12, paddingBottom: 32 },
  card: { marginBottom: 10 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  code: { fontWeight: "800", color: palette.text, fontSize: 18, letterSpacing: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  title: { color: palette.text, fontWeight: "600" },
  sub: { color: palette.textMuted, marginTop: 4 },
  meta: { color: palette.textMuted, fontSize: 12, marginTop: 6 },
});
