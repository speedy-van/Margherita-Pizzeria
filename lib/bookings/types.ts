/**
 * Public booking types shared between client UI, validation, and server-side
 * logic. Money is integer pence.
 */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export interface BookingAvailabilitySlot {
  time: string; // "HH:mm"
  active: boolean;
  available: boolean;
  remainingTables: number;
  maxCoversAvailable: number;
}

export interface BookingAvailabilityResponse {
  date: string; // "YYYY-MM-DD"
  covers: number;
  slots: BookingAvailabilitySlot[];
  depositEnabled: boolean;
  depositAmountPence: number;
}

export interface CreateBookingInput {
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "HH:mm"
  covers: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  payDeposit: boolean;
}

export type CreateBookingResponse =
  | {
      ok: true;
      data: {
        bookingId: string;
        paymentRequired: false;
        redirectUrl: string;
      };
    }
  | {
      ok: true;
      data: {
        bookingId: string;
        paymentRequired: true;
        checkoutUrl: string;
        redirectUrl: string;
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

export interface PublicBookingSummary {
  id: string;
  reference: string | null;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "HH:mm"
  covers: number;
  status: BookingStatus;
  depositPaid: boolean;
  estimatedMessage: string;
  createdAt: string;
}

export interface BookingStatusUpdateInput {
  status: Exclude<BookingStatus, "pending">;
}

export interface BookingSettings {
  depositEnabled: boolean;
  depositAmountPence: number;
}
