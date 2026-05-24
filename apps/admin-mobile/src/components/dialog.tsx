// Unified in-app dialog system.
//
// Why this exists:
//   React Native's built-in `Alert.alert` falls back to `window.alert` /
//   `window.confirm` on the web build — those look out of place in the
//   admin app and can't be styled or themed. On Android the native dialog
//   is themed by the OS and ignores our palette. The admin is used daily
//   by a human (the restaurant owner), so every confirm/error popup must
//   feel like part of the app: large tap targets, clear hierarchy,
//   destructive actions visually distinct.
//
// Features:
//   * `alert()` / `confirm()` Promise-based simple cases.
//   * `show()` for fully custom multi-button dialogs with per-button
//     callbacks — used by the new-order notifier (View order / Dismiss).
//   * Optional `onClose` lifecycle hook (fires once when the dialog leaves
//     the screen for any reason) so callers can stop sounds, timers, etc.
//   * Optional `dismissOnBackdrop: false` for critical alerts that must be
//     acknowledged with a tap on an explicit action.
//   * Spring scale-in animation so it doesn't just pop in flat.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { palette, shadow } from "@/format";

export type DialogTone = "info" | "success" | "warning" | "danger";

type ToneSpec = {
  icon: string;
  bg: string;
  fg: string;
  accent: string;
};

const TONE: Record<DialogTone, ToneSpec> = {
  info: { icon: "ℹ️", bg: palette.infoBg, fg: palette.info, accent: palette.info },
  success: {
    icon: "✅",
    bg: palette.successBg,
    fg: palette.success,
    accent: palette.success,
  },
  warning: {
    icon: "⚠️",
    bg: palette.warningBg,
    fg: palette.warning,
    accent: palette.warning,
  },
  danger: {
    icon: "⛔",
    bg: palette.dangerBg,
    fg: palette.dangerFg,
    accent: palette.danger,
  },
};

export type DialogActionTone = "primary" | "secondary" | "destructive";

export type DialogAction = {
  label: string;
  tone?: DialogActionTone;
  /** Optional handler. Always called BEFORE the dialog closes. */
  onPress?: () => void;
};

type CommonOptions = {
  title: string;
  message?: string;
  tone?: DialogTone;
  /** Fires exactly once when this dialog leaves the screen (any path). */
  onClose?: () => void;
  /** When false, backdrop tap and Android back are ignored. Default: true. */
  dismissOnBackdrop?: boolean;
};

export type AlertOptions = CommonOptions & {
  okLabel?: string;
};

export type ConfirmOptions = CommonOptions & {
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type ShowOptions = CommonOptions & {
  /** Custom action buttons rendered in the order provided. */
  actions: DialogAction[];
};

type DialogState =
  | { kind: "alert"; opts: AlertOptions; resolve: () => void }
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "show"; opts: ShowOptions; resolve: (label: string | null) => void };

type DialogApi = {
  alert: (opts: AlertOptions) => Promise<void>;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Resolves with the label of the pressed action, or null if dismissed. */
  show: (opts: ShowOptions) => Promise<string | null>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used inside <DialogProvider>");
  }
  return ctx;
}

function settleDismiss(s: DialogState): void {
  if (s.kind === "alert") s.resolve();
  else if (s.kind === "confirm") s.resolve(false);
  else s.resolve(null);
  s.opts.onClose?.();
}

export function DialogProvider({ children }: { children: ReactNode }): JSX.Element {
  const [queue, setQueue] = useState<DialogState[]>([]);
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const push = useCallback((state: DialogState) => {
    setQueue((q) => [...q, state]);
  }, []);

  const pop = useCallback((settle: (s: DialogState) => void) => {
    setQueue((q) => {
      if (q.length === 0) return q;
      const [current, ...rest] = q;
      if (current) settle(current);
      return rest;
    });
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      alert: (opts) =>
        new Promise<void>((resolve) => {
          push({ kind: "alert", opts, resolve });
        }),
      confirm: (opts) =>
        new Promise<boolean>((resolve) => {
          push({ kind: "confirm", opts, resolve });
        }),
      show: (opts) =>
        new Promise<string | null>((resolve) => {
          push({ kind: "show", opts, resolve });
        }),
    }),
    [push],
  );

  const current = queue[0] ?? null;

  // Replay scale/fade-in each time a new dialog becomes current.
  useEffect(() => {
    if (!current) return;
    scale.setValue(0.88);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 180,
        mass: 0.7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [current, scale, opacity]);

  const onDismiss = useCallback(() => {
    if (!current) return;
    if (current.opts.dismissOnBackdrop === false) return;
    pop(settleDismiss);
  }, [current, pop]);

  const onPressAction = useCallback(
    (action: DialogAction) => {
      pop((s) => {
        action.onPress?.();
        if (s.kind === "alert") s.resolve();
        else if (s.kind === "confirm") s.resolve(action.tone !== "secondary");
        else s.resolve(action.label);
        s.opts.onClose?.();
      });
    },
    [pop],
  );

  const resolvedTone: DialogTone = current
    ? current.opts.tone ??
      (current.kind === "confirm" && current.opts.destructive ? "danger" : "info")
    : "info";
  const tone = TONE[resolvedTone];

  const actions: DialogAction[] = current
    ? current.kind === "show"
      ? current.opts.actions
      : current.kind === "confirm"
        ? [
            { label: current.opts.cancelLabel ?? "Cancel", tone: "secondary" },
            {
              label: current.opts.confirmLabel ?? "Confirm",
              tone: current.opts.destructive ? "destructive" : "primary",
            },
          ]
        : [{ label: current.opts.okLabel ?? "OK", tone: "primary" }]
    : [];

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={current !== null}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
        statusBarTranslucent
      >
        <Pressable
          style={styles.backdrop}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        >
          <Pressable style={styles.cardWrap} onPress={() => undefined}>
            {current ? (
              <Animated.View
                style={[styles.card, { opacity, transform: [{ scale }] }]}
              >
                <View style={[styles.iconChip, { backgroundColor: tone.bg }]}>
                  <Text style={styles.iconText}>{tone.icon}</Text>
                </View>
                <Text style={styles.title}>{current.opts.title}</Text>
                {current.opts.message ? (
                  <Text style={styles.message}>{current.opts.message}</Text>
                ) : null}
                <View
                  style={[
                    styles.actions,
                    actions.length > 2 && styles.actionsStacked,
                  ]}
                >
                  {actions.map((action, i) => {
                    const isSecondary = action.tone === "secondary";
                    const isDestructive = action.tone === "destructive";
                    const bg = isSecondary
                      ? palette.surfaceAlt
                      : isDestructive
                        ? palette.danger
                        : tone.accent;
                    return (
                      <Pressable
                        key={`${action.label}-${i}`}
                        onPress={() => onPressAction(action)}
                        style={({ pressed }) => [
                          styles.btn,
                          isSecondary ? styles.btnGhost : styles.btnPrimary,
                          { backgroundColor: bg },
                          pressed && styles.btnPressed,
                        ]}
                        accessibilityRole="button"
                      >
                        <Text
                          style={
                            isSecondary
                              ? styles.btnGhostText
                              : styles.btnPrimaryText
                          }
                        >
                          {action.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cardWrap: { width: "100%", maxWidth: 420 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconText: { fontSize: 28 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.text,
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  actionsStacked: { flexDirection: "column-reverse" },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  btnPressed: { opacity: 0.85 },
  btnGhost: { borderWidth: 1, borderColor: palette.border },
  btnGhostText: { color: palette.text, fontWeight: "700", fontSize: 15 },
  btnPrimary: {},
  btnPrimaryText: { color: palette.primaryText, fontWeight: "800", fontSize: 15 },
});
