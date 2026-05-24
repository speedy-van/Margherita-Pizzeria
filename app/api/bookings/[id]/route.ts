import { NextResponse } from "next/server";

import { getPublicBookingSummary } from "@/lib/bookings/queries";
import { validateBookingId } from "@/lib/bookings/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const validation = validateBookingId(id);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 },
    );
  }
  try {
    const summary = await getPublicBookingSummary(validation.data.id);
    if (!summary) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Booking not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, data: summary }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/bookings/[id]] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_FETCH_FAILED",
          message: "We couldn't load that booking right now.",
        },
      },
      { status: 500 },
    );
  }
}
