/**
 * Public order types shared between client UI, validation, and server-side
 * pricing/persistence logic.
 *
 * Money is always integer pence. Never floats.
 */

import type { OrderItemSnapshot } from "@/types/database";

export type OrderMode = "delivery" | "collection";

export type PaymentMethod = "stripe_card" | "cash_on_delivery";

export interface OrderDraftCartItem {
  menuItemId: string;
  quantity: number;
}

export interface ValidatedOrderItem extends OrderItemSnapshot {}

export interface OrderPricingBreakdown {
  subtotalPence: number;
  deliveryFeePence: number;
  discountPence: number;
  discountCode: string | null;
  totalPence: number;
  minDeliveryOrderPence: number;
  meetsMinimumDelivery: boolean;
}

export interface CreateOrderInput {
  type: OrderMode;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  cartItems: OrderDraftCartItem[];
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  collectionTime?: "asap" | string;
  discountCode?: string;
}

export type CreateOrderResponse =
  | {
      ok: true;
      data: {
        orderId: string;
        paymentRequired: false;
        redirectUrl: string;
      };
    }
  | {
      ok: true;
      data: {
        orderId: string;
        paymentRequired: true;
        checkoutUrl: string;
      };
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string>;
      };
    };

export interface ValidateAddressResponse {
  ok: true;
  data: {
    address: string;
    lat: number;
    lng: number;
    milesFromRestaurant: number;
    withinRadius: boolean;
    message?: string;
  };
}

export interface CollectionSlotOption {
  id: string;
  time: string; // "HH:mm"
}

export interface PublicOrderSummary {
  id: string;
  reference: string | null;
  type: OrderMode;
  status: string;
  customerName: string;
  items: OrderItemSnapshot[];
  subtotalPence: number;
  deliveryFeePence: number;
  discountPence: number;
  discountCode: string | null;
  totalPence: number;
  paymentMethod: PaymentMethod;
  estimatedTime: string | null;
  address: string | null;
  createdAt: string;
}
