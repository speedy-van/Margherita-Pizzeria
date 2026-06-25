import { ReactNode, useRef } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { buttonNeon, palette, shadow } from "@/format";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  icon?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps): JSX.Element {
  const pressLocked = useRef(false);
  const handlePress = (): void => {
    if (pressLocked.current || disabled || busy) return;
    pressLocked.current = true;
    onPress();
    setTimeout(() => {
      pressLocked.current = false;
    }, 700);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        controlStyles.primary,
        (disabled || busy) && controlStyles.disabled,
        pressed && controlStyles.pressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={palette.primaryText} />
      ) : (
        <View style={controlStyles.row}>
          {icon ? <Text style={controlStyles.primaryIcon}>{icon}</Text> : null}
          <Text style={controlStyles.primaryText} numberOfLines={2}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  busy,
  icon,
  style,
  accessibilityLabel,
  tone = "default",
}: ButtonProps & { tone?: "default" | "danger" | "success" }): JSX.Element {
  const pressLocked = useRef(false);
  const color =
    tone === "danger"
      ? palette.danger
      : tone === "success"
        ? palette.success
        : palette.text;
  const handlePress = (): void => {
    if (pressLocked.current || disabled || busy) return;
    pressLocked.current = true;
    onPress();
    setTimeout(() => {
      pressLocked.current = false;
    }, 700);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        controlStyles.secondary,
        (disabled || busy) && controlStyles.disabled,
        pressed && controlStyles.pressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={controlStyles.row}>
          {icon ? (
            <Text style={[controlStyles.secondaryIcon, { color }]}>{icon}</Text>
          ) : null}
          <Text style={[controlStyles.secondaryText, { color }]} numberOfLines={2}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function ContactActions({
  phone,
  email,
  address,
  onCopyAddress,
}: {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  onCopyAddress?: () => void;
}): JSX.Element | null {
  const actions: Array<{ icon: string; label: string; onPress: () => void }> =
    [];
  if (phone) {
    actions.push({
      icon: "📞",
      label: "Call",
      onPress: () => void Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`),
    });
    actions.push({
      icon: "💬",
      label: "SMS",
      onPress: () => void Linking.openURL(`sms:${phone.replace(/\s+/g, "")}`),
    });
  }
  if (email) {
    actions.push({
      icon: "✉️",
      label: "Email",
      onPress: () => void Linking.openURL(`mailto:${email}`),
    });
  }
  if (address && onCopyAddress) {
    actions.push({ icon: "📋", label: "Copy address", onPress: onCopyAddress });
  }
  if (address) {
    actions.push({
      icon: "🗺️",
      label: "Map",
      onPress: () =>
        void Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        ),
    });
  }
  if (actions.length === 0) return null;
  return (
    <View style={contactStyles.row}>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          style={({ pressed }) => [
            contactStyles.btn,
            pressed && controlStyles.pressed,
          ]}
        >
          <Text style={contactStyles.icon}>{a.icon}</Text>
          <Text style={contactStyles.label}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Banner({
  tone,
  children,
}: {
  tone: "info" | "warning" | "danger" | "success";
  children: ReactNode;
}): JSX.Element {
  const styleMap = {
    info: { bg: palette.infoBg, fg: palette.info },
    warning: { bg: palette.warningBg, fg: palette.warning },
    danger: { bg: palette.dangerBg, fg: palette.dangerFg },
    success: { bg: palette.successBg, fg: palette.success },
  } as const;
  const s = styleMap[tone];
  return (
    <View style={[bannerStyles.wrap, { backgroundColor: s.bg }]}>
      <Text style={[bannerStyles.text, { color: s.fg }]}>{children}</Text>
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}): JSX.Element {
  return (
    <View style={bannerStyles.wrap}>
      <Text style={bannerStyles.errTitle}>Something went wrong</Text>
      <Text style={bannerStyles.errMsg}>{message}</Text>
      {onRetry ? (
        <PrimaryButton
          label="Try again"
          onPress={onRetry}
          style={{ marginTop: 12, alignSelf: "flex-start" }}
        />
      ) : null}
    </View>
  );
}

const controlStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
  },
  primary: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
    ...buttonNeon,
  },
  primaryText: {
    color: palette.primaryText,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
    flexShrink: 1,
    textAlign: "center",
  },
  primaryIcon: { color: palette.primaryText, fontSize: 16 },
  secondary: {
    backgroundColor: palette.surface,
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    ...buttonNeon,
  },
  secondaryText: {
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
    textAlign: "center",
  },
  secondaryIcon: { fontSize: 14 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});

const contactStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: palette.surface,
    marginRight: 6,
    marginBottom: 6,
    ...buttonNeon,
  },
  icon: { fontSize: 14 },
  label: { color: palette.text, fontWeight: "600", fontSize: 12 },
});

const bannerStyles = StyleSheet.create({
  wrap: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  text: { fontSize: 13, fontWeight: "500" },
  errTitle: { color: palette.dangerFg, fontWeight: "700", marginBottom: 4 },
  errMsg: { color: palette.dangerFg, fontSize: 13 },
});
