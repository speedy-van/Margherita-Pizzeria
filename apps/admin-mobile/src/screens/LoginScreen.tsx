import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Image,
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({
  onForgotPassword,
}: {
  onForgotPassword: () => void;
}): JSX.Element {
  const { signIn, sessionMessage } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError(null);
    // Browsers (Chrome 64+, Safari) require Notification.requestPermission
    // AND audio.play() to be called from a user-gesture handler. The
    // sign-in tap IS that gesture, so we piggy-back on it to both ask for
    // notification permission AND prime an Audio element so the new-order
    // alert sound can be triggered later from the polling timer.
    void ensureBrowserNotificationPermission();
    void primeAlertSound();
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
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.panel}>
            <View style={styles.brand}>
              <Image
                source={require("../../assets/icons/icon.png")}
                style={styles.logo}
              />
              <View style={styles.brandCopy}>
                <Text style={styles.brandLogo}>MARGHERITA</Text>
                <Text style={styles.brandSub}>ADMIN</Text>
              </View>
            </View>

            <Text style={styles.formTitle}>Staff sign in</Text>

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
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
                style={styles.passwordToggle}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.rememberRow}>
              <Switch value={remember} onValueChange={setRemember} />
              <Text style={styles.rememberLabel}>Remember email</Text>
            </View>

            {error ? <View style={{ marginTop: 14 }}><Banner tone="danger">{error}</Banner></View> : null}
            {!error && sessionMessage ? (
              <View style={{ marginTop: 14 }}>
                <Banner tone="warning">{sessionMessage}</Banner>
              </View>
            ) : null}

            <PrimaryButton
              label="Sign in"
              busy={busy}
              onPress={submit}
              style={{ marginTop: 20 }}
            />

            <Pressable onPress={onForgotPassword} style={styles.link}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
  },
  panel: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 22,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 26,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: "#000",
  },
  brandCopy: { flex: 1 },
  brandLogo: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 3,
    color: palette.primary,
  },
  brandSub: {
    fontSize: 12,
    letterSpacing: 6,
    color: palette.textMuted,
    marginTop: 4,
  },
  formTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
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
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    backgroundColor: palette.surface,
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    color: palette.text,
    fontSize: 16,
  },
  passwordToggle: {
    alignSelf: "stretch",
    minWidth: 74,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: palette.border,
    backgroundColor: palette.surfaceAlt,
  },
  passwordToggleText: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.primary,
  },
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
});
