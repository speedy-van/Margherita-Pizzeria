import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminBookingDetail } from "@/lib/admin/queries";
import { validateUuid } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const idCheck = validateUuid(id);
  if (!idCheck.ok)
    return NextResponse.json({ ok: false, error: idCheck.error }, { status: 400 });
  try {
    const data = await getAdminBookingDetail(idCheck.data);
    if (!data)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Booking not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/bookings/[id]] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BOOKING_FETCH_FAILED", message: "Could not load booking." },
      },
      { status: 500 },
    );
  }
}
