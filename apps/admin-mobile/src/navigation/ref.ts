// Imperative navigation from outside React components.
//
// Real-time alerts (new orders / bookings) need to jump the user into the
// detail screen when they tap "View order" on the popup. Those alerts are
// fired from a context provider, not a screen, so we can't use the
// `useNavigation` hook — we need a global ref.

import {
  createNavigationContainerRef,
  CommonActions,
} from "@react-navigation/native";

// Param list is `any` here because the root container actually hosts the
// bottom-tab navigator, not the MainStack directly. We use string-based
// nested navigation for cross-tab jumps, which is well-supported by RN.
// Strong typing is enforced at each screen's own useRoute / useNavigation.
export const navigationRef = createNavigationContainerRef<any>();

function jumpToTab(tabName: string, screen: string, params: object): void {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate({
      name: tabName,
      params: { screen, params },
    }),
  );
}

export function navigateToOrder(id: string): void {
  jumpToTab("Orders", "OrderDetail", { id });
}

export function navigateToBooking(id: string): void {
  jumpToTab("Bookings", "BookingDetail", { id });
}
