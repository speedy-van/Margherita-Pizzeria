import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createAdminMenuCategory,
  getAdminMenu,
} from "@/lib/admin/queries";
import { validateCreateMenuCategoryInput } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await getAdminMenu();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/menu/categories GET] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "MENU_FAILED", message: "Could not load menu." } },
      { status: 500 },
    );
  }
}

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
  const validation = validateCreateMenuCategoryInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  try {
    const data = await createAdminMenuCategory(validation.data);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/menu/categories POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "CATEGORY_CREATE_FAILED", message: "Could not create category." },
      },
      { status: 500 },
    );
  }
}
