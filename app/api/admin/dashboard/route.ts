import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminDashboardStats } from "@/lib/admin/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await getAdminDashboardStats();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/dashboard] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DASHBOARD_FAILED", message: "Could not load dashboard." },
      },
      { status: 500 },
    );
  }
}
