import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { useSession } from "@/auth/SessionContext";
import { Banner, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { palette, shadow } from "@/format";

type Props = {
  goSettings: () => void;
  goImages: () => void;
  goDiscounts: () => void;
};

export function MoreScreen({ goSettings, goImages, goDiscounts }: Props): JSX.Element {
  const { signOut, user, baseUrl, updateBaseUrl, devBypass, setDevBypass } =
    useSession();
  const dialog = useDialog();
  const [base, setBase] = useState(baseUrl);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const confirmSignOut = async (): Promise<void> => {
    const ok = await dialog.confirm({
      title: "Sign out?",
      message: "You'll need to enter your password again.",
      confirmLabel: "Sign out",
      destructive: true,
    });
    if (ok) void signOut();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Section title="Configuration">
        <Row icon="⚙️" label="Settings" hint="Delivery, hours, deposits" onPress={goSettings} />
        <Row icon="🏷️" label="Discounts" hint="Codes and promotions" onPress={goDiscounts} />
        <Row icon="🖼️" label="Images" hint="Website photos" onPress={goImages} last />
      </Section>

      <Section title="Account">
        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.email?.[0] ?? "?").toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email ?? "—"}
            </Text>
            <Text style={styles.userRole}>{user?.role ?? ""}</Text>
          </View>
        </View>
        <SecondaryButton
          label="Sign out"
          icon="↩"
          tone="danger"
          onPress={confirmSignOut}
          style={{ marginTop: 12 }}
        />
      </Section>

      {devBypass ? (
        <View style={{ marginBottom: 16 }}>
          <Banner tone="warning">
            Dev bypass header is ON. Disable before deploying.
          </Banner>
        </View>
      ) : null}

      <Pressable
        onPress={() => setShowAdvanced((v) => !v)}
        style={styles.advancedToggle}
      >
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? "Hide advanced" : "Advanced"}
        </Text>
      </Pressable>

      {showAdvanced ? (
        <Section title="Connection">
          <View style={{ padding: 14 }}>
            <Text style={styles.label}>Backend base URL</Text>
            <TextInput
              value={base}
              onChangeText={setBase}
              onEndEditing={() => void updateBaseUrl(base)}
              autoCapitalize="none"
              keyboardType="url"
              style={styles.input}
            />
            <View style={styles.switchRow}>
              <Switch value={devBypass} onValueChange={(v) => void setDevBypass(v)} />
              <Text style={styles.switchLabel}>Dev bypass (non-production only)</Text>
            </View>
          </View>
        </Section>
      ) : null}

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
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && { backgroundColor: "#f1f5f9" },
      ]}
    >
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowText}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: palette.bg },
  container: { padding: 16 },
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
  rowText: { color: palette.text, fontSize: 15, fontWeight: "600" },
  rowHint: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
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
  advancedToggle: { padding: 12, alignItems: "center" },
  advancedToggleText: { color: palette.textMuted, fontSize: 12 },
  label: {
    color: palette.text,
    fontWeight: "600",
    fontSize: 13,
    paddingBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    color: palette.text,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  switchLabel: { flex: 1, color: palette.textMuted, fontSize: 13 },
});
