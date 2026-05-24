import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSession } from "@/auth/SessionContext";
import { palette } from "@/format";
import { useBadges } from "@/hooks/useBadges";
import type { MainStackParamList } from "@/navigation/types";
import { BookingDetailScreen } from "@/screens/BookingDetailScreen";
import { BookingsScreen } from "@/screens/BookingsScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { DiscountEditScreen } from "@/screens/DiscountEditScreen";
import { DiscountsScreen } from "@/screens/DiscountsScreen";
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen";
import { ImagesScreen } from "@/screens/ImagesScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { MenuItemEditScreen } from "@/screens/MenuItemEditScreen";
import { MenuScreen } from "@/screens/MenuScreen";
import { MoreScreen } from "@/screens/MoreScreen";
import { OrderDetailScreen } from "@/screens/OrderDetailScreen";
import { OrdersScreen } from "@/screens/OrdersScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";

type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const DashboardStack = createNativeStackNavigator<MainStackParamList>();
const OrdersStack = createNativeStackNavigator<MainStackParamList>();
const BookingsStack = createNativeStackNavigator<MainStackParamList>();
const MenuStack = createNativeStackNavigator<MainStackParamList>();
const MoreStack = createNativeStackNavigator<MainStackParamList>();
const Tabs = createBottomTabNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: palette.surface },
  headerTitleStyle: { color: palette.text },
  headerTintColor: palette.primary,
};

function DashboardNavigator(): JSX.Element {
  return (
    <DashboardStack.Navigator screenOptions={headerOptions}>
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <DashboardStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Order" }}
      />
      <DashboardStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ title: "Booking" }}
      />
    </DashboardStack.Navigator>
  );
}

function OrdersNavigator(): JSX.Element {
  return (
    <OrdersStack.Navigator screenOptions={headerOptions}>
      <OrdersStack.Screen
        name="OrdersHome"
        component={OrdersScreen}
        options={{ title: "Orders" }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Order" }}
      />
    </OrdersStack.Navigator>
  );
}

function BookingsNavigator(): JSX.Element {
  return (
    <BookingsStack.Navigator screenOptions={headerOptions}>
      <BookingsStack.Screen
        name="BookingsHome"
        component={BookingsScreen}
        options={{ title: "Bookings" }}
      />
      <BookingsStack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ title: "Booking" }}
      />
    </BookingsStack.Navigator>
  );
}

function MenuNavigator(): JSX.Element {
  return (
    <MenuStack.Navigator screenOptions={headerOptions}>
      <MenuStack.Screen
        name="MenuHome"
        component={MenuScreen}
        options={{ title: "Menu" }}
      />
      <MenuStack.Screen
        name="MenuItemEdit"
        component={MenuItemEditScreen}
        options={({ route }) => ({
          title: route.params.id ? "Edit item" : "New item",
        })}
      />
    </MenuStack.Navigator>
  );
}

function MoreNavigator(): JSX.Element {
  return (
    <MoreStack.Navigator screenOptions={headerOptions}>
      <MoreStack.Screen name="MoreHome" options={{ title: "More" }}>
        {({ navigation }) => (
          <MoreScreen
            goSettings={() => navigation.navigate("Settings")}
            goImages={() => navigation.navigate("Images")}
            goDiscounts={() => navigation.navigate("Discounts")}
          />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <MoreStack.Screen
        name="Images"
        component={ImagesScreen}
        options={{ title: "Images" }}
      />
      <MoreStack.Screen
        name="Discounts"
        component={DiscountsScreen}
        options={{ title: "Discounts" }}
      />
      <MoreStack.Screen
        name="DiscountEdit"
        component={DiscountEditScreen}
        options={({ route }) => ({
          title: route.params.id ? "Edit discount" : "New discount",
        })}
      />
    </MoreStack.Navigator>
  );
}

function AuthNavigator(): JSX.Element {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onForgotPassword={() => navigation.navigate("ForgotPassword")}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen
        name="ForgotPassword"
        options={{
          headerShown: true,
          title: "Forgot password",
          ...headerOptions,
        }}
      >
        {({ navigation }) => (
          <ForgotPasswordScreen onBack={() => navigation.goBack()} />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function MainNavigator(): JSX.Element {
  const { activeOrders, pendingBookings } = useBadges();
  const insets = useSafeAreaInsets();
  // Lift the tab bar well above the system navigation bar / home indicator so
  // both icons AND labels stay fully visible in the thumb zone.
  const bottomInset = Math.max(insets.bottom, 16) + 16;
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          height: 72 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarBadgeStyle: {
          backgroundColor: palette.primary,
          color: palette.primaryText,
          fontSize: 10,
          fontWeight: "700",
          minWidth: 18,
          height: 18,
          lineHeight: 14,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={DashboardNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Orders"
        component={OrdersNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} />,
          tabBarBadge: activeOrders > 0 ? activeOrders : undefined,
        }}
      />
      <Tabs.Screen
        name="Bookings"
        component={BookingsNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="📅" color={color} />,
          tabBarBadge: pendingBookings > 0 ? pendingBookings : undefined,
        }}
      />
      <Tabs.Screen
        name="Menu"
        component={MenuNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="🍕" color={color} />,
        }}
      />
      <Tabs.Screen
        name="More"
        component={MoreNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }): JSX.Element {
  return (
    <Text style={{ fontSize: 20, color, lineHeight: 22 }}>{icon}</Text>
  );
}

export function RootNavigator(): JSX.Element | null {
  const { status } = useSession();
  if (status === "unknown") return null;
  return status === "signed-in" ? <MainNavigator /> : <AuthNavigator />;
}
