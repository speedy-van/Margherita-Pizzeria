import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAdminSettings,
  updateAdminSettings,
} from "@/lib/admin/queries";
import { validateAdminSettingsInput } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await getAdminSettings();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/settings GET] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "SETTINGS_FAILED", message: "Could not load settings." } },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON." } },
      { status: 400 },
    );
  }
  const validation = validateAdminSettingsInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  try {
    const data = await updateAdminSettings(validation.data);
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/settings PUT] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SETTINGS_UPDATE_FAILED", message: "Could not update settings." },
      },
      { status: 500 },
    );
  }
}
