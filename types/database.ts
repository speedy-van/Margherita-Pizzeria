export type UserRole = "admin" | "staff";

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

export type PaymentMethod = "stripe_card" | "cash_on_delivery";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export type SlotType = "collection" | "booking";

export interface OrderItemSnapshot {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePence: number;
  totalPence: number;
  allergens: string[];
}

export interface OrderAttributionSnapshot {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  gclAw?: string;
  gclGb?: string;
  gclDc?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;
  referrer?: string;
  capturedAt: string;
  lastSeenAt: string;
}

export interface PublicMenuItem {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePence: number;
  imageUrl: string | null;
  available: boolean;
  allergens: string[];
}

export interface PublicMenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  items: PublicMenuItem[];
}

export interface OpeningHoursDay {
  open: string; // "HH:mm"
  close: string; // "HH:mm"
  closed?: boolean;
}

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

export interface PublicSettings {
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
