import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { money } from "../api";
import { Button, Card, EmptyState, Icon, QuantityStepper, ScreenHeader } from "../components/ui";
import { useCustomerApp } from "../state/CustomerContext";
import { colors, radii, spacing, typography } from "../theme";
import { FoodPhoto, PriceRow, ShopNotice, isActivePromotion, screenStyles } from "./ScreenParts";

export function CartScreen() {
  const { cart, cartQuantity, subtotalPence, settings, navigate, setQuantity, removeItem } = useCustomerApp();
  if (!cart.length) return <View style={screenStyles.screen}><ScreenHeader eyebrow="YOUR ORDER" title="A good meal starts here." /><EmptyState icon="bag-outline" title="Your bag is waiting" message="Pick something delicious from the menu. We'll take care of the rest." actionLabel="Explore the menu" onAction={() => navigate("menu")} /></View>;
  return (
    <View style={screenStyles.screen}>
      <ScreenHeader eyebrow="GOOD CHOICES" title="Your bag" description={`${cartQuantity} ${cartQuantity === 1 ? "delicious thing" : "delicious things"}, freshly made for you.`} />
      <ShopNotice settings={settings} />
      <View style={{ gap: spacing.md }}>{cart.map((line) => <Card key={line.item.id} style={styles.line}>
        <View style={styles.lineTop}><FoodPhoto uri={line.item.imageUrl} label={line.item.name} style={styles.photo} /><View style={styles.lineCopy}><Text style={styles.name}>{line.item.name}</Text><Text style={styles.unitPrice}>{money(line.item.pricePence)} each</Text><Text style={styles.linePrice}>{money(line.item.pricePence * line.quantity)}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${line.item.name}`} onPress={() => removeItem(line.item.id)} hitSlop={10} style={styles.remove}><Icon name="close" size={20} color={colors.textMuted} /></Pressable></View>
        <View style={screenStyles.spread}><Text style={screenStyles.small}>Made fresh to order</Text><QuantityStepper quantity={line.quantity} onIncrease={() => setQuantity(line.item.id, Math.min(20, line.quantity + 1))} onDecrease={() => setQuantity(line.item.id, line.quantity - 1)} /></View>
      </Card>)}</View>
      <Button label="Add something else" icon="add" variant="secondary" onPress={() => navigate("menu")} />
      {isActivePromotion(settings.pizzaPromotion) ? <View style={styles.promoNote}><Icon name="pricetag-outline" size={20} color={colors.text} /><Text style={styles.promoText}>A little extra? Use <Text style={{ fontFamily: typography.bold }}>{settings.pizzaPromotion.code}</Text> at checkout for 15% off every pizza.</Text></View> : null}
      <Card style={screenStyles.card}><PriceRow label="Food subtotal" amount={money(subtotalPence)} /><Text style={screenStyles.small}>Choose delivery or free collection at checkout. Delivery is calculated after checking your address.</Text><PriceRow label="Subtotal" amount={money(subtotalPence)} total /></Card>
      <Text style={styles.footer}>Hand-stretched. Stone-baked. Worth the wait.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { gap: spacing.lg },
  lineTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  photo: { width: 80, height: 84, borderRadius: radii.sm },
  lineCopy: { flex: 1, gap: 5 },
  name: { color: colors.text, fontFamily: typography.semibold, fontSize: 15, lineHeight: 21 },
  unitPrice: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12 },
  linePrice: { color: colors.text, fontFamily: typography.bold, fontSize: 16, marginTop: 2 },
  remove: { padding: 3 },
  promoNote: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start", backgroundColor: colors.surfaceMuted, borderRadius: radii.md, padding: spacing.lg },
  promoText: { color: colors.text, fontFamily: typography.body, fontSize: 13, lineHeight: 20, flex: 1 },
  footer: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, textAlign: "center" },
});
