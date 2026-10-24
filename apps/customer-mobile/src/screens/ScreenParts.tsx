import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";

import { toAbsoluteUrl } from "../api";
import { Button, Card, Icon } from "../components/ui";
import { colors, radii, spacing, typography } from "../theme";
import type { CustomerSettings, PublicPromotion } from "../types";

export function FoodPhoto({ uri, label, style, fallbackSource }: { uri?: string | null; label: string; style?: StyleProp<ViewStyle>; fallbackSource?: ImageSourcePropType }) {
  const [failed, setFailed] = useState(false);
  const source = toAbsoluteUrl(uri);
  const imageSource = source && !failed ? { uri: source } : fallbackSource;
  return (
    <View style={[styles.photo, style]}>
      {imageSource ? (
        <Image source={imageSource} alt={label} accessibilityLabel={label} resizeMode="cover" style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      ) : (
        <View style={styles.photoFallback}><Icon name="restaurant-outline" size={36} color={colors.textMuted} /></View>
      )}
    </View>
  );
}

export function SectionHeading({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}><Text style={styles.sectionAction}>{action} →</Text></Pressable> : null}
    </View>
  );
}

export function isActivePromotion(promotion?: PublicPromotion | null): promotion is PublicPromotion {
  if (!promotion?.active) return false;
  const now = Date.now();
  return (!promotion.startsAt || Date.parse(promotion.startsAt) <= now) && (!promotion.endsAt || Date.parse(promotion.endsAt) > now);
}

export function PromotionCard({ promotion, onPress, actionLabel = "Explore the pizzas", loading, disabled }: {
  promotion?: PublicPromotion | null;
  onPress: () => void;
  actionLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  if (!isActivePromotion(promotion)) return null;
  const end = promotion.endsAt ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(promotion.endsAt)) : null;
  return (
    <Card style={styles.promotion}>
      <View style={styles.promotionTop}>
        <View style={styles.promotionIcon}><Icon name="pricetag-outline" size={23} color={colors.text} /></View>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>A LITTLE TREAT FROM US</Text><Text style={styles.promotionTitle}>15% off every pizza.</Text></View>
      </View>
      <View style={styles.promotionCode}><Text style={styles.codeLabel}>YOUR CODE</Text><Text selectable style={styles.code}>{promotion.code}</Text></View>
      <Text style={styles.caption}>{end ? `Until ${end} (UK time). ` : ""}Pizza items only; other items and delivery excluded.</Text>
      <Button label={actionLabel} onPress={onPress} icon="arrow-forward" loading={loading} disabled={disabled} />
    </Card>
  );
}

export function ShopNotice({ settings }: { settings: CustomerSettings }) {
  if (settings.shopStatus.isOpen && settings.ordering.acceptingOnlineOrders && settings.ordering.busyMode === "normal") return null;
  return (
    <View style={styles.notice}>
      <Icon name="time-outline" size={20} color={colors.text} />
      <Text style={styles.noticeText}>{settings.shopStatus.message || "Please check back shortly for online ordering."}</Text>
    </View>
  );
}

export function PriceRow({ label, amount, total = false, saving = false }: { label: string; amount: string; total?: boolean; saving?: boolean }) {
  return (
    <View style={[styles.priceRow, total && styles.priceTotal]}>
      <Text style={[styles.priceLabel, total && styles.priceTotalText, saving && styles.saving]}>{label}</Text>
      <Text style={[styles.priceAmount, total && styles.priceTotalText, saving && styles.saving]}>{amount}</Text>
    </View>
  );
}

// Mirrors the server's delivery tiers after an address has been validated.
export function deliveryEstimate(settings: CustomerSettings, miles?: number): number {
  if (miles == null || !Number.isFinite(miles)) return settings.ordering.deliveryFeePence;
  if (miles <= 1) return 195;
  if (miles <= 2) return 225;
  if (miles <= 3) return 335;
  return 449;
}

export function ErrorMessage({ message }: { message?: string | null }) {
  return message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null;
}

export const screenStyles = StyleSheet.create({
  screen: { gap: spacing.xl },
  body: { color: colors.textMuted, fontFamily: typography.body, fontSize: 15, lineHeight: 23 },
  title: { color: colors.text, fontFamily: typography.heading, fontSize: 26, lineHeight: 32 },
  small: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  strong: { color: colors.text, fontFamily: typography.semibold, fontSize: 15, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  card: { gap: spacing.lg },
  divider: { height: 1, backgroundColor: colors.border },
  pill: { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pillText: { color: colors.text, fontFamily: typography.semibold, fontSize: 12 },
});

const styles = StyleSheet.create({
  photo: { backgroundColor: colors.surfaceMuted, overflow: "hidden" },
  photoFallback: { alignItems: "center", justifyContent: "center", flex: 1 },
  sectionHeading: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  sectionTitle: { color: colors.text, fontFamily: typography.heading, fontSize: 25, flex: 1 },
  sectionAction: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  promotion: { backgroundColor: colors.surfaceMuted, gap: spacing.lg, borderColor: colors.primary },
  promotionTop: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  promotionIcon: { width: 46, height: 46, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 9, letterSpacing: 1.5 },
  promotionTitle: { color: colors.text, fontFamily: typography.heading, fontSize: 29, lineHeight: 35, marginTop: 4 },
  promotionCode: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: colors.textMuted, backgroundColor: colors.surface, borderRadius: radii.sm, padding: spacing.md },
  codeLabel: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 11, letterSpacing: 1.3 },
  code: { color: colors.text, fontFamily: typography.bold, fontSize: 23, letterSpacing: 2 },
  caption: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, padding: spacing.lg },
  noticeText: { color: colors.text, fontFamily: typography.medium, fontSize: 13, lineHeight: 20, flex: 1 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.lg },
  priceLabel: { color: colors.textMuted, fontFamily: typography.body, fontSize: 14, flex: 1 },
  priceAmount: { color: colors.text, fontFamily: typography.semibold, fontSize: 15 },
  priceTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg, marginTop: spacing.sm },
  priceTotalText: { color: colors.text, fontFamily: typography.bold, fontSize: 20 },
  saving: { color: colors.success },
  error: { color: colors.danger, fontFamily: typography.medium, fontSize: 13, lineHeight: 20 },
});
