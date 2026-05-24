import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getBookingById,
  getPublicBookingSummary,
  updateBookingStatus,
} from "@/lib/bookings/queries";
import {
  validateBookingId,
  validateBookingStatusUpdateInput,
} from "@/lib/bookings/validation";
import { sendBookingRejectedEmail } from "@/lib/resend/send-booking-rejected";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return guard.response;
  }

  const { id } = await context.params;
  const idCheck = validateBookingId(id);
  if (!idCheck.ok) {
    return NextResponse.json(
      { ok: false, error: idCheck.error },
      { status: 400 },
    );
  }

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

  const validation = validateBookingStatusUpdateInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }

  const existing = await getBookingById(idCheck.data.id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Booking not found." } },
      { status: 404 },
    );
  }

  try {
    const updated = await updateBookingStatus(
      idCheck.data.id,
      validation.data.status,
    );
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Booking not found." } },
        { status: 404 },
      );
    }

    if (validation.data.status === "rejected") {
      try {
        await sendBookingRejectedEmail(updated);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(
          "[api/bookings/[id]/status] rejection email failed:",
          err,
        );
      }
    }

    const summary = await getPublicBookingSummary(updated.id);
    return NextResponse.json({ ok: true, data: summary }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/bookings/[id]/status] update failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_UPDATE_FAILED",
          message: "We couldn't update that booking.",
        },
      },
      { status: 500 },
    );
  }
}
