// Shared param-list types for the main stack-per-tab navigation.

export type MainStackParamList = {
  DashboardHome: undefined;
  OrdersHome: undefined;
  OrderDetail: { id: string };
  BookingsHome: undefined;
  BookingDetail: { id: string };
  MenuHome: undefined;
  MenuItemEdit: { id: string | null; categoryId?: string | null };
  MoreHome: undefined;
  Settings: undefined;
  Images: undefined;
  Discounts: undefined;
  DiscountEdit: { id: string | null };
};
