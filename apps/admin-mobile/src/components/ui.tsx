import { ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { palette, shadow, statusTone } from "@/format";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type StatusTone,
} from "@/lib/order-operations";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}): JSX.Element {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

export function StatusBadge({ status }: { status: string }): JSX.Element {
  const isOrderStatus = (ORDER_STATUSES as readonly string[]).includes(status);
  const tone: StatusTone = isOrderStatus
    ? ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS]
    : statusTone(status);
  const language = useLanguage();
  const label = isOrderStatus
    ? ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]
    : language.status(status);
  return (
    <View style={[badgeStyles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[badgeStyles.text, { color: tone.fg }]}>
        {label}
      </Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "good";
}): JSX.Element {
  const valueColor =
    tone === "warn"
      ? palette.danger
      : tone === "good"
        ? palette.success
        : palette.text;
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export function SectionHeader({ title }: { title: string }): JSX.Element {
  return <Text style={sectionStyles.title}>{title}</Text>;
}

export function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.text}>{message}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    minWidth: 0,
    minHeight: 104,
    justifyContent: "space-between",
    ...shadow,
  },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textAlign: "right",
  },
  value: { fontSize: 24, fontWeight: "800" },
});

const sectionStyles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
});

const emptyStyles = StyleSheet.create({
  wrap: {
    padding: 32,
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  text: { color: palette.textMuted },
});
