import type { OrderStatus, OrderType } from "@/types/database";

export type TrackingOrderStatus = OrderStatus;

export interface TrackingCoordinates {
  lat: number;
  lng: number;
}

export interface PublicTrackingSummary {
  orderId: string;
  reference: string | null;
  type: OrderType;
  status: TrackingOrderStatus;
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

export interface UpdateDriverLocationInput {
  lat: number;
  lng: number;
}

export interface TrackingApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export type TrackingApiResponse =
  | { ok: true; data: PublicTrackingSummary }
  | { ok: false; error: TrackingApiError };
