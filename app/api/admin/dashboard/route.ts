import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAdminDashboardBadges,
  getAdminDashboardStats,
} from "@/lib/admin/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_JSON_HEADERS = {
  "Cache-Control": "private, no-store",
};

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const view = url.searchParams.get("view");
  if (view != null && view !== "badges") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "Unsupported dashboard view.",
        },
      },
      { status: 400, headers: PRIVATE_JSON_HEADERS },
    );
  }

  try {
    const data =
      view === "badges"
        ? await getAdminDashboardBadges()
        : await getAdminDashboardStats();
    return NextResponse.json(
      { ok: true, data },
      { status: 200, headers: PRIVATE_JSON_HEADERS },
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/dashboard] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DASHBOARD_FAILED", message: "Could not load dashboard." },
      },
      { status: 500, headers: PRIVATE_JSON_HEADERS },
    );
  }
}
