import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} accessible={false} />;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, icon, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean;
  loading?: boolean; icon?: IconName; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [styles.button, variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost,
        pressed && styles.pressed, (disabled || loading) && styles.disabled, style]}>
      {loading ? <ActivityIndicator size="small" color={colors.text} /> : icon ? <Icon name={icon} size={20} /> : null}
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="#71776F" selectionColor={colors.primaryPressed}
        autoCapitalize={props.keyboardType === 'email-address' ? 'none' : 'sentences'}
        {...props} style={[styles.input, props.multiline && styles.multiline, !!error && styles.inputError, style]} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function ScreenHeader({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <View style={styles.titleRow}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{action}</View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = 'bag-outline', title, message, actionLabel, onAction }: {
  icon?: IconName; title: string; message: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}><Icon name={icon} size={32} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </Card>
  );
}

export function QuantityStepper({ quantity, onIncrease, onDecrease, disabled }: {
  quantity: number; onIncrease: () => void; onDecrease: () => void; disabled?: boolean;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" onPress={onDecrease}
        disabled={disabled} style={({ pressed }) => [styles.step, pressed && styles.pressed]} hitSlop={4}>
        <Icon name={quantity === 1 ? 'trash-outline' : 'remove'} size={19} />
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.quantity}>{quantity}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" onPress={onIncrease}
        disabled={disabled || quantity >= 20} style={({ pressed }) => [styles.step, pressed && styles.pressed, quantity >= 20 && styles.disabled]} hitSlop={4}>
        <Icon name="add" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 50, paddingHorizontal: 20, paddingVertical: 13, borderRadius: radii.md, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  primary: { backgroundColor: colors.primary, borderColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.background, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  buttonLabel: { color: colors.text, fontFamily: typography.semibold, fontSize: 15, lineHeight: 22, flexShrink: 1, textAlign: 'center' },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.45 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  field: { gap: 7 }, label: { fontFamily: typography.semibold, color: colors.text, fontSize: 13, lineHeight: 20 },
  input: { minHeight: 50, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontFamily: typography.body, fontSize: 16, lineHeight: 23 },
  multiline: { minHeight: 88, textAlignVertical: 'top' }, inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, fontFamily: typography.medium, lineHeight: 20 },
  screenHeader: { gap: 8, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  eyebrow: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 2, lineHeight: 17 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontFamily: typography.heading, fontSize: 32, lineHeight: 40, color: colors.text },
  description: { fontFamily: typography.body, color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  empty: { paddingVertical: 32, alignItems: 'center', gap: 15 },
  emptyIcon: { backgroundColor: colors.surfaceMuted, width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: typography.heading, fontSize: 26, textAlign: 'center', color: colors.text },
  emptyMessage: { fontFamily: typography.body, fontSize: 14, lineHeight: 22, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, overflow: 'hidden', backgroundColor: colors.background },
  step: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 27, textAlign: 'center', color: colors.text, fontFamily: typography.semibold, fontSize: 14 },
});
