import type { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { palette, shadow } from "@/format";

export function useScreenBottomPadding(extra = 16): number {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  return Math.max(tabBarHeight, insets.bottom) + extra;
}

export function ScreenLayout({
  children,
  header,
  scroll = true,
  refreshing,
  onRefresh,
  fixedBottom,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps,
}: {
  children: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  fixedBottom?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
}): JSX.Element {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPadding = Math.max(tabBarHeight, insets.bottom) + 16;
  const fixedBottomOffset = Math.max(tabBarHeight, insets.bottom);

  return (
    <SafeAreaView edges={["left", "right"]} style={[styles.safe, style]}>
      {header ? <View style={styles.header}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          scrollIndicatorInsets={{ bottom: bottomPadding }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor={palette.primary}
              />
            ) : undefined
          }
          contentContainerStyle={[
            styles.content,
            contentContainerStyle,
            { paddingBottom: fixedBottom ? bottomPadding + 84 : bottomPadding },
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.nonScroll, contentContainerStyle]}>{children}</View>
      )}
      {fixedBottom ? (
        <View style={[styles.fixedBottom, { bottom: fixedBottomOffset + 8 }]}>
          {fixedBottom}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1, backgroundColor: palette.bg },
  content: {
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  nonScroll: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  fixedBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    ...shadow,
  },
});
