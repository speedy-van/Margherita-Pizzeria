export type ApiResult<T> =
  | { ok: true; data: T; warning?: string }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string>;
      };
    };

export interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  displayOrder?: number;
  available?: boolean;
  active?: boolean;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePence: number;
  imageUrl: string | null;
  available: boolean;
  allergens: string[];
  dietaryTags: string[];
}

export interface PublicMenuResponse {
  categories: MenuCategory[];
  generatedAt?: string;
  items?: MenuItem[];
}

export interface CustomerSettings {
  pizzaPromotion?: PublicPromotion | null;
  restaurant: {
    name: string;
    shortName: string;
    tagline: string;
    phone: string;
    phoneTel: string;
    whatsappUrl: string;
    email: string;
    address: string;
    postcode: string;
    latitude: number;
    longitude: number;
    rating: number;
    reviewCount: number;
    tablesCount: number;
  };
  ordering: {
    acceptingOnlineOrders: boolean;
    collectionOpen: boolean;
    deliveryOpen: boolean;
    busyMode: "normal" | "busy" | "very_busy";
    minDeliveryOrderPence: number;
    deliveryFeePence: number;
    prepTimeMinutes: number;
    deliveryTimeMinutes: number;
    deliveryRadiusMiles: number;
    currency: "GBP";
    locale: "en-GB";
  };
  shopStatus: {
    isOpen: boolean;
    closesAt: string | null;
    opensAt: string | null;
    opensDayLabel: string | null;
    message: string;
  };
  openingHours: Record<string, unknown>;
}

export interface PublicPromotion {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: number;
  minOrderPence: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  appliesToDelivery: boolean;
  appliesToCollection: boolean;
}

export interface CartLine {
  item: MenuItem;
  quantity: number;
}

export type OrderMode = "delivery" | "collection";
export type PaymentMethod = "stripe_card" | "cash_on_delivery";

export interface AddressValidation {
  address: string;
  lat: number;
  lng: number;
  milesFromRestaurant: number;
  withinRadius: boolean;
  message: string;
}

export interface AddressSuggestion {
  id: string;
  label: string;
  address: string;
  postcode?: string;
  lat: number;
  lng: number;
  kind: "address" | "postcode" | "place" | "locality" | "neighborhood" | "other";
  hasHouseNumber: boolean;
}

export interface AddressAutocompleteResponse {
  suggestions: AddressSuggestion[];
}

export interface DiscountResult {
  code: string;
  discountPence: number;
  title?: string;
  message?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  reference: string;
  paymentRequired: boolean;
  checkoutUrl?: string;
  redirectUrl?: string;
}

export interface PublicOrder {
  id: string;
  reference: string | null;
  status: string;
  paymentMethod: PaymentMethod;
  estimatedTime: string | null;
  subtotalPence: number;
  deliveryFeePence: number;
  discountPence: number;
  discountCode: string | null;
  totalPence: number;
  customerName: string;
  createdAt: string;
  type: OrderMode;
  address: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPricePence: number;
    totalPence: number;
  }>;
}

export interface OrderTrack {
  orderId: string;
  reference: string | null;
  status: string;
  type: OrderMode;
  estimatedTime: string | null;
  destination: {
    hasDeliveryAddress: boolean;
    lat: number | null;
    lng: number | null;
  };
  driverLocation: {
    lat: number;
    lng: number;
    updatedAt: string;
  } | null;
  lastUpdatedAt: string;
  canTrackDriver: boolean;
  message: string;
}

export interface BookingSlot {
  time: string;
  active: boolean;
  available: boolean;
  remainingTables: number;
  maxCoversAvailable: number;
}

export interface BookingAvailability {
  date: string;
  covers: number;
  slots: BookingSlot[];
  depositEnabled: boolean;
  depositAmountPence: number;
}

export interface BookingResponse {
  bookingId: string;
  reference: string;
  paymentRequired: boolean;
  checkoutUrl?: string;
}

export interface CollectionSlotsResponse {
  slots: Array<{
    id: string;
    time: string;
  }>;
}
