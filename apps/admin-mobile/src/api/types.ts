// Mirror of lib/admin/types.ts on the mobile side. Money is integer pence.

export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type UserRole = "admin" | "staff" | string;

export type OrderType = "delivery" | "collection";

export type OrderStatus =
  | "pending_payment"
  | "received"
  | "making"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected";

export const ADMIN_ORDER_STATUSES = [
  "received",
  "making",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
] as const;

export type PaymentMethod = "stripe_card" | "cash_on_delivery";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export const ADMIN_BOOKING_STATUSES = [
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
] as const;

export type AdminUser = {
  id: string;
  email: string | null;
  role: UserRole;
};

export type LoginResponse = {
  token: string;
  expiresAt: string;
  user: AdminUser;
};

export type AdminOrderListItem = {
  id: string;
  reference: string | null;
  type: OrderType;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPence: number;
  paymentMethod: PaymentMethod;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderItemSnapshot = {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePence: number;
  totalPence: number;
  allergens: string[];
};

export type AdminOrderDetail = AdminOrderListItem & {
  address: string | null;
  subtotalPence: number;
  deliveryFeePence: number;
  discountPence: number;
  discountCode: string | null;
  items: OrderItemSnapshot[];
  estimatedTime: string | null;
};

export type AdminBookingListItem = {
  id: string;
  reference: string | null;
  date: string;
  timeSlot: string;
  covers: number;
  status: BookingStatus;
  depositPaid: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminBookingDetail = AdminBookingListItem & {
  tableId: string | null;
};

export type AdminMenuCategory = {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
};

export type AdminMenuItem = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePence: number;
  imageUrl: string | null;
  available: boolean;
  allergens: string[];
  createdAt: string;
};

export type AdminMenuPayload = {
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
};

export type OpeningHoursDay = {
  open: string;
  close: string;
  closed?: boolean;
};

export type OpeningHours = Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  OpeningHoursDay
>;

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type AdminSettings = {
  minDeliveryOrderPence: number;
  deliveryFeePence: number;
  prepTimeMinutes: number;
  deliveryTimeMinutes: number;
  depositEnabled: boolean;
  depositAmountPence: number;
  openingHours: OpeningHours;
};

export type AdminImage = {
  id: string;
  label: string;
  url: string;
  section: string;
  updatedAt: string;
};

export type DiscountType = "percentage" | "fixed";

export type AdminDiscount = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: DiscountType;
  value: number;
  minOrderPence: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  appliesToDelivery: boolean;
  appliesToCollection: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardStats = {
  todayOrderCount: number;
  todayBookingCount: number;
  todayRevenuePence: number;
  pendingBookingsCount: number;
  activeMenuItemsCount: number;
  unavailableMenuItemsCount: number;
  latestOrders: AdminOrderListItem[];
  latestBookings: AdminBookingListItem[];
  generatedAt: string;
};
