import { NextResponse } from "next/server";

import { getAvailableBookingSlots } from "@/lib/bookings/availability";
import { validateAvailabilityQuery } from "@/lib/bookings/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const validation = validateAvailabilityQuery(url.searchParams);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }

  try {
    const data = await getAvailableBookingSlots(
      validation.data.date,
      validation.data.covers,
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/bookings/availability] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "AVAILABILITY_FETCH_FAILED",
          message: "We couldn't load availability right now.",
        },
      },
      { status: 500 },
    );
  }
}
