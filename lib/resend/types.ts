import type { Order, TableBooking } from "@/lib/db/schema";

/**
 * Uniform result returned by every `send*` helper in `/lib/resend`.
 *
 * Callers (API routes, webhooks) must never throw based on this value — email
 * failures are operationally annoying, not user-facing.
 */
export type EmailSendResult =
  | { ok: true; id?: string; skipped?: boolean; reason?: string }
  | { ok: false; error: string };

/** Payload to render and send the customer order confirmation email. */
export interface OrderEmailPayload {
  order: Order;
  siteUrl: string;
}

/** Payload to render and send the customer booking confirmation email. */
export interface BookingEmailPayload {
  booking: TableBooking;
  siteUrl: string;
}

/** Public-safe payload built from a validated contact form submission. */
export interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: Date;
}

/** Admin-side notification for a newly received order. */
export interface AdminNewOrderPayload {
  order: Order;
  siteUrl: string;
}

/** Admin-side notification for a newly received booking request. */
export interface AdminNewBookingPayload {
  booking: TableBooking;
  siteUrl: string;
}
