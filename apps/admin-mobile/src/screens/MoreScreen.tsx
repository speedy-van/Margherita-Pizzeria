import {
  Pressable,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useSession } from "@/auth/SessionContext";
import { Banner, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { palette, shadow } from "@/format";
import { useLanguage } from "@/i18n/LanguageContext";

type Props = {
  goInvoices: () => void;
  goSettings: () => void;
  goImages: () => void;
  goDiscounts: () => void;
};

export function MoreScreen({
  goInvoices,
  goSettings,
  goImages,
  goDiscounts,
}: Props): JSX.Element {
  const { signOut, user } = useSession();
  const dialog = useDialog();
  const { isArabic, role, setArabic, t } = useLanguage();

  const confirmSignOut = async (): Promise<void> => {
    const ok = await dialog.confirm({
      title: t("Sign out?"),
      message: t("You'll need to enter your password again."),
      confirmLabel: t("Sign out"),
      cancelLabel: t("Cancel"),
      destructive: true,
    });
    if (ok) void signOut();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Section title={t("Configuration")}>
        <Row
          icon="🧾"
          label={t("Invoices")}
          hint={t("Customer invoices")}
          onPress={goInvoices}
        />
        <Row
          icon="⚙️"
          label={t("Settings")}
          hint={t("Delivery, hours, deposits")}
          onPress={goSettings}
        />
        <Row
          icon="🏷️"
          label={t("Discounts")}
          hint={t("Codes and promotions")}
          onPress={goDiscounts}
        />
        <Row
          icon="🖼️"
          label={t("Images")}
          hint={t("Website photos")}
          onPress={goImages}
          last
        />
      </Section>

      <Section title={t("Language")}>
        <View style={[styles.row, isArabic && styles.rowRtl]}>
          <View style={styles.rowIcon}>
            <Text style={styles.rowIconText}>🌐</Text>
          </View>
          <View style={[styles.rowTextBlock, isArabic && styles.rowTextBlockRtl]}>
            <Text style={[styles.rowText, isArabic && styles.rtlText]}>
              {t("Arabic interface")}
            </Text>
            <Text style={[styles.rowHint, isArabic && styles.rtlText]}>
              {t("Switch labels and layout direction.")}
            </Text>
          </View>
          <Switch
            value={isArabic}
            onValueChange={setArabic}
            trackColor={{ false: "#d6d3ca", true: palette.primary }}
            thumbColor={palette.surface}
          />
        </View>
      </Section>

      <Section title={t("Legal & support")}>
        <Row
          icon="🔒"
          label={t("Privacy Policy")}
          hint={t("How we handle order and account data")}
          onPress={() => void Linking.openURL("https://www.margheritapizza.uk/privacy")}
        />
        <Row
          icon="?"
          label={t("Support")}
          hint="https://www.margheritapizza.uk/contact"
          onPress={() => void Linking.openURL("https://www.margheritapizza.uk/contact")}
          last
        />
      </Section>

      <Section title={t("Account")}>
        <View style={[styles.userBlock, isArabic && styles.rowRtl]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.email?.[0] ?? "?").toUpperCase()}
            </Text>
          </View>
          <View style={[styles.rowTextBlock, isArabic && styles.rowTextBlockRtl]}>
            <Text style={[styles.userEmail, isArabic && styles.rtlText]} numberOfLines={1}>
              {user?.email ?? "—"}
            </Text>
            <Text style={[styles.userRole, isArabic && styles.rtlText]}>
              {role(user?.role)}
            </Text>
          </View>
        </View>
        <SecondaryButton
          label={t("Sign out")}
          icon="↩"
          tone="danger"
          onPress={confirmSignOut}
          style={{ marginTop: 12 }}
        />
      </Section>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  const { isArabic } = useLanguage();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
  last,
}: {
  icon: string;
  label: string;
  hint?: string;
  onPress: () => void;
  last?: boolean;
}): JSX.Element {
  const { isArabic } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isArabic && styles.rowRtl,
        !last && styles.rowBorder,
        pressed && { backgroundColor: "#f1f5f9" },
      ]}
    >
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={[styles.rowTextBlock, isArabic && styles.rowTextBlockRtl]}>
        <Text style={[styles.rowText, isArabic && styles.rtlText]}>
          {label}
        </Text>
        {hint ? (
          <Text style={[styles.rowHint, isArabic && styles.rtlText]}>
            {hint}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: palette.bg },
  container: { padding: 16, paddingBottom: 150 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionBody: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
    ...shadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowRtl: { flexDirection: "row-reverse" },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: palette.border },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { fontSize: 18 },
  rowTextBlock: { flex: 1 },
  rowTextBlockRtl: { alignItems: "flex-end" },
  rowText: { color: palette.text, fontSize: 15, fontWeight: "600" },
  rowHint: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  rtlText: { textAlign: "right" },
  chevron: { color: palette.textMuted, fontSize: 24, fontWeight: "300" },
  userBlock: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: palette.primaryText, fontWeight: "800", fontSize: 18 },
  userEmail: { color: palette.text, fontWeight: "700", fontSize: 15 },
  userRole: { color: palette.textMuted, marginTop: 2, textTransform: "capitalize", fontSize: 12 },
});
