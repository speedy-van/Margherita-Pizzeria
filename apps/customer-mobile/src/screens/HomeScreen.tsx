import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { money } from "../api";
import { Button, Card, Icon, ScreenHeader } from "../components/ui";
import { useCustomerApp } from "../state/CustomerContext";
import { canOrder } from "../lib/customer-data";
import { colors, radii, spacing, typography } from "../theme";
import { FoodPhoto, PromotionCard, SectionHeading, ShopNotice, screenStyles } from "./ScreenParts";

export function HomeScreen() {
  const { settings, menuItems, navigate, addItem, loading } = useCustomerApp();
  const pizzas = menuItems.filter((item) => item.available && /pizza|margherita|pepperoni/i.test(item.name));
  const favourites = (pizzas.length ? pizzas : menuItems.filter((item) => item.available)).slice(0, 5);
  return (
    <View style={screenStyles.screen}>
      <ScreenHeader eyebrow="DENNISTOUN · GLASGOW" title={"A little slice\nof Italy."} description="Hand-stretched sourdough. Stone-baked with care. Always halal." />
      <View style={styles.hero}>
        <FoodPhoto uri={favourites[0]?.imageUrl} fallbackSource={require("../../assets/brand/pizza.jpg")} label="Freshly baked Margherita sourdough pizza" style={styles.heroPhoto} />
        <View style={styles.heroBadge}><Icon name="leaf-outline" size={14} color={colors.text} /><Text style={styles.heroBadgeText}>24-HOUR SOURDOUGH</Text></View>
      </View>
      <Button label="Find your favourite" icon="arrow-forward" onPress={() => navigate("menu")} />
      <View style={styles.trustRow}>
        <View style={styles.trustItem}><Icon name="checkmark-circle-outline" size={23} color={colors.text} /><Text style={styles.trustTitle}>100% halal</Text><Text style={styles.trustCaption}>Made for everyone</Text></View>
        <View style={[styles.trustItem, styles.trustMiddle]}><Icon name="bicycle-outline" size={23} color={colors.text} /><Text style={styles.trustTitle}>To your door</Text><Text style={styles.trustCaption}>Within {settings.ordering.deliveryRadiusMiles} miles</Text></View>
        <View style={styles.trustItem}><Icon name="flame-outline" size={23} color={colors.text} /><Text style={styles.trustTitle}>Stone-baked</Text><Text style={styles.trustCaption}>Fresh from our oven</Text></View>
      </View>
      <ShopNotice settings={settings} />
      <PromotionCard promotion={settings.pizzaPromotion} onPress={() => navigate("menu")} />
      {favourites.length ? <View style={{ gap: spacing.lg }}>
        <SectionHeading title="Love at first slice" action="Full menu" onPress={() => navigate("menu")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favourites}>
          {favourites.map((item) => <View key={item.id} style={styles.favourite}>
            <FoodPhoto uri={item.imageUrl} label={item.name} style={styles.favouritePhoto} />
            <View style={styles.favouriteCopy}><Text numberOfLines={2} style={styles.favouriteName}>{item.name}</Text><Text style={styles.favouritePrice}>{money(item.pricePence)}</Text><Button label="Add to bag" icon="add" variant="secondary" onPress={() => addItem(item)} disabled={loading || !canOrder(settings)} /></View>
          </View>)}
        </ScrollView>
      </View> : null}
      <Card style={styles.visit}>
        <View style={styles.visitIcon}><Icon name="restaurant-outline" size={27} color={colors.text} /></View>
        <Text style={screenStyles.title}>Pull up a chair.</Text>
        <Text style={screenStyles.body}>Good pizza tastes even better together. Join us at our cosy spot on Alexandra Parade.</Text>
        <Button label="Book a table" variant="secondary" icon="calendar-outline" onPress={() => navigate("book")} />
      </Card>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.restaurant.address)}`)} style={styles.address}>
        <Icon name="location-outline" size={22} color={colors.text} /><View style={{ flex: 1 }}><Text style={screenStyles.strong}>Made in Dennistoun</Text><Text style={screenStyles.small}>{settings.restaurant.address}</Text></View><Icon name="open-outline" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radii.lg, overflow: "hidden", position: "relative" },
  heroPhoto: { height: 248, width: "100%" },
  heroBadge: { position: "absolute", left: 14, bottom: 14, backgroundColor: colors.surface, flexDirection: "row", gap: 7, alignItems: "center", borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 13 },
  heroBadgeText: { color: colors.text, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 1 },
  trustRow: { flexDirection: "row", paddingVertical: 5 },
  trustItem: { flex: 1, alignItems: "center", gap: 7 },
  trustMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  trustTitle: { fontFamily: typography.semibold, color: colors.text, fontSize: 12 },
  trustCaption: { fontFamily: typography.body, color: colors.textMuted, fontSize: 9 },
  favourites: { gap: 12, paddingBottom: 2 },
  favourite: { width: 206, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  favouritePhoto: { width: "100%", height: 145 },
  favouriteCopy: { padding: spacing.md, gap: spacing.md },
  favouriteName: { color: colors.text, fontFamily: typography.semibold, fontSize: 15, lineHeight: 21, minHeight: 42 },
  favouritePrice: { color: colors.text, fontFamily: typography.bold, fontSize: 17 },
  visit: { gap: spacing.md, alignItems: "flex-start", backgroundColor: colors.surfaceMuted },
  visitIcon: { width: 50, height: 50, backgroundColor: colors.primary, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  address: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingVertical: spacing.sm },
});
