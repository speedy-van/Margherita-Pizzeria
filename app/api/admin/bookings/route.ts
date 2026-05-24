import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminBookings } from "@/lib/admin/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await getAdminBookings();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/bookings] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BOOKINGS_FAILED", message: "Could not load bookings." },
      },
      { status: 500 },
    );
  }
}
