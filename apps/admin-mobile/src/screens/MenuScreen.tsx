import { useCallback, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiCall, getBaseUrl } from "@/api/client";
import type { AdminMenuCategory, AdminMenuItem, AdminMenuPayload } from "@/api/types";
import { useApiGet } from "@/api/useApiGet";
import { Banner, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { ScreenLayout, useScreenBottomPadding } from "@/components/ScreenLayout";
import { Card, EmptyState } from "@/components/ui";
import { palette } from "@/format";
import { formatCurrencyGBP } from "@/lib/order-operations";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "MenuHome">;
type CategoryFilter = "all" | "uncategorised" | string;

type SectionRow =
  | { kind: "header"; id: string; title: string }
  | { kind: "item"; id: string; item: AdminMenuItem }
  | { kind: "addItem"; id: string; categoryId: string | null; label: string };

export function MenuScreen({ navigation }: Props): JSX.Element {
  const { data, error, loading, reload } = useApiGet<AdminMenuPayload>(
    "/api/admin/menu",
  );
  const dialog = useDialog();
  const [busyId, setBusyId] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const bottomPadding = useScreenBottomPadding(20);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const categories = useMemo(
    () =>
      data
        ? [...data.categories].sort((a, b) => a.displayOrder - b.displayOrder)
        : [],
    [data],
  );

  const rows = useMemo<SectionRow[]>(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const matchesSearch = (item: AdminMenuItem): boolean =>
      !q ||
      [item.name, item.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    const matchesCategory = (item: AdminMenuItem): boolean => {
      if (category === "all") return true;
      if (category === "uncategorised") return !item.categoryId;
      return item.categoryId === category;
    };
    const matchingItems = data.items.filter(
      (item) => matchesSearch(item) && matchesCategory(item),
    );
    const out: SectionRow[] = [];

    const appendCategory = (cat: AdminMenuCategory): void => {
      const catItems = matchingItems.filter((item) => item.categoryId === cat.id);
      if (catItems.length === 0 && q) return;
      if (category !== "all" && category !== cat.id) return;
      out.push({ kind: "header", id: `h-${cat.id}`, title: cat.name });
      catItems.forEach((item) => out.push({ kind: "item", id: item.id, item }));
      if (!q) {
        out.push({
          kind: "addItem",
          id: `add-${cat.id}`,
          categoryId: cat.id,
          label: "Add item to this category",
        });
      }
    };

    categories.forEach(appendCategory);

    const uncategorised = matchingItems.filter((item) => !item.categoryId);
    if ((category === "all" || category === "uncategorised") && uncategorised.length > 0) {
      out.push({ kind: "header", id: "h-none", title: "Uncategorised" });
      uncategorised.forEach((item) => out.push({ kind: "item", id: item.id, item }));
    }
    if (category === "uncategorised" && !q) {
      out.push({
        kind: "addItem",
        id: "add-none",
        categoryId: null,
        label: "Add uncategorised item",
      });
    }
    return out;
  }, [categories, category, data, query]);

  const toggleAvailable = async (
    item: AdminMenuItem,
    next: boolean,
  ): Promise<void> => {
    if (busyRef.current) return;
    busyRef.current = item.id;
    setBusyId(item.id);
    const res = await apiCall<AdminMenuItem>({
      method: "PUT",
      path: `/api/admin/menu/items/${item.id}`,
      body: { available: next },
    });
    busyRef.current = null;
    setBusyId(null);
    if (!res.ok) {
      await dialog.alert({
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

  return (
    <ScreenLayout
      scroll={false}
      header={
        <MenuHeader
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          error={error}
        />
      }
    >
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPadding },
        ]}
        ListEmptyComponent={
          <EmptyState
            message={
              query.trim() || category !== "all"
                ? "No menu items match this search or category."
                : "No menu items yet."
            }
          />
        }
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
                style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              >
                <Text style={styles.addBtnText}>{row.label}</Text>
              </Pressable>
            );
          }
          return (
            <MenuItemRow
              item={row.item}
              busyId={busyId}
              onEdit={() => navigation.navigate("MenuItemEdit", { id: row.item.id })}
              onToggle={(value) => void toggleAvailable(row.item, value)}
            />
          );
        }}
      />
    </ScreenLayout>
  );
}

function MenuHeader({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  error,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  categories: AdminMenuCategory[];
  error: string | null;
}): JSX.Element {
  return (
    <View style={styles.headerWrap}>
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
          placeholder="Search menu items"
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
        contentContainerStyle={styles.categoryStrip}
      >
        <CategoryChip
          label="All"
          active={category === "all"}
          onPress={() => onCategoryChange("all")}
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.name}
            active={category === cat.id}
            onPress={() => onCategoryChange(cat.id)}
          />
        ))}
        <CategoryChip
          label="Uncategorised"
          active={category === "uncategorised"}
          onPress={() => onCategoryChange("uncategorised")}
        />
      </ScrollView>
    </View>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryChip,
        active && styles.categoryChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.categoryChipText,
          active && styles.categoryChipTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MenuItemRow({
  item,
  busyId,
  onEdit,
  onToggle,
}: {
  item: AdminMenuItem;
  busyId: string | null;
  onEdit: () => void;
  onToggle: (value: boolean) => void;
}): JSX.Element {
  const thumbUri = item.imageUrl
    ? /^https?:\/\//i.test(item.imageUrl)
      ? item.imageUrl
      : `${getBaseUrl()}${item.imageUrl.startsWith("/") ? "" : "/"}${item.imageUrl}`
    : null;
  const busy = busyId === item.id;
  return (
    <Pressable onPress={onEdit} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.item}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={styles.thumb} alt={item.name} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Text style={styles.thumbEmptyText}>No photo</Text>
          </View>
        )}
        <View style={styles.itemBody}>
          <View style={styles.nameLine}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            {!item.available ? <UnavailableBadge /> : null}
          </View>
          {item.description ? (
            <Text style={styles.itemDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.itemPrice}>{formatCurrencyGBP(item.pricePence)}</Text>
        </View>
        <View style={styles.switchCol}>
          {busy ? (
            <ActivityIndicator color={palette.primary} />
          ) : (
            <Switch
              value={item.available}
              disabled={busyId !== null}
              onValueChange={onToggle}
            />
          )}
          <Text
            style={[
              styles.switchLabel,
              { color: item.available ? palette.success : palette.textMuted },
            ]}
          >
            {item.available ? "Live" : "Off"}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function UnavailableBadge(): JSX.Element {
  return (
    <View style={styles.unavailableBadge}>
      <Text style={styles.unavailableText}>Unavailable</Text>
    </View>
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
  headerWrap: {
    backgroundColor: palette.surface,
    paddingTop: 10,
  },
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
  categoryStrip: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    minHeight: 38,
    minWidth: 76,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  categoryChipText: { color: palette.text, fontSize: 12, fontWeight: "800" },
  categoryChipTextActive: { color: palette.primaryText },
  list: { padding: 12, paddingTop: 14 },
  header: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    gap: 12,
  },
  itemBody: { flex: 1, minWidth: 0 },
  nameLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  itemName: { fontWeight: "800", color: palette.text, fontSize: 15, flexShrink: 1 },
  itemDesc: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  itemPrice: { color: palette.text, fontWeight: "800", marginTop: 6 },
  switchCol: { alignItems: "center", minWidth: 64 },
  switchLabel: { fontSize: 11, marginTop: 4, fontWeight: "800" },
  unavailableBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: palette.warningBg,
  },
  unavailableText: {
    color: palette.warning,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  thumb: {
    width: 58,
    height: 58,
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
  addBtnText: { color: palette.primary, fontWeight: "800", fontSize: 14 },
  pressed: { opacity: 0.7 },
});
