import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiCall } from "@/api/client";
import { Banner, PrimaryButton } from "@/components/controls";
import { palette } from "@/format";

export function ForgotPasswordScreen({
  onBack,
}: {
  onBack: () => void;
}): JSX.Element {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const res = await apiCall({
      method: "POST",
      path: "/api/admin/auth/forgot-password",
      body: { email: email.trim() },
    });
    setBusy(false);
    if (res.ok) setSent(true);
    else setError(res.message);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Reset your password</Text>
      <Text style={styles.muted}>
        We&apos;ll email you a link if an admin account matches.
      </Text>

      {sent ? (
        <View style={{ marginTop: 16 }}>
          <Banner tone="success">
            If that account exists, a reset link is on its way. Check your inbox.
          </Banner>
          <PrimaryButton
            label="Back to sign in"
            icon="←"
            onPress={onBack}
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholder="you@margheritapizza.uk"
            placeholderTextColor="#94a3b8"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
          {error ? (
            <View style={{ marginTop: 14 }}>
              <Banner tone="danger">{error}</Banner>
            </View>
          ) : null}
          <PrimaryButton
            label="Send reset link"
            icon="✉️"
            busy={busy}
            onPress={submit}
            style={{ marginTop: 20 }}
          />
          <Pressable onPress={onBack} style={styles.link}>
            <Text style={styles.linkText}>← Back to sign in</Text>
          </Pressable>
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: palette.bg, flexGrow: 1 },
  h1: { fontSize: 22, fontWeight: "700", color: palette.text },
  muted: { color: palette.textMuted, marginTop: 6, marginBottom: 18 },
  label: { fontWeight: "600", color: palette.text, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: palette.surface,
    fontSize: 16,
    color: palette.text,
  },
  link: { padding: 14, alignItems: "center", marginTop: 4 },
  linkText: { color: palette.primary, fontWeight: "600" },
});
