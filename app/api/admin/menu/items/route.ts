import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminMenuItem } from "@/lib/admin/queries";
import { validateCreateMenuItemInput } from "@/lib/validations/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
  const validation = validateCreateMenuItemInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  try {
    const data = await createAdminMenuItem(validation.data);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/menu/items POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "MENU_ITEM_CREATE_FAILED", message: "Could not create item." },
      },
      { status: 500 },
    );
  }
}
