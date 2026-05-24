import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/auth/SessionContext";
import { Banner, PrimaryButton } from "@/components/controls";
import { STORAGE_KEYS } from "@/config";
import { palette } from "@/format";
import {
  ensureBrowserNotificationPermission,
  primeAlertSound,
} from "@/hooks/alerts";

export function LoginScreen({
  onForgotPassword,
}: {
  onForgotPassword: () => void;
}): JSX.Element {
  const { signIn, baseUrl, updateBaseUrl, devBypass, setDevBypass } =
    useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [base, setBase] = useState(baseUrl);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Restore last-used email.
  useEffect(() => {
    void (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.rememberedEmail);
      if (stored) setEmail(stored);
    })();
  }, []);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    if (base !== baseUrl) await updateBaseUrl(base);
    // Browsers (Chrome 64+, Safari) require Notification.requestPermission
    // AND audio.play() to be called from a user-gesture handler. The
    // sign-in tap IS that gesture, so we piggy-back on it to both ask for
    // notification permission AND prime an Audio element so the new-order
    // alert sound can be triggered later from the polling timer.
    void ensureBrowserNotificationPermission();
    void primeAlertSound();
    const trimmed = email.trim();
    const res = await signIn(trimmed, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (remember) {
      await AsyncStorage.setItem(STORAGE_KEYS.rememberedEmail, trimmed);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.rememberedEmail);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.brand}>
            <Text style={styles.brandLogo}>MARGHERITA</Text>
            <Text style={styles.brandSub}>ADMIN</Text>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
            placeholder="you@margheritapizza.uk"
            placeholderTextColor="#94a3b8"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              style={[styles.input, styles.inputWithIcon]}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              style={styles.eye}
            >
              <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
            </Pressable>
          </View>

          <View style={styles.rememberRow}>
            <Switch value={remember} onValueChange={setRemember} />
            <Text style={styles.rememberLabel}>Remember email</Text>
          </View>

          {error ? <View style={{ marginTop: 14 }}><Banner tone="danger">{error}</Banner></View> : null}

          <PrimaryButton
            label="Sign in"
            busy={busy}
            onPress={submit}
            style={{ marginTop: 20 }}
          />

          <Pressable onPress={onForgotPassword} style={styles.link}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowAdvanced((v) => !v)}
            style={styles.advancedToggle}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? "Hide advanced" : "Advanced"}
            </Text>
          </Pressable>

          {showAdvanced ? (
            <View style={styles.advanced}>
              <Text style={styles.label}>Backend base URL</Text>
              <TextInput
                value={base}
                onChangeText={setBase}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.row}>
                <Switch
                  value={devBypass}
                  onValueChange={(v) => void setDevBypass(v)}
                />
                <Text style={styles.rowLabel}>
                  Dev bypass header (non-production only)
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  container: { padding: 24, paddingTop: 32 },
  brand: { alignItems: "center", marginBottom: 40 },
  brandLogo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
    color: palette.primary,
  },
  brandSub: {
    fontSize: 12,
    letterSpacing: 6,
    color: palette.textMuted,
    marginTop: 4,
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: "600",
    color: palette.text,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: palette.surface,
    color: palette.text,
    fontSize: 16,
  },
  inputWithIcon: { paddingRight: 44 },
  passwordWrap: { position: "relative" },
  eye: { position: "absolute", right: 12, top: 12, padding: 4 },
  eyeText: { fontSize: 18 },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  rememberLabel: { color: palette.textMuted, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  rowLabel: { flex: 1, color: palette.textMuted, fontSize: 13 },
  link: { padding: 12, alignItems: "center", marginTop: 4 },
  linkText: { color: palette.primary, fontWeight: "600" },
  advancedToggle: { padding: 12, alignItems: "center", marginTop: 32 },
  advancedToggleText: { color: palette.textMuted, fontSize: 12 },
  advanced: {
    marginTop: 8,
    padding: 16,
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
});
