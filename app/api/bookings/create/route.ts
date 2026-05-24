import { NextResponse } from "next/server";

import {
  assignBestTableForBooking,
  getBookingSettings,
} from "@/lib/bookings/availability";
import {
  createBooking,
  updateBookingStripeSession,
} from "@/lib/bookings/queries";
import { validateCreateBookingInput } from "@/lib/bookings/validation";
import { sendBookingConfirmationEmail } from "@/lib/resend/send-booking-confirmation";
import { sendAdminNewBookingEmail } from "@/lib/resend/send-admin-new-booking";
import { createBookingDepositCheckoutSession } from "@/lib/stripe/booking-checkout";
import { notifyAdminDevices } from "@/lib/notifications/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      },
      { status: 400 },
    );
  }

  const validation = validateCreateBookingInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }
  const input = validation.data;

  const settings = await getBookingSettings();

  // Server-authoritative table assignment + re-check availability.
  let assigned: { tableId: string } | null = null;
  try {
    assigned = await assignBestTableForBooking(
      input.date,
      input.timeSlot,
      input.covers,
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/bookings/create] assignment failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_CREATE_FAILED",
          message: "We couldn't create your booking. Please try again.",
        },
      },
      { status: 500 },
    );
  }
  if (!assigned) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_SLOT_UNAVAILABLE",
          message: "That time is no longer available. Please choose another slot.",
        },
      },
      { status: 409 },
    );
  }

  const wantsDeposit =
    settings.depositEnabled &&
    input.payDeposit &&
    settings.depositAmountPence > 0;

  let booking;
  try {
    booking = await createBooking(input, assigned.tableId, {
      requireDepositPayment: wantsDeposit,
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/bookings/create] insert failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_CREATE_FAILED",
          message: "We couldn't create your booking. Please try again.",
        },
      },
      { status: 500 },
    );
  }

  if (!wantsDeposit) {
    // Fire-and-forget emails.
    try {
      await sendBookingConfirmationEmail(booking);
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(
        "[api/bookings/create] Email send failed: sendBookingConfirmationEmail",
        err instanceof Error ? err.message : err,
      );
    }
    try {
      await sendAdminNewBookingEmail(booking);
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(
        "[api/bookings/create] Email send failed: sendAdminNewBookingEmail",
        err instanceof Error ? err.message : err,
      );
    }
    try {
      await notifyAdminDevices({
        title: "New booking request",
        body: `${booking.reference ?? booking.id.slice(0, 8)} · ${booking.covers} covers · ${booking.date} ${booking.timeSlot}`,
        data: {
          type: "new_booking",
          bookingId: booking.id,
          reference: booking.reference ?? "",
        },
      });
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(
        "[api/bookings/create] FCM admin notify failed",
        err instanceof Error ? err.message : err,
      );
    }
    return NextResponse.json(
      {
        ok: true,
        data: {
          bookingId: booking.id,
          reference: booking.reference,
          paymentRequired: false,
          redirectUrl: `/book/success?bookingId=${booking.id}`,
        },
      },
      { status: 201 },
    );
  }

  try {
    const session = await createBookingDepositCheckoutSession({
      bookingId: booking.id,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      date: input.date,
      timeSlot: input.timeSlot,
      covers: input.covers,
      depositAmountPence: settings.depositAmountPence,
    });
    await updateBookingStripeSession(booking.id, session.sessionId);
    // Fire-and-forget admin notification — every booking request is logged.
    // Customer confirmation for deposit bookings is sent once the deposit
    // webhook fires (the helper is gated on the pending→confirmed transition).
    try {
      await sendAdminNewBookingEmail(booking);
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(
        "[api/bookings/create] Email send failed: sendAdminNewBookingEmail",
        err instanceof Error ? err.message : err,
      );
    }
    try {
      await notifyAdminDevices({
        title: "New booking request",
        body: `${booking.reference ?? booking.id.slice(0, 8)} · ${booking.covers} covers · ${booking.date} ${booking.timeSlot}`,
        data: {
          type: "new_booking",
          bookingId: booking.id,
          reference: booking.reference ?? "",
        },
      });
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error(
        "[api/bookings/create] FCM admin notify failed",
        err instanceof Error ? err.message : err,
      );
    }
    return NextResponse.json(
      {
        ok: true,
        data: {
          bookingId: booking.id,
          reference: booking.reference,
          paymentRequired: true,
          checkoutUrl: session.url,
          redirectUrl: `/book/success?bookingId=${booking.id}`,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/bookings/create] stripe checkout failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "STRIPE_SESSION_FAILED",
          message: "We couldn't start the deposit payment. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
