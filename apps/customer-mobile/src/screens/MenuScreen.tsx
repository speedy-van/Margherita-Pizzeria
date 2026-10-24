import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { money } from "../api";
import { Button, EmptyState, Field, QuantityStepper, ScreenHeader } from "../components/ui";
import { useCustomerApp } from "../state/CustomerContext";
import { canOrder } from "../lib/customer-data";
import { colors, radii, spacing, typography } from "../theme";
import { FoodPhoto, PromotionCard, ShopNotice, screenStyles } from "./ScreenParts";

export function MenuScreen() {
  const { settings, categories, menuItems, cart, addItem, setQuantity, navigate, loading, refresh } = useCustomerApp();
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedAllergens, setExpandedAllergens] = useState<string | null>(null);
  const liveCategories = categories.filter((category) => category.active !== false && category.available !== false);
  const availableItems = useMemo(() => menuItems.filter((item) => item.available), [menuItems]);
  const visible = useMemo(() => availableItems.filter((item) => (categoryId === "all" || item.categoryId === categoryId) && `${item.name} ${item.description || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [availableItems, categoryId, query]);
  const quantities = new Map(cart.map((line) => [line.item.id, line.quantity]));
  return (
    <View style={screenStyles.screen}>
      <ScreenHeader eyebrow="FRESH FROM OUR KITCHEN" title="What are you craving?" description="Find your favourite. We'll make it fresh." />
      <ShopNotice settings={settings} />
      <PromotionCard promotion={settings.pizzaPromotion} actionLabel="Choose your pizzas" onPress={() => { setQuery(""); const pizzaCategory = liveCategories.find((category) => /pizza/i.test(category.name)); setCategoryId(pizzaCategory?.id || "all"); }} />
      <Field label="Search the menu" value={query} onChangeText={setQuery} placeholder="Pizza, pepperoni, something delicious…" autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {[{ id: "all", name: "All" }, ...liveCategories].map((category) => {
          const selected = categoryId === category.id;
          const count = category.id === "all" ? availableItems.length : availableItems.filter((item) => item.categoryId === category.id).length;
          if (!count && category.id !== "all") return null;
          return <Pressable key={category.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setCategoryId(category.id)} style={[styles.chip, selected && styles.chipSelected]}><Text style={styles.chipText}>{category.name}</Text><Text style={styles.chipCount}>{count}</Text></Pressable>;
        })}
      </ScrollView>
      <View style={screenStyles.spread}><Text style={screenStyles.title}>{categoryId === "all" ? "The whole menu" : liveCategories.find((category) => category.id === categoryId)?.name || "Our menu"}</Text><Text style={screenStyles.small}>{visible.length} {visible.length === 1 ? "dish" : "dishes"}</Text></View>
      {!visible.length ? <EmptyState icon="search-outline" title={loading ? "Warming up the menu…" : "Nothing here just yet"} message={query ? "Try another search or explore a different category." : "Pull down to refresh the live menu."} actionLabel={query || categoryId !== "all" ? "Show all dishes" : "Refresh menu"} onAction={() => { if (query || categoryId !== "all") { setQuery(""); setCategoryId("all"); } else void refresh(); }} /> : <View style={{ gap: spacing.md }}>
        {visible.map((item) => {
          const quantity = quantities.get(item.id) || 0;
          return <View key={item.id} style={styles.item}>
            <View style={styles.itemTop}>
              <View style={styles.itemCopy}><Text style={styles.itemName}>{item.name}</Text><Text numberOfLines={3} style={styles.itemDescription}>{item.description || "Freshly prepared, just for you."}</Text>{item.dietaryTags.length ? <Text style={styles.dietary}>{item.dietaryTags.slice(0, 2).join(" · ")}</Text> : null}</View>
              <FoodPhoto uri={item.imageUrl} label={item.name} style={styles.itemPhoto} />
            </View>
            <View style={screenStyles.spread}><View style={{ gap: 5 }}><Text style={styles.price}>{money(item.pricePence)}</Text>{item.allergens.length ? <Pressable accessibilityRole="button" onPress={() => setExpandedAllergens(expandedAllergens === item.id ? null : item.id)} hitSlop={8}><Text style={styles.allergensLink}>{expandedAllergens === item.id ? "Hide allergens" : "Allergen info"}</Text></Pressable> : null}</View>{quantity ? <QuantityStepper quantity={quantity} onDecrease={() => setQuantity(item.id, quantity - 1)} onIncrease={() => setQuantity(item.id, Math.min(20, quantity + 1))} /> : <Button label="Add" icon="add" onPress={() => addItem(item)} disabled={loading || !canOrder(settings)} style={{ minWidth: 98 }} />}</View>
            {expandedAllergens === item.id ? <Text style={styles.allergens}>Contains: {item.allergens.join(", ")}. Please call us about severe allergies.</Text> : null}
          </View>;
        })}
      </View>}
      {cart.length ? <Button label="Review your bag" variant="secondary" icon="bag-outline" onPress={() => navigate("cart")} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  categories: { gap: spacing.sm, paddingBottom: 2 },
  chip: { minHeight: 46, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  chipCount: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11 },
  item: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.md, padding: spacing.lg, gap: spacing.lg },
  itemTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  itemCopy: { flex: 1, gap: spacing.sm },
  itemName: { color: colors.text, fontFamily: typography.semibold, fontSize: 17, lineHeight: 23 },
  itemDescription: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 19 },
  dietary: { color: colors.success, fontFamily: typography.medium, fontSize: 11, textTransform: "capitalize" },
  itemPhoto: { width: 102, height: 112, borderRadius: radii.sm },
  price: { color: colors.text, fontFamily: typography.bold, fontSize: 18 },
  allergensLink: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 10, textDecorationLine: "underline" },
  allergens: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
});
