/**
 * Admin-facing types used by both API responses and the admin UI.
 * Money is always integer pence. Never floats.
 */

import type {
  BookingStatus,
  OpeningHours,
  OrderItemSnapshot,
  OrderStatus,
  OrderType,
  PaymentMethod,
  SlotType,
  UserRole,
} from "@/types/database";

export type AdminApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: AdminApiError };

export interface AdminApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AdminDashboardStats {
  todayOrderCount: number;
  todayBookingCount: number;
  todayRevenuePence: number;
  pendingBookingsCount: number;
  activeMenuItemsCount: number;
  unavailableMenuItemsCount: number;
  latestOrders: AdminOrderListItem[];
  latestBookings: AdminBookingListItem[];
  /** ISO timestamp the stats were computed at. */
  generatedAt: string;
  /** True when the server's local timezone was used (no dedicated TZ helper). */
  usingServerTimezone: true;
}

export interface AdminOrderListItem {
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
  items: OrderItemSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  address: string | null;
  subtotalPence: number;
  deliveryFeePence: number;
  discountPence: number;
  discountCode: string | null;
  items: OrderItemSnapshot[];
  estimatedTime: string | null;
}

export interface AdminBookingListItem {
  id: string;
  reference: string | null;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  covers: number;
  status: BookingStatus;
  depositPaid: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBookingDetail extends AdminBookingListItem {
  tableId: string | null;
}

export interface AdminMenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
}

export interface AdminMenuItem {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePence: number;
  imageUrl: string | null;
  available: boolean;
  allergens: string[];
  createdAt: string;
}

export interface AdminMenuPayload {
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
}

export interface AdminSettings {
  acceptingOnlineOrders: boolean;
  collectionOpen: boolean;
  deliveryOpen: boolean;
  busyMode: "normal" | "busy" | "very_busy";
  minDeliveryOrderPence: number;
  deliveryFeePence: number;
  prepTimeMinutes: number;
  deliveryTimeMinutes: number;
  customerMessage: string;
  depositEnabled: boolean;
  depositAmountPence: number;
  openingHours: OpeningHours;
}

export interface AdminTimeSlot {
  id: string;
  type: SlotType;
  time: string; // HH:mm
  active: boolean;
  createdAt: string;
}

export interface AdminTable {
  id: string;
  number: number;
  maxCovers: number;
  active: boolean;
  createdAt: string;
}

export interface AdminImage {
  id: string;
  label: string;
  url: string;
  section: string;
  updatedAt: string;
}
