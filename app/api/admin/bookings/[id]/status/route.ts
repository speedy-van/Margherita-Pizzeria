import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAdminBookingDetail,
  updateAdminBookingStatus,
} from "@/lib/admin/queries";
import {
  validateAdminBookingStatusInput,
  validateUuid,
} from "@/lib/admin/validation";
import { getBookingById } from "@/lib/bookings/queries";
import { sendBookingRejectedEmail } from "@/lib/resend/send-booking-rejected";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const idCheck = validateUuid(id);
  if (!idCheck.ok)
    return NextResponse.json({ ok: false, error: idCheck.error }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }
  const validation = validateAdminBookingStatusInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );

  const existing = await getAdminBookingDetail(idCheck.data);
  if (!existing)
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Booking not found." } },
      { status: 404 },
    );

  try {
    const data = await updateAdminBookingStatus(
      idCheck.data,
      validation.data.status,
    );
    if (!data)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Booking not found." } },
        { status: 404 },
      );

    if (validation.data.status === "rejected") {
      try {
        const row = await getBookingById(idCheck.data);
        if (row) await sendBookingRejectedEmail(row);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error("[api/admin/bookings/[id]/status] email failed:", err);
      }
    }
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/bookings/[id]/status] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "STATUS_UPDATE_FAILED", message: "Could not update status." },
      },
      { status: 500 },
    );
  }
}
