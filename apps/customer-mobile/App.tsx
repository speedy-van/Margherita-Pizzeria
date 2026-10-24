import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Component, useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator, BackHandler, Image, KeyboardAvoidingView, Platform,
  Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { money } from './src/api';
import { Button, Icon, type IconName } from './src/components/ui';
import { HomeScreen } from './src/screens/HomeScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { BookingScreen } from './src/screens/BookingScreen';
import { TrackScreen } from './src/screens/TrackScreen';
import { CustomerProvider, useCustomerApp, type CustomerRoute } from './src/state/CustomerContext';
import { colors, radii, typography } from './src/theme';

const tabs: { route: CustomerRoute; label: string; icon: IconName; activeIcon: IconName }[] = [
  { route: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { route: 'menu', label: 'Menu', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { route: 'cart', label: 'Bag', icon: 'bag-handle-outline', activeIcon: 'bag-handle' },
  { route: 'book', label: 'Book', icon: 'calendar-outline', activeIcon: 'calendar' },
  { route: 'track', label: 'Track', icon: 'bicycle-outline', activeIcon: 'bicycle' },
];

class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <View style={styles.recovery}>
        <Image source={require('./assets/brand/logo-sage.png')} style={styles.recoveryLogo} />
        <Text style={styles.recoveryTitle}>Let’s try that again.</Text>
        <Text style={styles.recoveryCopy}>We couldn’t display this screen. Your saved bag will be here when you reopen the app.</Text>
        <Button label="Try again" icon="refresh" onPress={() => this.setState({ failed: false })} />
      </View>
    );
    return this.props.children;
  }
}

function CustomerApp() {
  const { route, navigate, settings, loading, refreshing, error, refresh, cartQuantity, subtotalPence } = useCustomerApp();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const activeRoute = route === 'checkout' ? 'cart' : route;
  const open = settings.shopStatus.isOpen && settings.ordering.acceptingOnlineOrders;

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [route]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route === 'home') return false;
      navigate(route === 'checkout' ? 'cart' : 'home');
      return true;
    });
    return () => sub.remove();
  }, [navigate, route]);

  return (
    <SafeAreaView style={styles.app} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Margherita home" onPress={() => navigate('home')} style={styles.brand}>
          <Image source={require('./assets/brand/logo-sage.png')} style={styles.logo} accessibilityIgnoresInvertColors />
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>Margherita</Text>
            <Text style={styles.brandSub}>PIZZERIA · GLASGOW</Text>
          </View>
        </Pressable>
        <View style={styles.openBadge}>
          <View style={[styles.dot, { backgroundColor: open ? colors.success : colors.textMuted }]} />
          <Text style={styles.openText}>{loading ? 'Loading' : error ? 'Offline' : open ? 'Open now' : 'Closed'}</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} style={styles.body} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.success} colors={[colors.success]} />}
          showsVerticalScrollIndicator={false}>
          {error ? <View style={styles.errorBanner} accessibilityRole="alert">
            <Icon name="cloud-offline-outline" size={21} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Retry loading" onPress={() => void refresh()} style={styles.retry}><Icon name="refresh" size={22} /></Pressable>
          </View> : null}
          {loading ? <View style={styles.loading}><ActivityIndicator color={colors.success} /><Text style={styles.loadingText}>Fresh from the kitchen…</Text></View> : (
            route === 'home' ? <HomeScreen /> :
            route === 'menu' ? <MenuScreen /> :
            route === 'cart' ? <CartScreen /> :
            route === 'checkout' ? <CheckoutScreen /> :
            route === 'book' ? <BookingScreen /> : <TrackScreen />
          )}
          <View style={styles.footer}><Text style={styles.footerText}>Hand-stretched. Stone-baked. Made in Dennistoun.</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
      {cartQuantity > 0 && (route === 'home' || route === 'menu' || route === 'cart') ? (
        <View style={styles.cartWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel={route === 'cart' ? 'Continue to checkout' : `View bag, ${cartQuantity} items, ${money(subtotalPence)}`} onPress={() => navigate(route === 'cart' ? 'checkout' : 'cart')} style={({ pressed }) => [styles.cartBar, pressed && styles.pressed]}>
            <View style={styles.cartCount}><Text style={styles.cartCountText}>{cartQuantity}</Text></View>
            <Text style={styles.cartLabel}>{route === 'cart' ? 'Continue to checkout' : 'View your bag'}</Text>
            <Text style={styles.cartPrice}>{money(subtotalPence)}</Text><Icon name="arrow-forward" size={20} />
          </Pressable>
        </View>
      ) : null}
      <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 9) }]}>
        {tabs.map(tab => {
          const selected = tab.route === activeRoute;
          return <Pressable key={tab.route} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={tab.label === 'Bag' ? `Bag, ${cartQuantity} items` : tab.label}
            onPress={() => navigate(tab.route)} style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.pressed]}>
            <View><Icon name={selected ? tab.activeIcon : tab.icon} size={23} />
              {tab.route === 'cart' && cartQuantity > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{cartQuantity > 99 ? '99+' : cartQuantity}</Text></View> : null}
            </View>
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, PlayfairDisplay_600SemiBold, ...Ionicons.font });
  return <SafeAreaProvider><AppBoundary>
    {!fontsLoaded && !fontError ? <View style={styles.recovery}><Image source={require('./assets/brand/logo-sage.png')} style={styles.recoveryLogo} /><ActivityIndicator color={colors.success} /></View> :
      <CustomerProvider><CustomerApp /></CustomerProvider>}
  </AppBoundary></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background }, body: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logo: { width: 45, height: 45, borderRadius: 23 }, brandCopy: { gap: 3, flexShrink: 1 },
  brandName: { fontFamily: typography.heading, fontSize: 23, color: colors.text },
  brandSub: { fontFamily: typography.medium, fontSize: 8, color: colors.textMuted, letterSpacing: 1.6 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 7 },
  dot: { width: 6, height: 6, borderRadius: 3 }, openText: { fontFamily: typography.semibold, fontSize: 10, color: colors.text },
  content: { padding: 16, gap: 20, paddingBottom: 24, maxWidth: 680, width: '100%', alignSelf: 'center', flexGrow: 1 },
  loading: { paddingVertical: 100, alignItems: 'center', gap: 16 }, loadingText: { fontFamily: typography.body, color: colors.textMuted, fontSize: 14 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, backgroundColor: '#FFF1ED', borderRadius: radii.md },
  errorText: { flex: 1, fontFamily: typography.body, fontSize: 12, lineHeight: 18, color: colors.danger }, retry: { padding: 8 },
  navigation: { flexDirection: 'row', backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, paddingHorizontal: 9, gap: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, gap: 5, borderRadius: 14 },
  tabSelected: { backgroundColor: colors.primary }, tabText: { fontFamily: typography.medium, fontSize: 10, color: colors.text },
  tabTextSelected: { fontFamily: typography.bold }, pressed: { opacity: 0.65 },
  badge: { position: 'absolute', top: -6, right: -12, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 4, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontFamily: typography.bold, fontSize: 10 },
  cartWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.background },
  cartBar: { backgroundColor: colors.primary, borderRadius: radii.md, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'center' },
  cartCount: { borderWidth: 1, borderColor: colors.primaryPressed, borderRadius: 8, minWidth: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  cartCountText: { fontFamily: typography.bold, fontSize: 13, color: colors.text }, cartLabel: { flex: 1, fontFamily: typography.semibold, fontSize: 14, color: colors.text }, cartPrice: { fontFamily: typography.bold, fontSize: 14, color: colors.text },
  footer: { paddingVertical: 12, alignItems: 'center' }, footerText: { fontFamily: typography.body, fontSize: 10, lineHeight: 16, textAlign: 'center', color: colors.textMuted },
  recovery: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 20, backgroundColor: colors.background },
  recoveryLogo: { width: 100, height: 100, borderRadius: 50 }, recoveryTitle: { fontFamily: typography.heading, color: colors.text, fontSize: 28, textAlign: 'center' },
  recoveryCopy: { fontFamily: typography.body, fontSize: 15, lineHeight: 23, color: colors.textMuted, textAlign: 'center' },
});
